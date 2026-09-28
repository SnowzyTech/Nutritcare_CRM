import { prisma } from "@/lib/db/prisma";
import { nextOrderNumber } from "@/modules/orders/services/order-number.service";
import { lockAgent } from "@/modules/delivery/services/agents.service";
import { debitAgentForDelivery } from "@/modules/inventory/services/stock-level.service";
import { recordDeliveryFeeEntry } from "@/modules/finance/services/agent-settlement.service";
import {
  upsertOrderCustomer,
  priceOrderLines,
  type ManualOrderInput,
  type ManualOrderResult,
} from "@/modules/orders/services/manual-order.service";

/**
 * Write path for an AGENT-SOLD order: a delivery agent sold directly to the
 * customer at the point of delivery, so the order has NO sales rep and is
 * ALREADY delivered — it skips the whole PENDING → CONFIRMED → delivery-code →
 * WhatsApp lifecycle and is born `DELIVERED`.
 *
 * It behaves like a normal *delivered* agent order minus rep/confirmation:
 *   - customer upsert + line pricing reuse the shared manual-order helpers
 *     (`upsertOrderCustomer` / `priceOrderLines`), so the money math never diverges;
 *   - the agent's on-hand stock is debited with the same zero floor as
 *     `deliverOrder` (`debitAgentForDelivery`) — the sale already happened, but we
 *     refuse to drive the system negative and surface a shortfall instead;
 *   - the agent ledger entry (`recordDeliveryFeeEntry`) records the money the agent
 *     now owes, feeding remittance/settlement exactly like a real delivery.
 *
 * The caller owns auth, `suppressCameraForRequest()`, audit logging and
 * revalidation. Never throws — returns `{ error }` for the UI.
 */

/** Rolls the create transaction back while carrying a user-facing reason out. */
class AbortAgentOrder extends Error {
  constructor(readonly reason: string) {
    super("agent order aborted");
  }
}

export async function createAgentOrder(
  input: ManualOrderInput,
  opts: { agentId: string; deliveredAt: Date },
): Promise<ManualOrderResult> {
  const { products } = input;

  const agent = await prisma.agent.findFirst({
    where: { id: opts.agentId, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  if (!agent) return { error: "Select an active delivery agent." };

  const customer = await upsertOrderCustomer(input);

  // An agent's negotiated door price is always editable (allowOverride: true).
  const priced = await priceOrderLines(products, { allowOverride: true });
  if ("error" in priced) return priced;
  const { orderItemsData, surplusLines, priceOverrides, totalAmount, mainProductName } = priced;

  try {
    const order = await prisma.$transaction(
      async (tx) => {
        // Serialise with the confirm / deliver / undo paths on this agent.
        await lockAgent(tx, opts.agentId);

        // Zero-floor debit: refuse (roll back) rather than overdraw the agent.
        const debit = await debitAgentForDelivery(tx, opts.agentId, orderItemsData);
        if (!debit.ok) {
          const names = new Map(
            (
              await tx.product.findMany({
                where: { id: { in: debit.shortfalls.map((s) => s.productId) } },
                select: { id: true, name: true },
              })
            ).map((p) => [p.id, p.name]),
          );
          const detail = debit.shortfalls
            .map((s) => `${names.get(s.productId) ?? "this product"} (need ${s.needed}, has ${s.have})`)
            .join("; ");
          throw new AbortAgentOrder(
            `This agent doesn't hold enough stock to cover the sale: ${detail}. Nothing was saved.`,
          );
        }

        const orderNumber = await nextOrderNumber(tx, mainProductName);
        const created = await tx.order.create({
          data: {
            orderNumber,
            customerId: customer.id,
            // No sales rep: the delivery agent sold this directly.
            salesRepId: null,
            agentId: opts.agentId,
            totalAmount,
            netAmount: totalAmount,
            // Born delivered — skips PENDING/CONFIRMED entirely.
            status: "DELIVERED",
            // Back-dated to when the agent actually sold/delivered it.
            date: opts.deliveredAt,
            items: { create: orderItemsData },
          },
          select: { id: true, orderNumber: true },
        });

        // Delivery row born DELIVERED (no delivery code / scheduled time needed).
        await tx.delivery.create({
          data: {
            orderId: created.id,
            agentId: opts.agentId,
            status: "DELIVERED",
            deliveredTime: opts.deliveredAt,
          },
        });

        return created;
      },
      { timeout: 20_000, maxWait: 10_000 },
    );

    // Money the agent now owes — idempotent, dated on the delivery day. Matches
    // exactly what `deliverOrder` records for a normal agent delivery.
    await recordDeliveryFeeEntry({
      agentId: opts.agentId,
      netAmount: totalAmount,
      orderNumber: order.orderNumber,
      date: opts.deliveredAt,
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount,
      surplusLines,
      priceOverrides,
    };
  } catch (err) {
    if (err instanceof AbortAgentOrder) return { error: err.reason };
    console.error("[createAgentOrder] Error:", err);
    return { error: "Failed to create agent-sold order. Please try again." };
  }
}
