/**
 * Shared sales-rep performance scoring.
 *
 * Both the sales-rep portal (modules/orders/services/analytics.service.ts) and
 * the admin/manager views (modules/users/services/users.service.ts) score reps
 * through these helpers so every screen agrees on the numbers.
 */

export type PerformanceRates = {
  /** delivered / (confirmed + delivered + failed) */
  deliveryRate: number;
  /** delivered / (delivered + failed) — success once a delivery was attempted */
  recoveryRate: number;
  /** share of orders with more than one distinct product */
  upsellRate: number;
  /** share of orders flagged as reorders */
  reorderRate: number;
  /** cancelled / total */
  cancellationRate: number;
};

/**
 * Weighted "General Performance" score:
 *   delivery 50%, recovery 12%, upsell 20%, reorder 15%, low-cancellation 3%.
 * Cancellation is scored as (100 − cancellationRate) so FEWER cancellations
 * raise the score — a perfect rep (all good rates, 0 cancellations) scores 100.
 */
export function generalPerformanceScore(rates: PerformanceRates): number {
  return Math.round(
    rates.deliveryRate * 0.5 +
      rates.recoveryRate * 0.12 +
      rates.upsellRate * 0.2 +
      rates.reorderRate * 0.15 +
      (100 - rates.cancellationRate) * 0.03,
  );
}

/** KPI = orders delivered in the period / orders handled in the period, as a %. */
export function kpiScore(delivered: number, total: number): number {
  return total > 0 ? Math.round((delivered / total) * 100) : 0;
}
