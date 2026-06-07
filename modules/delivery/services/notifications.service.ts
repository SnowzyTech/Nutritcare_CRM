import { prisma } from "@/lib/db/prisma";

export async function getUserNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      isRead: true,
      link: true,
      createdAt: true,
    },
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { recipientId: userId, isRead: false },
  });
}
