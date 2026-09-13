import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  checkAgentOnHandStock,
  lockAgent,
} from "@/modules/delivery/services/agents.service";

export type ReassignAgentResult =
  | {
      ok: true;
      order: { orderNumber: string; salesRepId: string; previousStatus: OrderStatus };
    }
  | { ok: false; reason: "not_reassignable" | "no_stock" };

/**
 * Moves an order to a different delivery agent. Shared by every role allowed to
 * reassign (sales-manager, data-analyst team-lead, ...); the calling action owns
 * auth, activity logging and revalidation.
 *
 * Only CONFIRMED or FAILED orders can be reassigned. A FAILED order is revived to
 * CONFIRMED so the new agent can complete it.
 *
 * When `verifyStock` is true the move runs under the target agent's advisory lock
 * and is rejected if that agent is not holding enough stock. Admin overrides pass
 * `verifyStock: false`.
 */
export async function reassignAgentForOrder(
  orderId: string,
  agentId: string,
  opts: { verifyStock: boolean },
): Promise<ReassignAgentResult> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: {
      orderNumber: true,
      salesRepId: true,
      status: true,
      items: { select: { productId: true, quantity: true } },
    },
  });
  if (!order || (order.status !== "CONFIRMED" && order.status !== "FAILED")) {
    return { ok: false, reason: "not_reassignable" };
  }

  const data = {
    agentId,
    ...(order.status === "FAILED" ? { status: "CONFIRMED" as const } : {}),
  };

  if (!opts.verifyStock) {
    await prisma.order.update({ where: { id: orderId }, data });
    return {
      ok: true,
      order: {
        orderNumber: order.orderNumber,
        salesRepId: order.salesRepId,
        previousStatus: order.status,
      },
    };
  }

  // Verify the TARGET agent is HOLDING the goods, under its lock, before moving
  // the order. On-hand, not on-hand minus bookings: what that agent has already
  // promised elsewhere must not block the move (over-booking is legal and is
  // caught at delivery), but the goods do have to physically be on their shelf.
  let hasStock = true;
  await prisma.$transaction(async (tx) => {
    await lockAgent(tx, agentId);
    const check = await checkAgentOnHandStock(tx, agentId, order.items);
    hasStock = check.ok;
    if (!hasStock) return; // leave the order untouched
    await tx.order.update({ where: { id: orderId }, data });
  });

  if (!hasStock) return { ok: false, reason: "no_stock" };

  return {
    ok: true,
    order: {
      orderNumber: order.orderNumber,
      salesRepId: order.salesRepId,
      previousStatus: order.status,
    },
  };
}
