import { Prisma } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";

/**
 * The metric registry — the single definition of every sales-report figure
 * (docs/sales-reporting.md). Each cohort metric carries the SQL predicate that
 * selects its orders from the `f` CTE (sql.ts), used both to COUNT it and to
 * list the orders behind it, so every figure is traceable to its records.
 *
 * Plus the template's "Required CRM Calculations" (section 5).
 */

/** Call outcomes that mean the customer could not be reached (lib/orders/order-feedback.ts). */
export const UNRESPONSIVE_FEEDBACK = ["NOT_PICKING", "NOT_REACHABLE", "SWITCHED_OFF"] as const;

export type MetricFormat = "number" | "currency" | "percent";

export const COHORT_METRICS = {
  handled: { label: "Handled", format: "number", where: Prisma.sql`TRUE` },
  confirmed: { label: "Confirmed", format: "number", where: Prisma.sql`f."confirmedAt" IS NOT NULL` },
  delivered: { label: "Delivered", format: "number", where: Prisma.sql`f.status = 'DELIVERED'` },
  cancelled: { label: "Cancelled", format: "number", where: Prisma.sql`f.status = 'CANCELLED'` },
  pending: {
    label: "Pending / Backlog",
    format: "number",
    where: Prisma.sql`f.status IN ('PENDING', 'CONFIRMED', 'FAILED')`,
  },
  // Revenue (₦) is the delivered net amount of non-Ghana orders — GHC is never
  // summed into Naira (template rule).
  revenue: {
    label: "Revenue",
    format: "currency",
    where: Prisma.sql`f.status = 'DELIVERED' AND NOT f.ghana`,
  },
  reorders: { label: "Reorders", format: "number", where: Prisma.sql`f.reorder` },
  upsells: { label: "Upsells", format: "number", where: Prisma.sql`f.upsell` },
  crossSells: { label: "Cross-sells", format: "number", where: Prisma.sql`f."crossSell"` },
  newOrders: { label: "New customer orders", format: "number", where: Prisma.sql`NOT f.returning` },
  returningOrders: { label: "Returning customer orders", format: "number", where: Prisma.sql`f.returning` },
  newCustomers: { label: "New customers", format: "number", where: Prisma.sql`NOT f.returning` },
  returningCustomers: { label: "Returning customers", format: "number", where: Prisma.sql`f.returning` },
} as const satisfies Record<string, { label: string; format: MetricFormat; where: Prisma.Sql }>;

export type CohortMetricKey = keyof typeof COHORT_METRICS;

export function isCohortMetric(v: unknown): v is CohortMetricKey {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(COHORT_METRICS, v);
}

/** Aggregates for one group (company / team / rep / product). */
export type CohortTotals = {
  handled: number;
  confirmed: number;
  delivered: number;
  cancelled: number;
  pending: number;
  revenue: number;
  /** Delivered revenue of Ghana-team orders — GHC, reported separately, never in `revenue`. */
  ghanaRevenue: number;
  reorders: number;
  upsells: number;
  crossSells: number;
  newOrders: number;
  returningOrders: number;
  newCustomers: number;
  returningCustomers: number;
};

export const EMPTY_TOTALS: CohortTotals = {
  handled: 0,
  confirmed: 0,
  delivered: 0,
  cancelled: 0,
  pending: 0,
  revenue: 0,
  ghanaRevenue: 0,
  reorders: 0,
  upsells: 0,
  crossSells: 0,
  newOrders: 0,
  returningOrders: 0,
  newCustomers: 0,
  returningCustomers: 0,
};

// ── Template section 5: required calculations ────────────────────────────────

/** Confirmation / delivery / cancel rate — always ÷ HANDLED (template rule). */
export function rate(part: number, handled: number): number | null {
  return handled > 0 ? (part / handled) * 100 : null;
}

/** AOV = Revenue ÷ Delivered. */
export function aov(revenue: number, delivered: number): number | null {
  return delivered > 0 ? revenue / delivered : null;
}

/** Achievement % = Actual ÷ Target × 100. */
export function achievement(actual: number, target: number | null | undefined): number | null {
  return target && target > 0 ? (actual / target) * 100 : null;
}

/** Growth % = (Current − Previous) ÷ Previous × 100. */
export function growth(current: number, previous: number): number | null {
  return previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : null;
}

// ── Display ──────────────────────────────────────────────────────────────────

export const DASH = "—";

export function fmt(value: number | null | undefined, format: MetricFormat): string {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH;
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "number":
      return Math.round(value).toLocaleString("en-NG");
  }
}

export function fmtSigned(value: number | null, format: MetricFormat): string {
  if (value === null) return DASH;
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${fmt(Math.abs(value), format)}`;
}

// ── Targets ──────────────────────────────────────────────────────────────────

export const TARGET_METRICS = [
  { value: "REVENUE", label: "Revenue", format: "currency", totalsKey: "revenue" },
  { value: "HANDLED", label: "Handled Orders", format: "number", totalsKey: "handled" },
  { value: "CONFIRMED", label: "Confirmed Orders", format: "number", totalsKey: "confirmed" },
  { value: "DELIVERED", label: "Delivered Orders", format: "number", totalsKey: "delivered" },
  { value: "REORDERS", label: "Reorders", format: "number", totalsKey: "reorders" },
  { value: "UPSELLS", label: "Upsells", format: "number", totalsKey: "upsells" },
  { value: "CROSS_SELLS", label: "Cross-sells", format: "number", totalsKey: "crossSells" },
] as const satisfies readonly {
  value: string;
  label: string;
  format: MetricFormat;
  totalsKey: CohortMetricKey;
}[];

export type TargetMetric = (typeof TARGET_METRICS)[number]["value"];

export const TARGET_METRIC_VALUES = TARGET_METRICS.map((m) => m.value) as [TargetMetric, ...TargetMetric[]];
