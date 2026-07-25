/**
 * Day / Week / Month period filter for the admin staff analytics pages.
 *
 * These pages historically filtered "by month" only. This adds Day and Week
 * granularities while keeping Month as the default (unchanged behaviour):
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
import { toDateParam, type DatePeriod } from "@/lib/date-period";

export type StaffGranularity = "day" | "week" | "month";

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
    };
  }

  const mp = parseMonthParam(params.month);
  const mr = monthRanges(mp);
  return {
    granularity: "month",
    arg: mp,
    range: { gte: mr.currentStart, lte: mr.currentEnd },
    comparisonLabel: "vs last month",
    valueLabel: monthLabel(mp),
  };
}
