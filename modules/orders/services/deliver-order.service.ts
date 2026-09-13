import { prisma } from "@/lib/db/prisma";
import { lockAgent } from "@/modules/delivery/services/agents.service";
import { notifyAgentStockShortfall } from "@/modules/delivery/services/notifications.service";
import { debitAgentForDelivery } from "@/modules/inventory/services/stock-level.service";
import { recordDeliveryFeeEntry } from "@/modules/finance/services/agent-settlement.service";

/**
 * The single "mark delivered" write path, shared by all four roles that can do it
 * (delivery agent, admin, sales manager, data analyst). The mirror image of
 * `undo-delivery.service.ts`; the callers keep their own auth, delivery-code
 * check, delivered-date resolution, WhatsApp send and audit logging.
 *
 * Delivery is where agent stock is actually CONSUMED, and — since assignment
 * deliberately allows an agent to be over-booked so a newer, more urgent order is
 * never blocked by an older booking — it is also the ONLY hard guard against a
 * negative balance. It therefore refuses rather than overdrawing the agent.
 *
 * One transaction does four things (undone together by `undoOrderDelivery`):
 *   1. per-agent advisory lock, so this serialises with the confirm/undo paths
 *   2. agent StockLevel debited, with a zero floor
 *   3. Order.status  CONFIRMED -> DELIVERED  (conditional: a double-submit is a no-op)
 *   4. Delivery rows -> DELIVERED, deliveredTime stamped
 *
 * The agent ledger entry is recorded after the transaction (idempotent), exactly
 * where the four callers had it.
 */

export type DeliveryShortfall = { productName: string; needed: number; have: number };

export type DeliverOrderResult =
  | { ok: true; orderNumber: string; salesRepId: string; agentId: string | null }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "not_confirmed" }
  | {
      ok: false;
      reason: "insufficient_agent_stock";
      agentName: string | null;
      shortfalls: DeliveryShortfall[];
    };

/**
 * Thrown only to roll the transaction back while carrying the reason out with it.
 * Returning the reason normally would COMMIT the transaction - and in the raced
 * case the stock has already been debited by then. Never escapes this module.
 */
class AbortDelivery extends Error {
  constructor(readonly outcome: DeliverOrderResult) {
    super("delivery aborted");
  }
}

export async function deliverOrder(args: {
  orderId: string;
  deliveredAt: Date;
}): Promise<DeliverOrderResult> {
  const order = await prisma.order.findFirst({
    where: { id: args.orderId, deletedAt: null },
    select: {
      id: true,
      orderNumber: true,
      salesRepId: true,
      agentId: true,
      status: true,
      netAmount: true,
      agent: { select: { companyName: true } },
      items: {
        select: { productId: true, quantity: true, product: { select: { name: true } } },
      },
    },
  });

  if (!order) return { ok: false, reason: "not_found" };
  if (order.status !== "CONFIRMED") return { ok: false, reason: "not_confirmed" };

  const nameOf = new Map(order.items.map((i) => [i.productId, i.product.name]));

  try {
    await prisma.$transaction(
      async (tx) => {
        if (order.agentId) {
          await lockAgent(tx, order.agentId);

          const debit = await debitAgentForDelivery(tx, order.agentId, order.items);
          if (!debit.ok) {
            throw new AbortDelivery({
              ok: false,
              reason: "insufficient_agent_stock",
              agentName: order.agent?.companyName ?? null,
              shortfalls: debit.shortfalls.map((s) => ({
                productName: nameOf.get(s.productId) ?? "this product",
                needed: s.needed,
                have: s.have,
              })),
            });
          }
        }

        // The CONFIRMED check above ran outside this transaction, so this guarded
        // flip is what actually makes a double-submit a no-op rather than a second
        // debit of the same units.
        const flipped = await tx.order.updateMany({
          where: { id: order.id, status: "CONFIRMED" },
          data: { status: "DELIVERED" },
        });
        if (flipped.count === 0) {
          throw new AbortDelivery({ ok: false, reason: "not_confirmed" });
        }

        await tx.delivery.updateMany({
          where: { orderId: order.id },
          data: { status: "DELIVERED", deliveredTime: args.deliveredAt },
        });
      },
      // One round-trip per order line on Neon's WebSocket pool, so a large order
      // can crowd the 5s default. Same headroom `undoOrderDelivery` gives itself.
      { timeout: 20_000, maxWait: 10_000 },
    );
  } catch (err) {
    if (!(err instanceof AbortDelivery)) throw err;
    const outcome = err.outcome;

    if (!outcome.ok && outcome.reason === "insufficient_agent_stock" && order.agentId) {
      // The office needs to know a promise met an empty shelf. This never throws,
      // so a notification problem can't change the answer the agent sees.
      await notifyAgentStockShortfall({
        agentId: order.agentId,
        agentName: outcome.agentName,
        orderId: order.id,
        orderNumber: order.orderNumber,
        shortfalls: outcome.shortfalls,
      });
    }
    return outcome;
  }

  if (order.agentId) {
    await recordDeliveryFeeEntry({
      agentId: order.agentId,
      netAmount: Number(order.netAmount),
      orderNumber: order.orderNumber,
      // Date the funding on the delivery day (when the agent collected the cash),
      // not the order's original date.
      date: args.deliveredAt,
    });
  }

  return {
    ok: true,
    orderNumber: order.orderNumber,
    salesRepId: order.salesRepId,
    agentId: order.agentId,
  };
}

/**
 * The user-facing refusal text. Two audiences: the agent standing at the
 * customer's door (told what to do right now) and the office (told where to fix
 * it). Every caller goes through this so the same refusal reads the same way.
 */
export function deliveryRefusalMessage(
  result: Extract<DeliverOrderResult, { ok: false }>,
  audience: "agent" | "office",
): string {
  switch (result.reason) {
    case "not_found":
      return "Order not found";

    case "not_confirmed":
      return "Only confirmed orders can be marked as delivered";

    case "insufficient_agent_stock": {
      const detail = result.shortfalls
        .map((s) =>
          audience === "agent"
            ? `${s.productName} (need ${s.needed}, you have ${s.have})`
            : `${s.productName} (need ${s.needed}, has ${s.have})`,
        )
        .join("; ");

      if (audience === "agent") {
        return `Can't complete this delivery - your recorded stock is short: ${detail}. The office has been notified. Ask inventory to record the stock you received, then try again.`;
      }
      return `${result.agentName ?? "The assigned agent"}'s recorded stock is short for this order: ${detail}. Record the agent's stock under Inventory > Agent Stock Correction, or reassign the order, then mark it delivered.`;
    }
  }
}
