import { prisma } from "@/lib/db/prisma";

/**
 * Shared "negotiated price / discount" write — the price-change-at-delivery case.
 * The editor enters the final price the customer will pay (e.g. ₦32,500 → ₦30,500);
 * the discount is derived from the authoritative gross (Σ lineTotal). Auth/role is
 * the CALLER's responsibility; `discountedById` is the acting user (rep, manager or
 * analyst). Mirrors the rule in the rep's `applyOrderDiscountAction`: the new price
 * may only be LOWER than the gross (a discount, not a markup).
 */
export type ApplyDiscountResult =
  | { error: string }
  | {
      ok: true;
      orderNumber: string;
      salesRepId: string;
      gross: number;
      negotiatedPrice: number;
      discountAmount: number;
      discountPercent: number;
      hasDiscount: boolean;
    };

export async function applyOrderNegotiatedPrice(
  orderId: string,
  negotiatedPrice: number,
  reason: string | undefined,
  discountedById: string,
): Promise<ApplyDiscountResult> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: {
      id: true,
      status: true,
      orderNumber: true,
      salesRepId: true,
      items: { select: { lineTotal: true } },
    },
  });
  if (!order) return { error: "Order not found." };
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    return { error: "Discounts can only be applied to pending or confirmed orders." };
  }

  // Authoritative gross = sum of line totals (don't trust a stored totalAmount).
  const gross =
    Math.round(order.items.reduce((s, i) => s + Number(i.lineTotal), 0) * 100) / 100;

  if (!Number.isFinite(negotiatedPrice) || negotiatedPrice < 0) {
    return { error: "Enter a valid negotiated price." };
  }
  if (negotiatedPrice > gross) {
    return { error: "Negotiated price cannot exceed the original total." };
  }

  const discountAmount = Math.round((gross - negotiatedPrice) * 100) / 100;
  const discountPercent =
    gross > 0 ? Math.round((discountAmount / gross) * 10000) / 100 : 0;
  const hasDiscount = discountAmount > 0;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      totalAmount: gross,
      netAmount: negotiatedPrice,
      discountAmount,
      discountPercent,
      discountedById: hasDiscount ? discountedById : null,
      discountReason: hasDiscount ? reason?.trim() || null : null,
      discountedAt: hasDiscount ? new Date() : null,
    },
  });

  return {
    ok: true,
    orderNumber: order.orderNumber,
    salesRepId: order.salesRepId,
    gross,
    negotiatedPrice,
    discountAmount,
    discountPercent,
    hasDiscount,
  };
}
