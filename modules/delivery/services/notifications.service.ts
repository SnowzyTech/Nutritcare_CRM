import { prisma } from "@/lib/db/prisma";
import { notify } from "@/modules/notifications/services/notify.service";

// The generic notification reads/writes live in modules/notifications/. This
// file keeps only the delivery-domain alert below.

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

    const detail = args.shortfalls
      .map((s) => `${s.productName} (need ${s.needed}, has ${s.have})`)
      .join("; ");

    await notify({
      type: "agent_stock_shortfall",
      vars: {
        title: "Delivery blocked — agent stock short",
        message: `${args.agentName ?? "An agent"} could not deliver order ${args.orderNumber}: ${detail}. Restock the agent, or correct their recorded stock under Agent Stock Correction.`,
        link: "/inventory/agent-stock",
      },
      to: { roles: ["INVENTORY_MANAGER", "LOGISTICS_MANAGER"] },
      entityType: "Agent",
      entityId: args.agentId,
    });
  } catch (err) {
    console.error("[notifyAgentStockShortfall] failed:", err);
  }
}
