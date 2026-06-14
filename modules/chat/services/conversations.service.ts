import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Conversation membership rule:
 *   Each Agent ⇒ one AGENT_GROUP conversation.
 *   Members = the DELIVERY_AGENT user linked to that agent + every active
 *   non-DELIVERY_AGENT user. Other delivery agents are excluded.
 */

/** All active internal (non delivery-agent) user IDs. */
async function internalUserIds(db: Tx | typeof prisma): Promise<string[]> {
  const users = await db.user.findMany({
    where: { isActive: true, role: { not: "DELIVERY_AGENT" } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/**
 * Create the group conversation for a freshly-created agent and seat the new
 * delivery-agent user plus all internal users. Designed to run inside the same
 * transaction as agent creation.
 */
export async function createAgentGroup(
  db: Tx,
  params: { agentId: string; agentName: string; daUserId: string }
): Promise<string> {
  const conversation = await db.conversation.create({
    data: {
      type: "AGENT_GROUP",
      agentId: params.agentId,
      title: params.agentName,
    },
  });

  const memberIds = new Set<string>(await internalUserIds(db));
  memberIds.add(params.daUserId);

  await db.conversationMember.createMany({
    data: [...memberIds].map((userId) => ({
      conversationId: conversation.id,
      userId,
    })),
    skipDuplicates: true,
  });

  await db.message.create({
    data: {
      conversationId: conversation.id,
      type: "SYSTEM",
      body: `Group created for ${params.agentName}.`,
    },
  });

  return conversation.id;
}

/**
 * Add a newly-created internal user to every existing agent group. Safe to run
 * inside or outside a transaction (defaults to the shared client).
 */
export async function addUserToAllAgentGroups(
  userId: string,
  db: Tx | typeof prisma = prisma
): Promise<void> {
  const conversations = await db.conversation.findMany({
    where: { type: "AGENT_GROUP", isArchived: false },
    select: { id: true },
  });
  if (conversations.length === 0) return;

  await db.conversationMember.createMany({
    data: conversations.map((c) => ({ conversationId: c.id, userId })),
    skipDuplicates: true,
  });
}

export type ConversationListItem = {
  id: string;
  title: string;
  agentId: string | null;
  isArchived: boolean;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  lastMessageSender: string | null;
  unreadCount: number;
  hasUnreadMention: boolean;
  agentState: string | null;
  agentAvatar: string | null;
};

/**
 * The conversation list for a user — a single indexed query over their member
 * rows. Unread count + mention flag come straight off the denormalized member
 * row, so no message scanning happens here.
 */
export async function listConversationsForUser(
  userId: string
): Promise<ConversationListItem[]> {
  const members = await prisma.conversationMember.findMany({
    where: { userId },
    select: {
      unreadCount: true,
      hasUnreadMention: true,
      conversation: {
        select: {
          id: true,
          title: true,
          agentId: true,
          isArchived: true,
          lastMessageAt: true,
          lastMessagePreview: true,
          lastMessageSender: true,
          agent: { select: { state: true } },
        },
      },
    },
  });

  return members
    .map((m) => ({
      id: m.conversation.id,
      title: m.conversation.title ?? "Conversation",
      agentId: m.conversation.agentId,
      isArchived: m.conversation.isArchived,
      lastMessageAt: m.conversation.lastMessageAt,
      lastMessagePreview: m.conversation.lastMessagePreview,
      lastMessageSender: m.conversation.lastMessageSender,
      unreadCount: m.unreadCount,
      hasUnreadMention: m.hasUnreadMention,
      agentState: m.conversation.agent?.state ?? null,
      agentAvatar: null,
    }))
    .sort((a, b) => {
      const at = a.lastMessageAt?.getTime() ?? 0;
      const bt = b.lastMessageAt?.getTime() ?? 0;
      return bt - at;
    });
}

/** Total unread across all of a user's conversations (for the nav badge). */
export async function getTotalUnread(userId: string): Promise<number> {
  const rows = await prisma.conversationMember.aggregate({
    where: { userId },
    _sum: { unreadCount: true },
  });
  return rows._sum.unreadCount ?? 0;
}

/** Membership-guarded conversation header. Returns null if not a member. */
export async function getConversationForUser(conversationId: string, userId: string) {
  const member = await prisma.conversationMember.findUnique({
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
  });
  if (!member) return null;
  return member.conversation;
}

/** True if the user belongs to the conversation. */
export async function isMember(conversationId: string, userId: string): Promise<boolean> {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { id: true },
  });
  return !!member;
}
