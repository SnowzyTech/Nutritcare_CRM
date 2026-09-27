/**
 * Lagos calendar periods (day / week / month / quarter) for sales reporting.
 *
 * The business runs on Lagos time (WAT, UTC+1, no daylight saving) but the app
 * runs on UTC servers (Vercel). `Date#setHours(0)` there means 01:00 Lagos, so
 * every boundary here is computed with explicit UTC arithmetic instead:
 * Lagos midnight = UTC 23:00 the previous day.
 *
 * A period is a half-open instant range [start, end). Its `key` is the Lagos
 * calendar date (YYYY-MM-DD) of its first day, which is how targets and saved
 * reports are stored.
 *
 * Plain TS — safe to import from client and server.
 */

export const PERIOD_TYPES = ["DAY", "WEEK", "MONTH", "QUARTER"] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

export type Period = {
  type: PeriodType;
  /** Instant of Lagos 00:00 on the first day (inclusive). */
  start: Date;
  /** Instant of Lagos 00:00 on the day after the last day (exclusive). */
  end: Date;
  /** Lagos date of the first day, YYYY-MM-DD. */
  key: string;
  label: string;
};

const OFFSET_MS = 60 * 60 * 1000; // WAT = UTC+1, no DST
const DAY_MS = 24 * 60 * 60 * 1000;

type Ymd = { y: number; m: number; d: number }; // m is 0-based

/** Lagos calendar date of an instant. */
function lagosYmd(instant: Date): Ymd & { dow: number } {
  const shifted = new Date(instant.getTime() + OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
    dow: shifted.getUTCDay(), // 0 = Sunday
  };
}

/** Instant of Lagos midnight at the start of the given calendar date (normalises overflow). */
function lagosMidnight(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d) - OFFSET_MS);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function keyOf({ y, m, d }: Ymd): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

/** Lagos calendar date (YYYY-MM-DD) of an instant. */
export function lagosDateKey(instant: Date = new Date()): string {
  return keyOf(lagosYmd(instant));
}

/** Parses YYYY-MM-DD as a Lagos calendar date; null when malformed. */
function parseKey(key: string | null | undefined): Ymd | null {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    return null;
  }
  return { y, m: m - 1, d };
}

const DAY_FMT = new Intl.DateTimeFormat("en-NG", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Lagos",
});
const SHORT_FMT = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Lagos",
});
const MONTH_FMT = new Intl.DateTimeFormat("en-NG", {
  month: "long",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

function build(type: PeriodType, first: Ymd, start: Date, end: Date): Period {
  const lastDay = new Date(end.getTime() - DAY_MS);
  let label: string;
  switch (type) {
    case "DAY":
      label = DAY_FMT.format(start);
      break;
    case "WEEK":
      label = `Week ending ${SHORT_FMT.format(lastDay)} (${SHORT_FMT.format(start)} – ${SHORT_FMT.format(lastDay)})`;
      break;
    case "MONTH":
      label = MONTH_FMT.format(start);
      break;
    case "QUARTER": {
      const q = Math.floor(first.m / 3) + 1;
      label = `Q${q} ${first.y}`;
      break;
    }
  }
  return { type, start, end, key: keyOf(first), label };
}

/** The period of `type` containing the given Lagos calendar date. */
function periodForYmd(type: PeriodType, day: Ymd & { dow?: number }): Period {
  switch (type) {
    case "DAY": {
      const start = lagosMidnight(day.y, day.m, day.d);
      return build(type, day, start, lagosMidnight(day.y, day.m, day.d + 1));
    }
    case "WEEK": {
      // Monday-start calendar week, as in the template's weekly report.
      const dow = new Date(Date.UTC(day.y, day.m, day.d)).getUTCDay();
      const back = (dow + 6) % 7;
      const monday = new Date(Date.UTC(day.y, day.m, day.d - back));
      const first = { y: monday.getUTCFullYear(), m: monday.getUTCMonth(), d: monday.getUTCDate() };
      const start = lagosMidnight(first.y, first.m, first.d);
      return build(type, first, start, lagosMidnight(first.y, first.m, first.d + 7));
    }
    case "MONTH": {
      const first = { y: day.y, m: day.m, d: 1 };
      return build(type, first, lagosMidnight(day.y, day.m, 1), lagosMidnight(day.y, day.m + 1, 1));
    }
    case "QUARTER": {
      const qm = Math.floor(day.m / 3) * 3;
      const first = { y: day.y, m: qm, d: 1 };
      return build(type, first, lagosMidnight(day.y, qm, 1), lagosMidnight(day.y, qm + 3, 1));
    }
  }
}

/** The period of `type` containing `instant` (default: now). */
export function periodContaining(type: PeriodType, instant: Date = new Date()): Period {
  return periodForYmd(type, lagosYmd(instant));
}

/**
 * The period of `type` containing the Lagos date `key` (any day inside it).
 * Falls back to the current period when the key is missing or malformed.
 */
export function periodFromKey(type: PeriodType, key?: string | null): Period {
  const day = parseKey(key);
  return day ? periodForYmd(type, day) : periodContaining(type);
}

export function previousPeriod(p: Period): Period {
  return periodContaining(p.type, new Date(p.start.getTime() - 1));
}

export function nextPeriod(p: Period): Period {
  return periodContaining(p.type, p.end);
}

/** Month-to-date range ending at the end of the given day period. */
export function monthToDate(day: Period): { start: Date; end: Date; label: string } {
  const month = periodContaining("MONTH", day.start);
  return { start: month.start, end: day.end, label: `MTD to ${SHORT_FMT.format(day.start)}` };
}

/** Whole Lagos days between two instants' calendar dates (b − a). */
export function lagosDaysBetween(a: Date, b: Date): number {
  const ka = parseKey(lagosDateKey(a))!;
  const kb = parseKey(lagosDateKey(b))!;
  return Math.round((Date.UTC(kb.y, kb.m, kb.d) - Date.UTC(ka.y, ka.m, ka.d)) / DAY_MS);
}

/** The Lagos day period `offset` days before `day`. */
export function dayOffset(day: Period, offset: number): Period {
  return periodContaining("DAY", new Date(day.start.getTime() - offset * DAY_MS));
}

export function isPeriodType(v: unknown): v is PeriodType {
  return typeof v === "string" && (PERIOD_TYPES as readonly string[]).includes(v);
}

export const PERIOD_NOUN: Record<PeriodType, string> = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  QUARTER: "quarter",
};
