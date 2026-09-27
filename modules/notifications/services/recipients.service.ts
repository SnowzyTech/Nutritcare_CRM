import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Who a notification goes to. Any combination; the union is de-duplicated and
 * narrowed to users who can actually sign in (active + APPROVED), so a
 * suspended rep or a removed agent never gets alerts.
 */
export interface NotificationRecipients {
  userIds?: (string | null | undefined)[];
  /** The login(s) of an external delivery agent (`User.agentId`). An agent with no login resolves to nobody. */
  agentId?: string | null;
  roles?: UserRole[];
}

export async function resolveRecipientIds(
  to: NotificationRecipients,
  excludeUserId?: string | null,
): Promise<string[]> {
  const ids = (to.userIds ?? []).filter((id): id is string => Boolean(id));
  const or: object[] = [];
  if (ids.length > 0) or.push({ id: { in: ids } });
  if (to.agentId) or.push({ agentId: to.agentId });
  if (to.roles && to.roles.length > 0) or.push({ role: { in: to.roles } });
  if (or.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { OR: or, isActive: true, accountActivationStatus: "APPROVED" },
    select: { id: true },
  });
  return users.map((u) => u.id).filter((id) => id !== excludeUserId);
}
