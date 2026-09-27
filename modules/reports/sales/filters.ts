import { z } from "zod";
import type { OrderStatus } from "@prisma/client";

/**
 * The template's "Required CRM Filters" (section 6), parsed from the URL.
 * Period unit + date live in the route and `?date`; everything else is here.
 * Referral is not tracked (no data) and so has no filter.
 *
 * Plain TS — safe to import from client + server.
 */

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED", "FAILED"] as const;

const idParam = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);

export const salesReportFiltersSchema = z.object({
  /** Team id, or "none" for reps without a team. */
  team: idParam.optional(),
  rep: idParam.optional(),
  product: idParam.optional(),
  customer: z.enum(["new", "returning"]).optional(),
  /** Lead source: public form vs manually keyed. */
  source: z.enum(["form", "manual"]).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  agent: idParam.optional(),
  state: z.string().min(1).max(60).optional(),
  reorder: z.literal("1").optional(),
  upsell: z.literal("1").optional(),
  crossSell: z.literal("1").optional(),
});

export type SalesReportFilters = z.infer<typeof salesReportFiltersSchema>;

export const FILTER_KEYS = Object.keys(salesReportFiltersSchema.shape) as (keyof SalesReportFilters)[];

type SearchParams = Record<string, string | string[] | undefined>;

/** Parses each filter independently; an invalid value is dropped, never an error. */
export function parseFilters(sp: SearchParams): SalesReportFilters {
  const out: Record<string, unknown> = {};
  for (const key of FILTER_KEYS) {
    const raw = sp[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === undefined || value === "") continue;
    const parsed = salesReportFiltersSchema.shape[key].safeParse(value);
    if (parsed.success && parsed.data !== undefined) out[key] = parsed.data;
  }
  return out as SalesReportFilters;
}

export function filtersToParams(f: SalesReportFilters): URLSearchParams {
  const p = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const v = f[key];
    if (v) p.set(key, String(v));
  }
  return p;
}

export function isFiltered(f: SalesReportFilters): boolean {
  return FILTER_KEYS.some((k) => Boolean(f[k]));
}

/**
 * Targets are set per team, so achievement only means something when the report
 * is company-wide or a single team — not when narrowed to a rep, product, etc.
 */
export function targetsApply(f: SalesReportFilters): boolean {
  return FILTER_KEYS.every((k) => k === "team" || !f[k]) && f.team !== "none";
}

export type FilterStatus = OrderStatus;
