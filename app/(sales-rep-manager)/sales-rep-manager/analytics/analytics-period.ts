import type { MonthPeriod } from "@/lib/month-period";
import type { DatePeriod } from "@/lib/date-period";
import type { BonusPeriod } from "@/lib/bonus";
import {
  parseStaffPeriod,
  type StaffGranularity,
  type StaffPeriodParams,
} from "@/lib/staff-period";

/**
 * The manager analytics screens (team lead + company sales manager) filter by
 * Day / Week / Month through the shared period model in lib/staff-period.ts and
 * its `StaffPeriodFilter` UI (`?g=day&d=YYYY-MM-DD`, `?g=week&w=YYYY-MM-DD`,
 * `?g=month&month=YYYY-MM`):
 *  • day   → any past day vs the day before
 *  • week  → a Mon–Sun calendar week vs the previous week
 *  • month → a calendar month vs the previous month (the default)
 * `periodArg` is accepted by getTeamAnalytics / getCompanyAnalytics /
 * getSalesRepAnalytics (users.service).
 */
export type ResolvedAnalyticsPeriod = {
  granularity: StaffGranularity;
  /** Passed straight to the analytics services. */
  periodArg: MonthPeriod | DatePeriod;
  /** Current-window bounds (for period-scoped product tables). */
  currentStart: Date;
  currentEnd: Date;
  /** e.g. "today" / "on 12 Sep 2026" / "this week" / "in July 2026". */
  periodText: string;
  /** e.g. "vs previous day" / "vs last week" / "vs last month". */
  vsLabel: string;
  /** Bonus tier period; null for Day (bonuses are weekly/monthly only). */
  bonusPeriod: BonusPeriod | null;
  /** "Daily" / "Weekly" / "Monthly" — shown on the bonus card. */
  bonusPeriodLabel: string;
};

const BONUS_PERIOD_LABEL: Record<StaffGranularity, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
};

export function resolveAnalyticsPeriod(params: StaffPeriodParams): ResolvedAnalyticsPeriod {
  const sp = parseStaffPeriod(params);
  return {
    granularity: sp.granularity,
    periodArg: sp.arg,
    currentStart: sp.range.gte,
    currentEnd: sp.range.lte,
    periodText: sp.periodText,
    vsLabel: sp.comparisonLabel,
    bonusPeriod: sp.bonusPeriod,
    bonusPeriodLabel: BONUS_PERIOD_LABEL[sp.granularity],
  };
}
