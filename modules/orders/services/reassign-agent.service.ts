import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  agentHasAvailableStock,
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
 * and is rejected if that agent lacks enough available stock (excluding this order
 * from the committed tally). Admin overrides pass `verifyStock: false`.
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

  // Verify the TARGET agent has enough available stock, under its lock, before
  // moving the order (excludes this order in case it's already on that agent).
  let hasStock = true;
  await prisma.$transaction(async (tx) => {
    await lockAgent(tx, agentId);
    hasStock = await agentHasAvailableStock(tx, agentId, order.items, {
      excludeOrderId: orderId,
    });
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
