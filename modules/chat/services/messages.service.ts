import { prisma } from "@/lib/db/prisma";
import {
  extractMentionUserIds,
  extractOrderIds,
  toPlainText,
} from "@/lib/chat/tokens";

const PAGE_SIZE = 30;
const AROUND_RADIUS = 15; // messages fetched on each side when flying to an anchor

const messageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  type: true,
  body: true,
  imageUrl: true,
  replyToId: true,
  replyPreview: true,
  replySender: true,
  editedAt: true,
  deletedAt: true,
  createdAt: true,
  sender: { select: { id: true, name: true, avatarUrl: true } },
} as const;

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderName: string | null;
  senderAvatar: string | null;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  body: string;
  imageUrl: string | null;
  replyToId: string | null;
  replyPreview: string | null;
  replySender: string | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
};

type RawMessage = {
  id: string;
  conversationId: string;
  senderId: string | null;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  body: string;
  imageUrl: string | null;
  replyToId: string | null;
  replyPreview: string | null;
  replySender: string | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  sender: { id: string; name: string; avatarUrl: string | null } | null;
};

function toChatMessage(m: RawMessage): ChatMessage {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    senderName: m.sender?.name ?? null,
    senderAvatar: m.sender?.avatarUrl ?? null,
    type: m.type,
    body: m.deletedAt ? "" : m.body,
    imageUrl: m.deletedAt ? null : m.imageUrl,
    replyToId: m.replyToId,
    replyPreview: m.replyPreview,
    replySender: m.replySender,
    editedAt: m.editedAt,
    deletedAt: m.deletedAt,
    createdAt: m.createdAt,
  };
}

async function assertMember(conversationId: string, userId: string) {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { id: true },
  });
  if (!member) throw new Error("You are not a member of this conversation.");
  return member;
}

/**
 * Cursor-paginated thread load (newest first), guarded by membership. The
 * cursor is a message id; results use the (conversationId, createdAt) index.
 */
export async function getMessages(
  conversationId: string,
  userId: string,
  cursor?: string
): Promise<{ messages: ChatMessage[]; nextCursor: string | null }> {
  await assertMember(conversationId, userId);

  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: messageSelect,
  });

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  // Return ascending (oldest → newest) for natural rendering.
  return {
    messages: page.map(toChatMessage).reverse(),
    nextCursor,
  };
}

/**
 * Load a window of messages centered on an anchor message — powers "fly to" a
 * replied/mentioned message that isn't in the currently loaded page.
 */
export async function getMessagesAround(
  conversationId: string,
  userId: string,
  anchorMessageId: string
): Promise<{ messages: ChatMessage[] } | null> {
  await assertMember(conversationId, userId);

  const anchor = await prisma.message.findFirst({
    where: { id: anchorMessageId, conversationId },
    select: { createdAt: true },
  });
  if (!anchor) return null;

  const [before, after] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId, createdAt: { lte: anchor.createdAt } },
      orderBy: { createdAt: "desc" },
      take: AROUND_RADIUS + 1,
      select: messageSelect,
    }),
    prisma.message.findMany({
      where: { conversationId, createdAt: { gt: anchor.createdAt } },
      orderBy: { createdAt: "asc" },
      take: AROUND_RADIUS,
      select: messageSelect,
    }),
  ]);

  const ordered = [...before.reverse(), ...after];
  return { messages: ordered.map(toChatMessage) };
}

export type SendMessageInput = {
  conversationId: string;
  senderId: string;
  body: string;
  imageUrl?: string | null;
  replyToId?: string | null;
};

/**
 * Authoritative message write. One transaction:
 *   1. guard membership + not archived
 *   2. validate tokens (mentions must be members; orders must exist)
 *   3. create message (+ denormalized reply preview)
 *   4. create mention / order-ref rows
 *   5. bump unread counters for all other members (single updateMany)
 *   6. flag mentioned members (single scoped updateMany)
 *   7. refresh conversation's denormalized last-message fields
 */
export async function sendMessage(input: SendMessageInput): Promise<ChatMessage> {
  const { conversationId, senderId } = input;
  const body = input.body.trim();
  const imageUrl = input.imageUrl ?? null;

  if (!body && !imageUrl) throw new Error("Message is empty.");

  return prisma.$transaction(async (tx) => {
    const member = await tx.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
      select: { id: true, conversation: { select: { isArchived: true } } },
    });
    if (!member) throw new Error("You are not a member of this conversation.");
    if (member.conversation.isArchived)
      throw new Error("This conversation is archived.");

    // Resolve tokens server-side — never trust a client-supplied entity list.
    const mentionIds = extractMentionUserIds(body);
    const orderIds = extractOrderIds(body);

    const validMentionIds =
      mentionIds.length > 0
        ? (
            await tx.conversationMember.findMany({
              where: { conversationId, userId: { in: mentionIds } },
              select: { userId: true },
            })
          ).map((m) => m.userId)
        : [];

    const validOrderIds =
      orderIds.length > 0
        ? (
            await tx.order.findMany({
              where: { id: { in: orderIds } },
              select: { id: true },
            })
          ).map((o) => o.id)
        : [];

    // Denormalized reply preview.
    let replyPreview: string | null = null;
    let replySender: string | null = null;
    if (input.replyToId) {
      const parent = await tx.message.findFirst({
        where: { id: input.replyToId, conversationId },
        select: {
          body: true,
          imageUrl: true,
          type: true,
          sender: { select: { name: true } },
        },
      });
      if (parent) {
        replySender = parent.sender?.name ?? "System";
        replyPreview =
          parent.type === "IMAGE" && !parent.body ? "📷 Photo" : toPlainText(parent.body);
      }
    }

    const message = await tx.message.create({
      data: {
        conversationId,
        senderId,
        type: imageUrl ? "IMAGE" : "TEXT",
        body,
        imageUrl,
        replyToId: input.replyToId ?? null,
        replyPreview,
        replySender,
        mentions:
          validMentionIds.length > 0
            ? {
                create: validMentionIds.map((userId) => ({
                  userId,
                  conversationId,
                })),
              }
            : undefined,
        orderRefs:
          validOrderIds.length > 0
            ? { create: validOrderIds.map((orderId) => ({ orderId })) }
            : undefined,
      },
      select: messageSelect,
    });

    // Bump unread for everyone except the sender — one query, group-size agnostic.
    await tx.conversationMember.updateMany({
      where: { conversationId, userId: { not: senderId } },
      data: { unreadCount: { increment: 1 } },
    });

    // Flag mentioned members (drives the "@" glyph in their list).
    if (validMentionIds.length > 0) {
      await tx.conversationMember.updateMany({
        where: { conversationId, userId: { in: validMentionIds } },
        data: { hasUnreadMention: true },
      });
    }

    const preview = imageUrl && !body ? "📷 Photo" : toPlainText(body);
    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: message.createdAt,
        lastMessagePreview: preview.slice(0, 140),
        lastMessageSender: message.sender?.name ?? null,
      },
    });

    return toChatMessage(message);
  });
}

/** Reset the opening member's unread counters + mention flag. */
export async function markConversationRead(conversationId: string, userId: string) {
  await prisma.conversationMember.updateMany({
    where: { conversationId, userId },
    data: { unreadCount: 0, hasUnreadMention: false, lastReadAt: new Date() },
  });
}

/**
 * The earliest message (after the user's last read) where they were mentioned —
 * the target the list's "@" glyph flies to.
 */
export async function findFirstUnreadMention(
  conversationId: string,
  userId: string
): Promise<string | null> {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { lastReadAt: true },
  });
  if (!member) return null;

  const mention = await prisma.messageMention.findFirst({
    where: {
      conversationId,
      userId,
      ...(member.lastReadAt ? { message: { createdAt: { gt: member.lastReadAt } } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { messageId: true },
  });
  return mention?.messageId ?? null;
}
