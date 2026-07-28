/**
 * Shared helpers for displaying sales-rep upsells on order lists/details.
 *
 * Same-product upsells merge into one `OrderItem` (with `upsellQuantity` /
 * `upsellAmount` recording the upsold portion), so a list can no longer infer
 * "this order has extras" from `items.length` alone. See
 * docs/upsell-package-pricing.md and docs/upsell-display-rollout.md.
 */

type UpsellItem = { isUpsell: boolean; upsellQuantity: number };

/**
 * Count of "extra" things on an order beyond its original single product:
 * additional distinct product lines PLUS merged lines that carry rep-upsold
 * units (which no longer add a separate line). Drives the list "+N" badge.
 */
export function upsellExtraCount(items: UpsellItem[]): number {
  const extraLines = items.length - 1;
  const mergedUpsells = items.filter(
    (i) => !i.isUpsell && i.upsellQuantity > 0,
  ).length;
  return Math.max(0, extraLines + mergedUpsells);
}
