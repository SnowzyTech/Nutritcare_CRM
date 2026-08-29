import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { rolesForDepartment } from "@/lib/staff-departments";
import {
  fetchMessagesPageUnguarded,
  type ChatMessage,
} from "./messages.service";

/**
 * Super-admin chat oversight — STRICTLY READ-ONLY.
 *
 * `/chat` gates every read on `ConversationMember`, which by design means no one
 * can read a DM they aren't part of. This service is the one deliberate
 * exception: it lets a SUPER_ADMIN read a staff member's DIRECT conversations
 * without being seated in them.
 *
 * Two invariants hold everywhere below and must keep holding:
 *   1. **No writes.** Never touch `unreadCount` / `hasUnreadMention` /
 *      `lastReadAt`, never create a `ConversationMember`. Reading a transcript
 *      must be invisible to the people in it.
 *   2. **Scoped to the staff member.** Every thread read asserts the
 *      conversation is DIRECT *and* that the named staff user is a member, so a
 *      hand-edited URL can't surface an unrelated thread (or an agent group)
 *      under someone else's name.
 *
 * Authorization (is the caller a SUPER_ADMIN?) lives in the callers — the page
 * layout and the server action — not here.
 */

/** Only DMs that have actually been used; an opened-but-empty DM is not history. */
const USED_DIRECT: Prisma.ConversationWhereInput = {
  type: "DIRECT",
  lastMessageAt: { not: null },
};

export type OversightStaff = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  /** DM threads this person has taken part in. */
  dmCount: number;
};

export type OversightPerson = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
};

export type OversightThreadListItem = {
  conversationId: string;
  peer: OversightPerson | null;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  lastMessageSender: string | null;
  messageCount: number;
};

export type OversightThread = {
  conversationId: string;
  staff: OversightPerson;
  peer: OversightPerson | null;
  messages: ChatMessage[];
  nextCursor: string | null;
};

/**
 * Staff directory for the oversight landing page, with each person's DM count.
 *
 * The counts come from a single `groupBy` over `conversation_members` rather
 * than a per-user count — one indexed round-trip regardless of headcount, per
 * `docs/scale-considerations.md`.
 */
export async function listOversightStaff(filters: {
  q?: string;
  department?: string;
}): Promise<OversightStaff[]> {
  const where: Prisma.UserWhereInput = {
    isActive: true,
    accountActivationStatus: "APPROVED",
  };

  if (filters.department && filters.department !== "ALL") {
    const roles = rolesForDepartment(filters.department);
    // An unknown department value must not silently widen to "everyone".
    if (roles.length === 0) return [];
    where.role = { in: roles as UserRole[] };
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [users, dmCounts] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true, avatarUrl: true },
    }),
    prisma.conversationMember.groupBy({
      by: ["userId"],
      where: { conversation: USED_DIRECT },
      _count: { _all: true },
    }),
  ]);

  const countByUser = new Map(dmCounts.map((r) => [r.userId, r._count._all]));

  return users.map((u) => ({
    ...u,
    dmCount: countByUser.get(u.id) ?? 0,
  }));
}

/** The staff member's identity card for the oversight header. Null if unknown. */
export async function getOversightStaff(
  staffUserId: string
): Promise<OversightPerson | null> {
  return prisma.user.findUnique({
    where: { id: staffUserId },
    select: { id: true, name: true, role: true, avatarUrl: true },
  });
}

/**
 * Every DIRECT thread the staff member has taken part in, newest first.
 * Rides `ConversationMember @@index([userId])`; the peer comes back in the same
 * round-trip via the filtered nested select.
 *
 * Deliberately omits `unreadCount` / `hasUnreadMention` / `lastReadAt` — the
 * staff member's read state is theirs, not oversight material.
 */
export async function listDirectThreadsForStaff(
  staffUserId: string
): Promise<OversightThreadListItem[]> {
  const rows = await prisma.conversationMember.findMany({
    where: { userId: staffUserId, conversation: USED_DIRECT },
    select: {
      conversation: {
        select: {
          id: true,
          lastMessageAt: true,
          lastMessagePreview: true,
          lastMessageSender: true,
          _count: { select: { messages: true } },
          members: {
            where: { userId: { not: staffUserId } },
            take: 1,
            select: {
              user: { select: { id: true, name: true, role: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  });

  return rows
    .map((row) => {
      const c = row.conversation;
      return {
        conversationId: c.id,
        peer: c.members[0]?.user ?? null,
        lastMessageAt: c.lastMessageAt,
        lastMessagePreview: c.lastMessagePreview,
        lastMessageSender: c.lastMessageSender,
        messageCount: c._count.messages,
      };
    })
    .sort(
      (a, b) =>
        (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0)
    );
}

/**
 * Assert the conversation is a DIRECT thread the staff member belongs to.
 * Returns the two participants, or null when the pairing doesn't hold — the
 * single choke point behind both thread reads below.
 */
async function resolveScopedThread(
  conversationId: string,
  staffUserId: string
): Promise<{ staff: OversightPerson; peer: OversightPerson | null } | null> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, type: "DIRECT", members: { some: { userId: staffUserId } } },
    select: {
      members: {
        select: {
          user: { select: { id: true, name: true, role: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!conversation) return null;

  const staff = conversation.members.find((m) => m.user.id === staffUserId)?.user;
  if (!staff) return null;
  const peer = conversation.members.find((m) => m.user.id !== staffUserId)?.user ?? null;

  return { staff, peer };
}

/** First page of a staff member's DM transcript. Null when out of scope. */
export async function getOversightThread(
  conversationId: string,
  staffUserId: string
): Promise<OversightThread | null> {
  const scope = await resolveScopedThread(conversationId, staffUserId);
  if (!scope) return null;

  const page = await fetchMessagesPageUnguarded(conversationId);

  return {
    conversationId,
    staff: scope.staff,
    peer: scope.peer,
    messages: page.messages,
    nextCursor: page.nextCursor,
  };
}

/**
 * An older page of the same transcript. Re-checks the scope on every call — the
 * cursor arrives from the client, so nothing here may be taken on trust.
 */
export async function getOversightMessagesPage(
  conversationId: string,
  staffUserId: string,
  cursor?: string
): Promise<{ messages: ChatMessage[]; nextCursor: string | null } | null> {
  const scope = await resolveScopedThread(conversationId, staffUserId);
  if (!scope) return null;
  return fetchMessagesPageUnguarded(conversationId, cursor);
}
