/**
 * Shared helpers for the admin "date range" filters used by the department
 * overview boards.
 *
 * State lives in the URL as `?from=YYYY-MM-DD&to=YYYY-MM-DD` (inclusive day
 * bounds). Server pages parse it into a {@link DatePeriod} via
 * {@link parseDateRangeParams}; services use {@link dateRanges} to build the
 * current window plus the immediately-preceding, equal-length window for
 * period-over-period trends.
 *
 * The default (no params) is "Today", matching the CEO's end-of-day review.
 */

export type DatePreset = "today" | "yesterday" | "week" | "month" | "custom";

export type DatePeriod = {
  from: Date; // start of the first day (00:00:00.000)
  to: Date; // end of the last day (23:59:59.999)
  preset: DatePreset;
};

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

/** `YYYY-MM-DD` for a Date, in local time. */
export function toDateParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateParam(param?: string | null): Date | null {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    const [y, m, d] = param.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

/** Resolve a named preset to a concrete day window. */
export function presetPeriod(preset: DatePreset, now = new Date()): DatePeriod {
  switch (preset) {
    case "yesterday": {
      const y = new Date(now.getTime() - DAY_MS);
      return { from: startOfDay(y), to: endOfDay(y), preset };
    }
    case "week": {
      // Rolling 7-day window ending today (today + previous 6 days).
      const start = new Date(now.getTime() - 6 * DAY_MS);
      return { from: startOfDay(start), to: endOfDay(now), preset };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDay(start), to: endOfDay(now), preset };
    }
    case "today":
    default:
      return { from: startOfDay(now), to: endOfDay(now), preset: "today" };
  }
}

/**
 * Parse `?from`/`?to`/`?preset` search params into a {@link DatePeriod}.
 * Priority: an explicit `preset` wins; otherwise an explicit from/to becomes a
 * custom range; otherwise defaults to Today.
 */
export function parseDateRangeParams(params: {
  from?: string | null;
  to?: string | null;
  preset?: string | null;
}): DatePeriod {
  const { from, to, preset } = params;

  if (preset && ["today", "yesterday", "week", "month"].includes(preset)) {
    return presetPeriod(preset as DatePreset);
  }

  const fromDate = parseDateParam(from);
  const toDate = parseDateParam(to);
  if (fromDate) {
    // Single day if `to` is missing or invalid.
    const end = toDate ?? fromDate;
    // Guard against reversed ranges.
    const [lo, hi] = fromDate <= end ? [fromDate, end] : [end, fromDate];
    return { from: startOfDay(lo), to: endOfDay(hi), preset: "custom" };
  }

  return presetPeriod("today");
}

/**
 * Build the current window and the immediately-preceding, equal-length window
 * (in whole days) so metrics can show a "vs previous period" trend.
 */
export function dateRanges(period: DatePeriod) {
  const { from, to } = period;
  const spanDays = Math.max(1, Math.round((endOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS));
  const prevTo = endOfDay(new Date(startOfDay(from).getTime() - DAY_MS));
  const prevFrom = startOfDay(new Date(prevTo.getTime() - (spanDays - 1) * DAY_MS));
  return { currentStart: from, currentEnd: to, prevStart: prevFrom, prevEnd: prevTo };
}

/** Human label for a period — "Today", "Yesterday", "Last 7 Days", etc. */
export function datePeriodLabel(period: DatePeriod): string {
  switch (period.preset) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "week":
      return "Last 7 Days";
    case "month":
      return "This Month";
    case "custom": {
      const fmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" });
      const sameDay = toDateParam(period.from) === toDateParam(period.to);
      return sameDay ? fmt.format(period.from) : `${fmt.format(period.from)} – ${fmt.format(period.to)}`;
    }
  }
}
