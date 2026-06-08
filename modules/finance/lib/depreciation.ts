// Pure, framework-free depreciation engine — importable from both client
// components (live schedule preview) and server services (register figures).
//
// Accounting model: an asset is recorded at cost and depreciated down to its
// salvage (residual) value over its useful life. Depreciation is spread across
// CALENDAR years and prorated by the number of months the asset is in service
// within each year — so an asset whose depreciation starts mid-year takes a
// partial charge in its first and last calendar years. The cumulative charge is
// always capped so the asset lands exactly on its salvage value (never below).

export type DepreciationMethod =
  | "Straight Line"
  | "Declining Balance"
  | "Sum of Years";

export interface DepreciationInput {
  /** Acquisition cost (₦). */
  purchasePrice: number;
  /** Residual value at the end of useful life (₦). */
  salvageValue: number;
  /** Useful life in whole years. */
  usefulLifeYears: number;
  /** ISO date (yyyy-mm-dd) or Date the depreciation clock starts. */
  depreciationStartDate: string | Date;
  method: DepreciationMethod;
}

export interface ScheduleYear {
  year: number;
  /** Net book value at the start of the calendar year. */
  openingValue: number;
  /** Depreciation charged during the calendar year. */
  depreciation: number;
  /** Net book value at the end of the calendar year. */
  remainingValue: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function toDate(d: string | Date): Date {
  return d instanceof Date ? d : new Date(d);
}

/** Months (fractional) of the depreciation window that fall inside `year`. */
function monthsInYear(start: Date, totalMonths: number, year: number): number {
  // Window is [startMonthIndex, startMonthIndex + totalMonths) on an absolute
  // month timeline. Compute the overlap with the calendar year's 12 months.
  const startAbs = start.getFullYear() * 12 + start.getMonth();
  const endAbs = startAbs + totalMonths; // exclusive
  const yearStartAbs = year * 12;
  const yearEndAbs = yearStartAbs + 12; // exclusive
  const overlap =
    Math.min(endAbs, yearEndAbs) - Math.max(startAbs, yearStartAbs);
  return Math.max(0, overlap);
}

/**
 * Build a calendar-year depreciation schedule. Returns one row per calendar
 * year that carries any depreciation. A non-depreciating or zero-life asset
 * returns an empty schedule.
 */
export function buildSchedule(input: DepreciationInput): ScheduleYear[] {
  const cost = Number(input.purchasePrice) || 0;
  const salvage = Math.max(0, Number(input.salvageValue) || 0);
  const life = Math.floor(Number(input.usefulLifeYears) || 0);
  const depreciableBase = Math.max(0, cost - salvage);

  if (life <= 0 || depreciableBase <= 0) return [];

  const start = toDate(input.depreciationStartDate);
  if (isNaN(start.getTime())) return [];

  const totalMonths = life * 12;
  const firstYear = start.getFullYear();
  // The window can spill into a (life + 1)th calendar year when it starts
  // mid-year, so walk one extra year to capture the tail.
  const lastYear = firstYear + life;

  const rows: ScheduleYear[] = [];
  let bookValue = cost; // running net book value
  let accumulated = 0; // running accumulated depreciation

  // Per-year straight-line amount (full year) used for SL proration.
  const slAnnual = depreciableBase / life;
  // Double-declining rate (applied to opening book value).
  const ddRate = 2 / life;
  // Sum-of-years denominator.
  const syd = (life * (life + 1)) / 2;

  for (let year = firstYear; year <= lastYear; year++) {
    const months = monthsInYear(start, totalMonths, year);
    if (months <= 0) continue;

    const openingValue = round2(bookValue);
    let charge: number;

    if (input.method === "Declining Balance") {
      // Charge proportional to opening book value, prorated by months.
      charge = (bookValue - salvage) > 0
        ? bookValue * ddRate * (months / 12)
        : 0;
    } else if (input.method === "Sum of Years") {
      // Remaining-life weighting. `elapsedYears` indexes into the SYD series
      // based on how much of the life has already been consumed.
      const elapsedYears = accumulatedYears(start, year);
      const remainingLifeWeight = Math.max(0, life - elapsedYears);
      charge = depreciableBase * (remainingLifeWeight / syd) * (months / 12);
    } else {
      // Straight Line (default).
      charge = slAnnual * (months / 12);
    }

    // Never depreciate past the salvage floor.
    const maxCharge = depreciableBase - accumulated;
    charge = Math.max(0, Math.min(charge, maxCharge));
    charge = round2(charge);

    accumulated = round2(accumulated + charge);
    bookValue = round2(cost - accumulated);

    rows.push({
      year,
      openingValue,
      depreciation: charge,
      remainingValue: bookValue,
    });

    if (accumulated >= depreciableBase) break;
  }

  return rows;
}

/** Whole calendar years between the depreciation start and `year`. */
function accumulatedYears(start: Date, year: number): number {
  return Math.max(0, year - start.getFullYear());
}

/**
 * Accumulated depreciation as of `asOf` (defaults to now), computed by summing
 * the schedule's whole completed years plus the prorated portion of the current
 * year up to `asOf`.
 */
export function accumulatedDepreciationAsOf(
  input: DepreciationInput,
  asOf: Date = new Date(),
): number {
  const schedule = buildSchedule(input);
  if (schedule.length === 0) return 0;

  const asOfYear = asOf.getFullYear();
  let accumulated = 0;

  for (const row of schedule) {
    if (row.year < asOfYear) {
      accumulated += row.depreciation;
    } else if (row.year === asOfYear) {
      // Prorate the current year's charge by elapsed months within the year.
      const elapsedMonths = asOf.getMonth() + asOf.getDate() / 31; // ~fractional
      accumulated += row.depreciation * Math.min(1, elapsedMonths / 12);
    }
  }

  return round2(accumulated);
}
