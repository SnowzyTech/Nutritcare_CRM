import { prisma } from "@/lib/db/prisma";

/**
 * Builds a detailed audit description for an order reassignment, mapping each
 * order code to the rep it went to (round-robin: order i → repIds[i % len]).
 * e.g. "Reassigned NEURO-001 → John Doe, AFTER-003 → Jane Doe".
 * Long batches are truncated to the first 5 with a "+N more" suffix.
 */
export async function describeReassignment(orderIds: string[], repIds: string[]): Promise<string> {
  const [orders, reps] = await Promise.all([
    prisma.order.findMany({ where: { id: { in: orderIds } }, select: { id: true, orderNumber: true } }),
    prisma.user.findMany({ where: { id: { in: repIds } }, select: { id: true, name: true } }),
  ]);
  const orderNum = new Map(orders.map((o) => [o.id, o.orderNumber]));
  const repName = new Map(reps.map((r) => [r.id, r.name]));

  const pairs = orderIds.map(
    (oid, i) => `${orderNum.get(oid) ?? oid} → ${repName.get(repIds[i % repIds.length]) ?? "sales rep"}`
  );
  const shown = pairs.slice(0, 5).join(", ");
  const more = pairs.length > 5 ? ` +${pairs.length - 5} more` : "";
  return `Reassigned ${shown}${more}`;
}
