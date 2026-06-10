import type { Prisma } from "@prisma/client";
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

/** Unguarded page fetch — callers MUST have already proven membership. */
async function fetchMessagesPage(
  conversationId: string,
  cursor?: string
): Promise<{ messages: ChatMessage[]; nextCursor: string | null }> {
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
 * Cursor-paginated thread load (newest first), guarded by membership. The
 * cursor is a message id; results use the (conversationId, createdAt) index.
 */
export async function getMessages(
  conversationId: string,
  userId: string,
  cursor?: string
): Promise<{ messages: ChatMessage[]; nextCursor: string | null }> {
  await assertMember(conversationId, userId);
  return fetchMessagesPage(conversationId, cursor);
}

export type ChatThread = {
  conversation: {
    id: string;
    title: string | null;
    isArchived: boolean;
    agent: { id: string; companyName: string; state: string | null } | null;
  };
  messages: ChatMessage[];
  nextCursor: string | null;
};

/**
 * Single-trip thread load for the page: the membership-guarded header and the
 * first message page run in parallel, so the page does ONE round-trip's worth
 * of wall time instead of (conversation → assertMember → messages) in series.
 * Returns null when the user isn't a member (caller renders notFound).
 */
export async function getThreadForUser(
  conversationId: string,
  userId: string
): Promise<ChatThread | null> {
  const [member, page] = await Promise.all([
    prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: {
        conversation: {
          select: {
            id: true,
            title: true,
            isArchived: true,
            agent: { select: { id: true, companyName: true, state: true } },
          },
        },
      },
    }),
    fetchMessagesPage(conversationId),
  ]);

  if (!member) return null;
  return {
    conversation: member.conversation,
    messages: page.messages,
    nextCursor: page.nextCursor,
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
 * Authoritative message write.
 *
 * The validation READS (membership, mention/order validity, reply parent) run
 * in parallel up front — outside any transaction — instead of as serial
 * statements inside an interactive transaction held open over the Neon
 * WebSocket. Only the WRITES go into a single batched `$transaction([...])`,
 * which the serverless adapter pipelines in one BEGIN/COMMIT. Net effect:
 * a plain text send drops from ~6 serial round-trips to ~2.
 */
export async function sendMessage(input: SendMessageInput): Promise<ChatMessage> {
  const { conversationId, senderId } = input;
  const body = input.body.trim();
  const imageUrl = input.imageUrl ?? null;

  if (!body && !imageUrl) throw new Error("Message is empty.");

  // Resolve tokens server-side — never trust a client-supplied entity list.
  const mentionIds = extractMentionUserIds(body);
  const orderIds = extractOrderIds(body);

  const [member, mentionRows, orderRows, parent] = await Promise.all([
    prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
      select: {
        id: true,
        conversation: { select: { isArchived: true } },
        user: { select: { name: true } },
      },
    }),
    mentionIds.length > 0
      ? prisma.conversationMember.findMany({
          where: { conversationId, userId: { in: mentionIds } },
          select: { userId: true },
        })
      : Promise.resolve<{ userId: string }[]>([]),
    orderIds.length > 0
      ? prisma.order.findMany({ where: { id: { in: orderIds } }, select: { id: true } })
      : Promise.resolve<{ id: string }[]>([]),
    input.replyToId
      ? prisma.message.findFirst({
          where: { id: input.replyToId, conversationId },
          select: {
            body: true,
            imageUrl: true,
            type: true,
            sender: { select: { name: true } },
          },
        })
      : Promise.resolve(null),
  ]);

  if (!member) throw new Error("You are not a member of this conversation.");
  if (member.conversation.isArchived) throw new Error("This conversation is archived.");

  const senderName = member.user?.name ?? null;
  const validMentionIds = mentionRows.map((m) => m.userId);
  const validOrderIds = orderRows.map((o) => o.id);

  // Denormalized reply preview.
  let replyPreview: string | null = null;
  let replySender: string | null = null;
  if (parent) {
    replySender = parent.sender?.name ?? "System";
    replyPreview =
      parent.type === "IMAGE" && !parent.body ? "📷 Photo" : toPlainText(parent.body);
  }

  const now = new Date();
  const preview = imageUrl && !body ? "📷 Photo" : toPlainText(body);

  const writes: Prisma.PrismaPromise<unknown>[] = [
    prisma.message.create({
      data: {
        conversationId,
        senderId,
        type: imageUrl ? "IMAGE" : "TEXT",
        body,
        imageUrl,
        createdAt: now,
        replyToId: input.replyToId ?? null,
        replyPreview,
        replySender,
        mentions:
          validMentionIds.length > 0
            ? { create: validMentionIds.map((userId) => ({ userId, conversationId })) }
            : undefined,
        orderRefs:
          validOrderIds.length > 0
            ? { create: validOrderIds.map((orderId) => ({ orderId })) }
            : undefined,
      },
      select: messageSelect,
    }),
    // Bump unread for everyone except the sender — one query, group-size agnostic.
    prisma.conversationMember.updateMany({
      where: { conversationId, userId: { not: senderId } },
      data: { unreadCount: { increment: 1 } },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: now,
        lastMessagePreview: preview.slice(0, 140),
        lastMessageSender: senderName,
      },
    }),
  ];

  // Flag mentioned members (drives the "@" glyph in their list).
  if (validMentionIds.length > 0) {
    writes.push(
      prisma.conversationMember.updateMany({
        where: { conversationId, userId: { in: validMentionIds } },
        data: { hasUnreadMention: true },
      })
    );
  }

  const [message] = await prisma.$transaction(writes);
  return toChatMessage(message as RawMessage);
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
