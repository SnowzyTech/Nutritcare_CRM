import { prisma } from "@/lib/db/prisma";
import { withoutCameraAudit } from "@/lib/audit/context";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { notifyOrderDuplicateFlagged } from "@/modules/notifications/services/order-events.service";

/**
 * Duplicate-order flagging.
 *
 * When a new order is an EXACT twin of an EARLIER still-open order — same
 * customer (matched on the normalised `phoneKey`, because form intake creates a
 * fresh Customer row per submission), same set of items, same quantities, same
 * per-line prices, same net total — the new copy is auto-disabled:
 *   - the new order gets `duplicateOfId` (→ the kept original) + `duplicateDisabledAt`
 *   - the kept original gets `hasDuplicates = true`
 *
 * A disabled copy stays fully visible everywhere but cannot be confirmed
 * (see the guards in the confirm actions) until a data team-lead / admin /
 * super-admin re-enables it. "Only while the earlier order is still open"
 * (PENDING or CONFIRMED) is deliberate: a genuine reorder placed after a
 * previous order was delivered/cancelled is NOT a duplicate.
 *
 * Detection is best-effort: it runs AFTER the order is committed and never
 * throws into the create flow — creating the order always succeeds; flagging is
 * a bonus. The existing 2-minute form-submit dedup guard is unaffected; it
 * absorbs rapid double-taps so they never become two rows in the first place.
 */

type SignatureItem = { productId: string; quantity: number; lineTotal: unknown };

export type DuplicateActor = {
  id?: string | null;
  name?: string | null;
  role?: string | null;
};

/**
 * Canonical, order-independent fingerprint of an order's contents. Two orders
 * are duplicates iff their signatures are byte-equal.
 */
export function orderSignature(items: SignatureItem[], netAmount: unknown): string {
  const normalized = items
    .map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      lineTotal: Number(i.lineTotal),
    }))
    .sort((a, b) => {
      if (a.productId !== b.productId) return a.productId < b.productId ? -1 : 1;
      if (a.quantity !== b.quantity) return a.quantity - b.quantity;
      return a.lineTotal - b.lineTotal;
    });
  return JSON.stringify({ items: normalized, net: Number(netAmount) });
}

/**
 * Detect whether `newOrderId` duplicates an earlier still-open order and, if so,
 * disable the new copy. Safe to call for every newly created order.
 */
export async function detectAndFlagDuplicate(
  newOrderId: string,
  actor?: DuplicateActor | null,
): Promise<void> {
  try {
    const newOrder = await prisma.order.findUnique({
      where: { id: newOrderId },
      select: {
        id: true,
        orderNumber: true,
        salesRepId: true,
        netAmount: true,
        createdAt: true,
        duplicateDisabledAt: true,
        customer: { select: { phoneKey: true, phone: true } },
        items: { select: { productId: true, quantity: true, lineTotal: true } },
      },
    });

    if (!newOrder) return;
    // Already part of a duplicate group (e.g. re-run) — nothing to do.
    if (newOrder.duplicateDisabledAt) return;
    if (newOrder.items.length === 0) return;

    const phoneKey = newOrder.customer.phoneKey?.trim() || null;
    const phone = newOrder.customer.phone?.trim() || null;
    if (!phoneKey && !phone) return; // no identity to match on

    const newSignature = orderSignature(newOrder.items, newOrder.netAmount);

    // Earlier, still-open orders for the SAME customer. `Customer.phoneKey` is
    // indexed and a customer rarely has more than a handful of open orders, so
    // comparing signatures in app code is cheap.
    const candidates = await prisma.order.findMany({
      where: {
        id: { not: newOrder.id },
        status: { in: ["PENDING", "CONFIRMED"] },
        deletedAt: null,
        duplicateDisabledAt: null,
        createdAt: { lt: newOrder.createdAt },
        customer: phoneKey ? { phoneKey } : { phone: phone as string },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        orderNumber: true,
        netAmount: true,
        items: { select: { productId: true, quantity: true, lineTotal: true } },
      },
    });

    const original = candidates.find(
      (c) => orderSignature(c.items, c.netAmount) === newSignature,
    );
    if (!original) return;

    // Flag both rows without tripping the audit camera (we write our own rich
    // row below). withoutCameraAudit is idempotent even if the caller already
    // suppressed the camera for the request.
    await withoutCameraAudit(async () => {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: newOrder.id },
          data: { duplicateOfId: original.id, duplicateDisabledAt: new Date() },
        });
        await tx.order.update({
          where: { id: original.id },
          data: { hasDuplicates: true },
        });
      });
    });

    await logActivity({
      userId: newOrder.salesRepId,
      actorName: actor?.name ?? "System",
      actorRole: actor?.role ?? "System",
      action: "Updated",
      entityType: "Order",
      entityId: newOrder.id,
      description: `Order #${newOrder.orderNumber} auto-flagged as a duplicate of #${original.orderNumber} and disabled`,
      details: { duplicateOfId: original.id, duplicateOfNumber: original.orderNumber },
    });

    // Best-effort: tell the rep + data team-lead so a human can review.
    notifyOrderDuplicateFlagged(newOrder.id, original.id, actor ?? undefined);
  } catch (err) {
    // Never break order creation because duplicate detection hiccuped.
    console.error("[detectAndFlagDuplicate] failed:", err);
  }
}

/**
 * Re-enable a disabled duplicate: clears its duplicate markers so it can be
 * processed normally, and clears the original's `hasDuplicates` flag if no other
 * disabled duplicates of it remain. Authorisation is enforced by the caller.
 */
export async function reenableDuplicateOrder(
  orderId: string,
  actor: DuplicateActor,
): Promise<{ ok: true; orderNumber: string } | { ok: false; error: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      salesRepId: true,
      duplicateOfId: true,
      duplicateDisabledAt: true,
    },
  });

  if (!order) return { ok: false, error: "Order not found." };
  if (!order.duplicateDisabledAt) {
    return { ok: false, error: "This order is not a disabled duplicate." };
  }

  const originalId = order.duplicateOfId;

  await withoutCameraAudit(async () => {
    await prisma.order.update({
      where: { id: order.id },
      data: { duplicateOfId: null, duplicateDisabledAt: null },
    });
    if (originalId) {
      const remaining = await prisma.order.count({
        where: { duplicateOfId: originalId, duplicateDisabledAt: { not: null } },
      });
      if (remaining === 0) {
        await prisma.order.update({
          where: { id: originalId },
          data: { hasDuplicates: false },
        });
      }
    }
  });

  await logActivity({
    userId: order.salesRepId,
    actorName: actor.name ?? null,
    actorRole: actor.role ?? null,
    action: "Updated",
    entityType: "Order",
    entityId: order.id,
    description: `Duplicate order #${order.orderNumber} re-enabled${actor.name ? ` by ${actor.name}` : ""}`,
    details: { reenabled: true, previousDuplicateOfId: originalId },
  });

  return { ok: true, orderNumber: order.orderNumber };
}
