/**
 * Single source for recomputing an order's stored money fields from its line
 * totals, preserving any existing negotiated discount.
 *
 * Mirrors the pattern that already lives inline in
 * `modules/orders/services/upsell-apply.service.ts` (the upsell recompute),
 * `removeOrderItemAction` and `applyOrderDiscountAction` — every write path that
 * changes an order's lines must total it the same way, so the math lives here.
 *
 *   gross           = Σ lineTotal          (authoritative — never trust a stored totalAmount)
 *   discountAmount  = min(existing, gross)  (a shrunk order can't owe more discount than its total)
 *   netAmount       = gross − discountAmount
 *   discountPercent = discountAmount / gross × 100
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

export type OrderTotals = {
  totalAmount: number;
  netAmount: number;
  discountAmount: number;
  discountPercent: number;
};

/**
 * @param lineTotals            The order's line totals AFTER the edit (already
 *                              converted to numbers by the caller).
 * @param existingDiscountAmount The discount currently stored on the order.
 */
export function computeOrderTotals(
  lineTotals: number[],
  existingDiscountAmount: number,
): OrderTotals {
  const gross = round2(lineTotals.reduce((s, n) => s + n, 0));
  const discountAmount = Math.min(round2(Math.max(0, existingDiscountAmount)), gross);
  const netAmount = round2(gross - discountAmount);
  const discountPercent =
    gross > 0 ? Math.round((discountAmount / gross) * 10000) / 100 : 0;
  return { totalAmount: gross, netAmount, discountAmount, discountPercent };
}
