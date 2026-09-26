import { prisma } from "@/lib/db/prisma";

export const NOTIFICATION_PAGE_SIZE = 20;

export interface NotificationListItem {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

export interface NotificationPage {
  items: NotificationListItem[];
  /** Pass back to fetch the next page; null when there are no more. */
  nextCursor: string | null;
}

const LIST_SELECT = {
  id: true,
  title: true,
  message: true,
  type: true,
  priority: true,
  isRead: true,
  link: true,
  createdAt: true,
} as const;

/** Newest first, cursor-paginated (the list is unbounded). */
export async function getUserNotifications(
  userId: string,
  opts: { cursor?: string | null; take?: number } = {},
): Promise<NotificationPage> {
  const take = Math.min(Math.max(opts.take ?? NOTIFICATION_PAGE_SIZE, 1), 50);
  const rows = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    select: LIST_SELECT,
  });
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { recipientId: userId, isRead: false } });
}

/** Scoped to the recipient, so one user can never mark another's. */
export async function markNotificationRead(userId: string, id: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id, recipientId: userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}
