import { parseMonthParam, monthRanges, monthLabel, type MonthPeriod } from "@/lib/month-period";
import { presetPeriod, type DatePeriod } from "@/lib/date-period";
import type { BonusPeriod } from "@/lib/bonus";

/**
 * The manager analytics screens support three ranges: Day / Week / Month.
 *  • month → calendar month (keeps the historical `?month=YYYY-MM` picker)
 *  • week  → rolling last 7 days vs the prior 7
 *  • day   → today vs yesterday
 * Month uses a MonthPeriod; day/week reuse the DatePeriod preset system. Both
 * are accepted by getTeamAnalytics / getCompanyAnalytics / getSalesRepAnalytics.
 */
export type AnalyticsRange = "day" | "week" | "month";

export function parseRange(param?: string | null): AnalyticsRange {
  return param === "day" || param === "week" ? param : "month";
}

export type ResolvedAnalyticsPeriod = {
  /** Passed straight to the analytics services. */
  periodArg: MonthPeriod | DatePeriod;
  /** Current-window bounds (for period-scoped product tables). */
  currentStart: Date;
  currentEnd: Date;
  /** e.g. "today" / "this week" / "this month" / "in July 2026". */
  periodText: string;
  /** e.g. "vs yesterday" / "vs last week" / "vs last month". */
  vsLabel: string;
  /** Bonus tier period; null for Day (bonuses are weekly/monthly only). */
  bonusPeriod: BonusPeriod | null;
  /** "Daily" / "Weekly" / "Monthly" — shown on the bonus card. */
  bonusPeriodLabel: string;
};

export function resolveAnalyticsPeriod(
  range: AnalyticsRange,
  month?: string,
): ResolvedAnalyticsPeriod {
  if (range === "month") {
    const mp = parseMonthParam(month);
    const { currentStart, currentEnd } = monthRanges(mp);
    const ml = monthLabel(mp);
    return {
      periodArg: mp,
      currentStart,
      currentEnd,
      periodText: ml === "This Month" ? "this month" : `in ${ml}`,
      vsLabel: "vs last month",
      bonusPeriod: "month",
      bonusPeriodLabel: "Monthly",
    };
  }

  const dp = presetPeriod(range === "day" ? "today" : "week");
  return {
    periodArg: dp,
    currentStart: dp.from,
    currentEnd: dp.to,
    periodText: range === "day" ? "today" : "this week",
    vsLabel: range === "day" ? "vs yesterday" : "vs last week",
    bonusPeriod: range === "day" ? null : "week",
    bonusPeriodLabel: range === "day" ? "Daily" : "Weekly",
  };
}
