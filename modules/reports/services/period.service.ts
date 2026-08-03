/**
 * Period helpers for the reporting system.
 *
 * Deliberately thin: the project already has `lib/date-period.ts` (day-range
 * filters, `?from`/`?to`/`?preset`) and `lib/month-period.ts` (`?month=YYYY-MM`).
 * Reports reuse both. This module adds only what reporting needs on top —
 * calendar-week windows (the samples run Monday–Sunday) and the trend/scorecard
 * builders that turn a pair of numbers into a `ScorecardRow`.
 */

import { formatCurrency } from "@/lib/utils";
import type { MetricFormat, ScorecardRow, TrendDirection } from "@/modules/reports/types";

export type DateRange = { from: Date; to: Date };

const DAY_MS = 24 * 60 * 60 * 1000;

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

/**
 * Monday-start calendar week containing `ref`. The weekly sales report is
 * labelled "Week Ending 25th July", i.e. a fixed calendar week — not the
 * rolling 7-day window `presetPeriod("week")` in lib/date-period.ts produces.
 */
export function weekRange(ref: Date = new Date()): DateRange {
  const d = startOfDay(ref);
  // getDay(): 0=Sun … 6=Sat. Shift so Monday is 0.
  const offset = (d.getDay() + 6) % 7;
  const from = new Date(d.getTime() - offset * DAY_MS);
  const to = endOfDay(new Date(from.getTime() + 6 * DAY_MS));
  return { from, to };
}

/** The calendar week immediately before the one containing `ref`. */
export function previousWeekRange(ref: Date = new Date()): DateRange {
  const current = weekRange(ref);
  return weekRange(new Date(current.from.getTime() - DAY_MS));
}

/** Parse `?week=YYYY-MM-DD` (any day within the week) into a week window. */
export function parseWeekParam(param?: string | null): DateRange {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    const [y, m, d] = param.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (!Number.isNaN(date.getTime())) return weekRange(date);
  }
  return weekRange();
}

/** Single-day window. */
export function dayRange(ref: Date = new Date()): DateRange {
  return { from: startOfDay(ref), to: endOfDay(ref) };
}

export function previousDayRange(ref: Date = new Date()): DateRange {
  return dayRange(new Date(startOfDay(ref).getTime() - DAY_MS));
}

/** Parse `?date=YYYY-MM-DD` into a single-day window. */
export function parseDayParam(param?: string | null): Date {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    const [y, m, d] = param.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}

/** Month-to-date window ending at `ref` — the "MTD" column in the daily reports. */
export function monthToDateRange(ref: Date = new Date()): DateRange {
  return {
    from: startOfDay(new Date(ref.getFullYear(), ref.getMonth(), 1)),
    to: endOfDay(ref),
  };
}

/** Full calendar month containing `ref`. */
export function monthRange(ref: Date = new Date()): DateRange {
  return {
    from: startOfDay(new Date(ref.getFullYear(), ref.getMonth(), 1)),
    to: endOfDay(new Date(ref.getFullYear(), ref.getMonth() + 1, 0)),
  };
}

export function previousMonthRange(ref: Date = new Date()): DateRange {
  return monthRange(new Date(ref.getFullYear(), ref.getMonth() - 1, 1));
}

const DATE_FMT = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function rangeLabel(range: DateRange): string {
  const sameDay = startOfDay(range.from).getTime() === startOfDay(range.to).getTime();
  return sameDay
    ? DATE_FMT.format(range.from)
    : `${DATE_FMT.format(range.from)} - ${DATE_FMT.format(range.to)}`;
}

export function weekEndingLabel(range: DateRange): string {
  return `Week Ending: ${DATE_FMT.format(range.to)}`;
}

export function monthLabel(range: DateRange): string {
  return new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(range.from);
}

// ── Scorecard construction ───────────────────────────────────────────────────

/** Percent change from `prior` to `current`; null when prior is 0 or absent. */
export function deltaPercent(current: number, prior: number | null): number | null {
  if (prior === null || prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

export function trendOf(current: number, prior: number | null): TrendDirection {
  if (prior === null || current === prior) return "flat";
  return current > prior ? "up" : "down";
}

function display(value: number, format: MetricFormat): string {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "number":
      return Math.round(value).toLocaleString("en-NG");
    case "text":
    default:
      return String(value);
  }
}

/**
 * Build one scorecard line.
 *
 * `higherIsBetter` defaults to true; pass false for metrics like cancellations
 * where a rise is bad, so the UI can colour the trend without re-deriving the
 * polarity of every metric.
 */
export function scorecardRow(
  label: string,
  format: MetricFormat,
  current: number,
  prior: number | null = null,
  higherIsBetter = true,
): ScorecardRow {
  const trend = trendOf(current, prior);
  const deltaPct = deltaPercent(current, prior);
  const isGood = trend === "flat" ? null : (trend === "up") === higherIsBetter;

  return {
    label,
    format,
    current,
    currentDisplay: display(current, format),
    prior,
    priorDisplay: prior === null ? null : display(prior, format),
    trend,
    deltaPct,
    isGood,
  };
}

/**
 * The largest mover in a scorecard, in either direction — used to pre-answer the
 * weekly report's "which metric improved/declined the most?" questions so the
 * manager only has to supply the reasoning.
 */
export function biggestMover(
  rows: ScorecardRow[],
  direction: "up" | "down",
): ScorecardRow | null {
  const candidates = rows.filter(
    (r) => r.deltaPct !== null && r.isGood === (direction === "up"),
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((best, r) =>
    Math.abs(r.deltaPct!) > Math.abs(best.deltaPct!) ? r : best,
  );
}

/** Safe percentage, guarding the zero-denominator case every report hits. */
export function rate(numerator: number, denominator: number): number {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
}
