import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Conversation membership rule:
 *   AGENT_GROUP — each Agent ⇒ one conversation. Members = the DELIVERY_AGENT
 *   user linked to that agent + every active non-DELIVERY_AGENT user. Other
 *   delivery agents are excluded.
 *
 *   DIRECT — exactly two members, any two active users (no role restriction).
 *   Identity is `directKey` (the sorted id pair), which is what makes
 *   get-or-create idempotent across concurrent opens.
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

/** Sorted pair key, so (a,b) and (b,a) always resolve to the same row. */
function directKeyFor(a: string, b: string): string {
  return [a, b].sort().join(":");
}

/**
 * Get — or create on first use — the 1:1 conversation between two users.
 * Idempotent: the unique `directKey` means two concurrent opens (two tabs, or
 * both people clicking at once) converge on one row instead of racing into two.
 */
export async function getOrCreateDirectConversation(
  meId: string,
  peerId: string
): Promise<string> {
  if (meId === peerId) throw new Error("You cannot message yourself.");

  const directKey = directKeyFor(meId, peerId);

  const existing = await prisma.conversation.findUnique({
    where: { directKey },
    select: { id: true },
  });
  if (existing) return existing.id;

  const peer = await prisma.user.findFirst({
    where: { id: peerId, isActive: true, accountActivationStatus: "APPROVED" },
    select: { id: true },
  });
  if (!peer) throw new Error("User not found.");

  try {
    const conversation = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        directKey,
        members: {
          create: [{ userId: meId }, { userId: peerId }],
        },
      },
      select: { id: true },
    });
    return conversation.id;
  } catch (e) {
    // P2002 = someone won the race on `directKey`; their row is the winner.
    if (
      typeof e === "object" &&
      e !== null &&
      (e as { code?: string }).code === "P2002"
    ) {
      const winner = await prisma.conversation.findUnique({
        where: { directKey },
        select: { id: true },
      });
      if (winner) return winner.id;
    }
    throw e;
  }
}

export type DirectoryUser = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
};

/**
 * People picker for starting a DM — every active, approved user except the
 * searcher. An empty query returns the first page by name so the picker has
 * something to show the moment it opens.
 */
export async function searchDirectory(
  meId: string,
  q: string
): Promise<DirectoryUser[]> {
  const users = await prisma.user.findMany({
    where: {
      id: { not: meId },
      isActive: true,
      accountActivationStatus: "APPROVED",
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    },
    take: 12,
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true, avatarUrl: true },
  });
  return users;
}

export type ConversationListItem = {
  id: string;
  /** Display name: the agent's company name, or the other person for a DM. */
  title: string;
  type: "AGENT_GROUP" | "DIRECT";
  /** The other member — populated for DIRECT only. */
  peer: DirectoryUser | null;
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
 * Shared shape for the list query. The nested `members` select pulls the other
 * participant in the same round-trip, so DM titles/avatars cost no extra query.
 */
function listItemSelect(userId: string) {
  return {
    unreadCount: true,
    hasUnreadMention: true,
    conversation: {
      select: {
        id: true,
        type: true,
        title: true,
        agentId: true,
        isArchived: true,
        lastMessageAt: true,
        lastMessagePreview: true,
        lastMessageSender: true,
        agent: { select: { state: true } },
        members: {
          where: { userId: { not: userId } },
          take: 1,
          select: {
            user: { select: { id: true, name: true, role: true, avatarUrl: true } },
          },
        },
      },
    },
  } as const;
}

type ListItemRow = {
  unreadCount: number;
  hasUnreadMention: boolean;
  conversation: {
    id: string;
    type: "AGENT_GROUP" | "DIRECT";
    title: string | null;
    agentId: string | null;
    isArchived: boolean;
    lastMessageAt: Date | null;
    lastMessagePreview: string | null;
    lastMessageSender: string | null;
    agent: { state: string | null } | null;
    members: { user: DirectoryUser }[];
  };
};

function toListItem(row: ListItemRow): ConversationListItem {
  const c = row.conversation;
  const isDirect = c.type === "DIRECT";
  const peer = isDirect ? c.members[0]?.user ?? null : null;
  return {
    id: c.id,
    title: isDirect ? peer?.name ?? "Direct message" : c.title ?? "Conversation",
    type: c.type,
    peer,
    agentId: c.agentId,
    isArchived: c.isArchived,
    lastMessageAt: c.lastMessageAt,
    lastMessagePreview: c.lastMessagePreview,
    lastMessageSender: c.lastMessageSender,
    unreadCount: row.unreadCount,
    hasUnreadMention: row.hasUnreadMention,
    agentState: c.agent?.state ?? null,
    agentAvatar: isDirect ? peer?.avatarUrl ?? null : null,
  };
}

/**
 * The conversation list for a user — a single indexed query over their member
 * rows. Unread count + mention flag come straight off the denormalized member
 * row, so no message scanning happens here.
 */
export async function listConversationsForUser(
  userId: string
): Promise<ConversationListItem[]> {
  const members = await prisma.conversationMember.findMany({
    where: {
      userId,
      // Hide DMs that were opened but never used — the row still exists (and is
      // reachable by URL), it just doesn't clutter the list until someone talks.
      NOT: { conversation: { type: "DIRECT", lastMessageAt: null } },
    },
    select: listItemSelect(userId),
  });

  return (members as ListItemRow[]).map(toListItem).sort((a, b) => {
    const at = a.lastMessageAt?.getTime() ?? 0;
    const bt = b.lastMessageAt?.getTime() ?? 0;
    return bt - at;
  });
}

/**
 * A single list row, membership-guarded. Lets the client splice in a
 * conversation it has never seen — the first message of a DM someone else just
 * started — without re-rendering the whole server component tree.
 */
export async function getConversationListItem(
  conversationId: string,
  userId: string
): Promise<ConversationListItem | null> {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: listItemSelect(userId),
  });
  if (!member) return null;
  return toListItem(member as ListItemRow);
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
