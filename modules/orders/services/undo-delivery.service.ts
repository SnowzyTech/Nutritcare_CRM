import { prisma } from "@/lib/db/prisma";
import { lockAgent } from "@/modules/delivery/services/agents.service";
import { creditAgentForDelivery } from "@/modules/inventory/services/stock-level.service";
import { reverseDeliveryFeeEntry } from "@/modules/finance/services/agent-settlement.service";

/**
 * Undo of `adminDeliverOrderAction` (and every other "mark delivered" path —
 * delivery agent, sales manager, data analyst — which all write the identical
 * set of side effects). DELIVERED is otherwise terminal, so this is the single
 * admin override that walks an order back to CONFIRMED.
 *
 * Marking an order delivered does four things; undoing it reverses all four in
 * one transaction:
 *   1. Order.status        DELIVERED -> CONFIRMED
 *   2. Delivery rows       DELIVERED -> IN_TRANSIT / PENDING_DISPATCH, deliveredTime cleared
 *   3. Agent StockLevel    the delivered units are credited back to the agent
 *   4. Agent ledger        the DELIVERY_FEE entry is removed and the running-balance chain re-linked
 *
 * Kept as a shared service (like manual-order / upsell-apply) so if another role
 * ever gets the same override, the reversal math is never duplicated.
 */

export type UndoDeliveryResult =
  | {
      ok: true;
      orderNumber: string;
      salesRepId: string;
      /** Ledger amount removed from the agent's balance; null when the order had no agent. */
      reversedAmount: number | null;
    }
  | { ok: false; error: string };

export async function undoOrderDelivery(orderId: string): Promise<UndoDeliveryResult> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: {
      id: true,
      orderNumber: true,
      salesRepId: true,
      agentId: true,
      status: true,
      remittanceStatus: true,
      items: { select: { productId: true, quantity: true } },
    },
  });

  if (!order) return { ok: false, error: "Order not found" };
  if (order.status !== "DELIVERED") {
    return { ok: false, error: "Only delivered orders can be undone" };
  }

  // ── Guards: refuse when the delivery has already been settled downstream ───
  // Reversing then would leave an AgentSettlement or a correction pointing at a
  // ledger row that no longer exists. Accounting has to unwind those first.
  if (order.remittanceStatus === "REMITTED") {
    return {
      ok: false,
      error:
        "This order has already been remitted. Reverse the remittance in Agent Settlement before undoing the delivery.",
    };
  }

  if (order.agentId) {
    const [settledEntry, linkedAdjustment] = await Promise.all([
      prisma.agentLedgerEntry.findFirst({
        where: {
          agentId: order.agentId,
          referenceType: "DELIVERY_FEE",
          referenceId: order.orderNumber,
          settlementId: { not: null },
        },
        select: { id: true },
      }),
      prisma.settlementAdjustment.findFirst({
        where: { agentId: order.agentId, linkedReferenceId: order.orderNumber },
        select: { id: true },
      }),
    ]);

    if (settledEntry) {
      return {
        ok: false,
        error:
          "This order's ledger entry belongs to a settlement. Reverse the settlement before undoing the delivery.",
      };
    }
    if (linkedAdjustment) {
      return {
        ok: false,
        error:
          "A settlement adjustment references this order. Remove the adjustment before undoing the delivery.",
      };
    }
  }

  // ── Reversal ──────────────────────────────────────────────────────────────
  const reversedAmount = await prisma.$transaction(
    async (tx) => {
      // Same per-agent lock the confirm path takes: the ledger cascade below
      // rewrites balances that a concurrent delivery/remittance would otherwise
      // snapshot mid-flight.
      if (order.agentId) await lockAgent(tx, order.agentId);

      await tx.order.update({ where: { id: order.id }, data: { status: "CONFIRMED" } });

      // Walk the delivery rows back to whatever they were before delivery.
      // `truckDriverId` is only ever set by logistics dispatch, so it is the
      // signal that the order had actually been dispatched; without it the row
      // never left PENDING_DISPATCH. Order matters — the first call moves rows
      // off DELIVERED so the second cannot pick them up again.
      await tx.delivery.updateMany({
        where: { orderId: order.id, status: "DELIVERED", truckDriverId: { not: null } },
        data: { status: "IN_TRANSIT", deliveredTime: null },
      });
      await tx.delivery.updateMany({
        where: { orderId: order.id, status: "DELIVERED", truckDriverId: null },
        data: { status: "PENDING_DISPATCH", deliveredTime: null },
      });

      // Put the units back on the agent's shelf, through the exact counterpart of
      // the debit `deliverOrder` applied, so the two can never drift apart.
      if (order.agentId) {
        await creditAgentForDelivery(tx, order.agentId, order.items);
      }

      return order.agentId
        ? await reverseDeliveryFeeEntry(tx, {
            agentId: order.agentId,
            orderNumber: order.orderNumber,
          })
        : null;
    },
    // The ledger cascade is a single UPDATE, but an order with many lines still
    // costs a round-trip each on Neon's WebSocket pool. Matches the headroom
    // rebuildStockLevels gives itself.
    { timeout: 20_000, maxWait: 10_000 },
  );

  return {
    ok: true,
    orderNumber: order.orderNumber,
    salesRepId: order.salesRepId,
    reversedAmount,
  };
}
