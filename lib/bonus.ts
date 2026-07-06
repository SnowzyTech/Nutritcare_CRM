/**
 * Shared sales-rep bonus scoring.
 *
 * Both the sales-rep portal (app/(sales-rep)/sales-rep/analytics) and the
 * manager views (app/(sales-rep-manager)/.../analytics) award bonuses through
 * this helper so every screen agrees on the tiers and eligibility rules.
 */

export type BonusPeriod = "week" | "month";

export type Bonus = {
  amount: number;
  eligible: boolean;
  reason?: string;
};

/** KPI target (delivered / total) used across the analytics screens. */
export const KPI_TARGET = 65;

/**
 * Weekly / monthly bonus tiers based on KPI (delivered / total orders handled):
 *   KPI ≥ 90% → ₦50,000
 *   KPI ≥ 80% → ₦35,000
 *   KPI 70–79% → ₦20,000
 * Below 70% KPI, or under the minimum order volume, is not eligible.
 *
 * The minimum order volume is a PER-REP figure. Pass `repCount` when scoring an
 * aggregate (e.g. a whole team) so the threshold scales with the number of reps.
 */
export function calculateBonus(
  kpi: number,
  totalOrders: number,
  period: BonusPeriod,
  repCount = 1,
): Bonus {
  // Minimum orders required per rep: 180/week, or ~720/month (30/day * 4 weeks * 6 days).
  const minOrdersWeek = 180;
  const minOrdersMonth = 30 * 4 * 6;
  const perRep = period === "week" ? minOrdersWeek : minOrdersMonth;
  const minRequired = perRep * Math.max(1, repCount);

  if (totalOrders < minRequired) {
    return {
      amount: 0,
      eligible: false,
      reason: `Need ${minRequired} orders (${totalOrders} handled)`,
    };
  }

  if (kpi < 70) {
    return { amount: 0, eligible: false, reason: "KPI below 70%" };
  }

  if (kpi >= 90) return { amount: 50000, eligible: true };
  if (kpi >= 80) return { amount: 35000, eligible: true };
  return { amount: 20000, eligible: true }; // 70–79%
}
