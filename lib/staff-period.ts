/**
 * Day / Week / Month period filter — the ONE period model shared by every
 * analytics screen: admin staff pages, the sales rep's own analytics, the team
 * lead / sales manager dashboards and the data analyst's analytics. The UI is
 * `components/admin/staff-period-filter.tsx` (`StaffPeriodFilter`).
 *
 * Month is the default, so bare `?month=YYYY-MM` links keep working:
 *
 *   - Month → `?g=month&month=YYYY-MM` → a full calendar month vs the full
 *     previous month (reuses {@link MonthPeriod} / `monthRanges`).
 *   - Week  → `?g=week&w=YYYY-MM-DD`   → the Mon–Sun week containing `w`,
 *     compared with the preceding 7 days.
 *   - Day   → `?g=day&d=YYYY-MM-DD`    → that single day vs the day before.
 *
 * The resolved period is handed to the analytics services as either a
 * MonthPeriod (month mode) or a {@link DatePeriod} (day/week mode); the
 * services accept both.
 */

import { parseMonthParam, monthLabel, monthRanges, type MonthPeriod } from "@/lib/month-period";
import { dateRanges, toDateParam, type DatePeriod } from "@/lib/date-period";
import type { BonusPeriod } from "@/lib/bonus";

export type StaffGranularity = "day" | "week" | "month";

/**
 * Current + previous windows for a service period arg. Month → the calendar
 * month vs the previous calendar month; Day/Week (a DatePeriod) → that window vs
 * the immediately-preceding window of equal length (previous day / previous
 * Mon–Sun). Both bounds are INCLUSIVE — query with `gte` / `lte`.
 */
export function periodWindows(arg: MonthPeriod | DatePeriod): {
  currentStart: Date;
  currentEnd: Date;
  prevStart: Date;
  prevEnd: Date;
} {
  return "from" in arg ? dateRanges(arg) : monthRanges(arg);
}

/** Stable, serialisable `unstable_cache` key segment for a service period arg. */
export function periodCacheKey(arg: MonthPeriod | DatePeriod): string {
  if ("from" in arg) return `d:${+arg.from}:${+arg.to}`;
  return `m:${arg.year}-${arg.month}`;
}

export type StaffPeriod = {
  granularity: StaffGranularity;
  /** Passed straight to the analytics services. */
  arg: MonthPeriod | DatePeriod;
  /** The concrete current-window bounds, for services that take a raw range. */
  range: { gte: Date; lte: Date };
  /** Trend caption, e.g. "vs last month" / "vs last week" / "vs previous day". */
  comparisonLabel: string;
  /** Human label for the selected period, e.g. "Today", "This Month". */
  valueLabel: string;
  /** Lower-case phrase for sentences, e.g. "today", "on 12 Sep 2026", "this week", "in July 2026". */
  periodText: string;
  /** Bonus tier period (lib/bonus.ts); null for Day — bonuses are weekly/monthly only. */
  bonusPeriod: BonusPeriod | null;
};

export type StaffPeriodParams = { g?: string | null; month?: string | null; w?: string | null; d?: string | null };

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function parseDay(param?: string | null): Date | null {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    const [y, m, d] = param.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}
/** Monday (local) of the week containing `d`. */
export function mondayOf(d: Date): Date {
  const x = startOfDay(d);
  const offset = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - offset);
  return x;
}

export function parseStaffPeriod(params: StaffPeriodParams, now = new Date()): StaffPeriod {
  const g: StaffGranularity =
    params.g === "day" || params.g === "week" ? params.g : "month";

  if (g === "day") {
    const day = parseDay(params.d) ?? now;
    const from = startOfDay(day);
    const to = endOfDay(day);
    const isToday = toDateParam(day) === toDateParam(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = toDateParam(day) === toDateParam(yesterday);
    const label = isToday
      ? "Today"
      : isYesterday
        ? "Yesterday"
        : new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(day);
    return {
      granularity: "day",
      arg: { from, to, preset: "custom" } as DatePeriod,
      range: { gte: from, lte: to },
      comparisonLabel: "vs previous day",
      valueLabel: label,
      periodText: isToday ? "today" : isYesterday ? "yesterday" : `on ${label}`,
      bonusPeriod: null,
    };
  }

  if (g === "week") {
    const anchor = parseDay(params.w) ?? now;
    const monday = mondayOf(anchor);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const from = startOfDay(monday);
    const to = endOfDay(sunday);
    const isThisWeek = toDateParam(monday) === toDateParam(mondayOf(now));
    const fmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" });
    const label = isThisWeek ? "This Week" : `Week of ${fmt.format(monday)}`;
    return {
      granularity: "week",
      arg: { from, to, preset: "custom" } as DatePeriod,
      range: { gte: from, lte: to },
      comparisonLabel: "vs last week",
      valueLabel: label,
      periodText: isThisWeek ? "this week" : `in the week of ${fmt.format(monday)}`,
      bonusPeriod: "week",
    };
  }

  const mp = parseMonthParam(params.month);
  const mr = monthRanges(mp);
  const ml = monthLabel(mp);
  return {
    granularity: "month",
    arg: mp,
    range: { gte: mr.currentStart, lte: mr.currentEnd },
    comparisonLabel: "vs last month",
    valueLabel: ml,
    periodText: ml === "This Month" ? "this month" : `in ${ml}`,
    bonusPeriod: "month",
  };
}
