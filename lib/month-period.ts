/**
 * Shared helpers for the admin "by month" filters.
 *
 * The filter stores its state in the URL as `?month=YYYY-MM`. Server pages parse
 * that param into a {@link MonthPeriod}, and services use {@link monthRanges} to
 * build the current/previous month date windows for period-over-period metrics.
 */

export type MonthPeriod = { year: number; month: number }; // month is 1-12

/** Parse a `YYYY-MM` query param, falling back to the current month. */
export function parseMonthParam(param?: string | null): MonthPeriod {
  const now = new Date();
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [year, month] = param.split("-").map(Number);
    if (month >= 1 && month <= 12) return { year, month };
  }
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** Build current-month and previous-month date windows for a period. */
export function monthRanges({ year, month }: MonthPeriod) {
  const currentStart = new Date(year, month - 1, 1);
  const currentEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const prevStart = new Date(year, month - 2, 1);
  const prevEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);
  return { currentStart, currentEnd, prevStart, prevEnd };
}

/** Human label for a period — "This Month" for the current one, else "June 2026". */
export function monthLabel({ year, month }: MonthPeriod): string {
  const now = new Date();
  if (year === now.getFullYear() && month === now.getMonth() + 1) return "This Month";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}
