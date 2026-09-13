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

/**
 * Raised when a delivery is refused because the agent's recorded stock won't
 * cover the order. Over-booking is allowed at confirmation, so this is how the
 * office finds out a promise has met an empty shelf, and it is the signal to
 * restock the agent (or correct their recorded stock).
 *
 * De-duplicated per agent: one OPEN alert per agent at a time, so an agent
 * retrying the same delivery doesn't flood the queue. The full picture lives on
 * the over-booked agents panel; this is only the nudge.
 *
 * Never throws — a notification failure must not turn a clean refusal into a 500.
 */
export async function notifyAgentStockShortfall(args: {
  agentId: string;
  agentName: string | null;
  orderId: string;
  orderNumber: string;
  shortfalls: { productName: string; needed: number; have: number }[];
}): Promise<void> {
  try {
    const existing = await prisma.notification.findFirst({
      where: {
        type: "agent_stock_shortfall",
        entityType: "Agent",
        entityId: args.agentId,
        isRead: false,
      },
      select: { id: true },
    });
    if (existing) return;

    const recipients = await prisma.user.findMany({
      where: { role: { in: ["INVENTORY_MANAGER", "LOGISTICS_MANAGER"] }, isActive: true },
      select: { id: true },
    });
    if (recipients.length === 0) return;

    const detail = args.shortfalls
      .map((s) => `${s.productName} (need ${s.needed}, has ${s.have})`)
      .join("; ");

    await prisma.notification.createMany({
      data: recipients.map((u) => ({
        recipientId: u.id,
        title: "Delivery blocked — agent stock short",
        message: `${args.agentName ?? "An agent"} could not deliver order ${args.orderNumber}: ${detail}. Restock the agent, or correct their recorded stock under Agent Stock Correction.`,
        type: "agent_stock_shortfall",
        link: "/inventory/agent-stock",
        entityType: "Agent",
        entityId: args.agentId,
      })),
    });
  } catch (err) {
    console.error("[notifyAgentStockShortfall] failed:", err);
  }
}
