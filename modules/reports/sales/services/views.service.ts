import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { SalesReportFilters } from "@/modules/reports/sales/filters";
import { scopeCte, type DateBounds } from "@/modules/reports/sales/sql";
import type { View } from "@/modules/reports/sales/views";

export type ViewCount = { count: number; avgAgeDays: number | null; maxAgeDays: number | null };

/**
 * Counts several predicates that share one scope (bounds + extra) in a single
 * query. Age = days since the order was received.
 */
export async function countGroup(
  bounds: DateBounds,
  extra: Prisma.Sql | undefined,
  f: SalesReportFilters,
  predicates: Record<string, Prisma.Sql>,
): Promise<Record<string, ViewCount>> {
  const keys = Object.keys(predicates);
  if (keys.length === 0) return {};
  const cols = keys.map(
    (k, i) => Prisma.sql`
      COUNT(*) FILTER (WHERE ${predicates[k]})::int AS ${Prisma.raw(`"c${i}"`)},
      AVG(EXTRACT(EPOCH FROM (now() - f.date)) / 86400) FILTER (WHERE ${predicates[k]})::float8 AS ${Prisma.raw(`"a${i}"`)},
      MAX(EXTRACT(EPOCH FROM (now() - f.date)) / 86400) FILTER (WHERE ${predicates[k]})::float8 AS ${Prisma.raw(`"m${i}"`)}`,
  );
  const rows = await prisma.$queryRaw<Record<string, number | null>[]>`
    ${scopeCte(bounds, f, extra)} SELECT ${Prisma.join(cols, ", ")} FROM f
  `;
  const r = rows[0] ?? {};
  const out: Record<string, ViewCount> = {};
  keys.forEach((k, i) => {
    out[k] = {
      count: Number(r[`c${i}`] ?? 0),
      avgAgeDays: r[`a${i}`] === null || r[`a${i}`] === undefined ? null : Number(r[`a${i}`]),
      maxAgeDays: r[`m${i}`] === null || r[`m${i}`] === undefined ? null : Number(r[`m${i}`]),
    };
  });
  return out;
}

export async function countView(view: View, f: SalesReportFilters): Promise<ViewCount> {
  const res = await countGroup(view.bounds, view.extra, f, { v: view.where });
  return res.v;
}

// ── Drill-down ───────────────────────────────────────────────────────────────

export type DrillRow = {
  id: string;
  orderNumber: string;
  date: Date;
  status: string;
  customerName: string;
  state: string;
  repName: string;
  teamName: string | null;
  netAmount: number;
  returning: boolean;
  reorder: boolean;
  upsell: boolean;
  crossSell: boolean;
  source: "Form" | "Manual";
};

export type DrillPage = {
  rows: DrillRow[];
  total: number;
  /** Distinct customers (by phone key) among all matching orders. */
  customers: number;
};

export const DRILL_PAGE_SIZE = 25;

/** The exact orders behind a figure, newest first, paginated. */
export async function listView(view: View, f: SalesReportFilters, page: number): Promise<DrillPage> {
  const offset = Math.max(0, (page - 1) * DRILL_PAGE_SIZE);
  const cte = scopeCte(view.bounds, f, view.extra);

  const [rows, totals] = await Promise.all([
    prisma.$queryRaw<(Omit<DrillRow, "source" | "netAmount"> & { formId: string | null; netAmount: unknown })[]>`
      ${cte}
      SELECT f.id, f."orderNumber", f.date, f.status, f."customerName", f.state, f."repName", f."teamName",
        f."netAmount", f.returning, f.reorder, f.upsell, f."crossSell", f."formId"
      FROM f WHERE ${view.where}
      ORDER BY f.date DESC, f.id DESC
      LIMIT ${DRILL_PAGE_SIZE} OFFSET ${offset}
    `,
    prisma.$queryRaw<{ total: number; customers: number }[]>`
      ${cte}
      SELECT COUNT(*)::int AS total, COUNT(DISTINCT COALESCE(f."phoneKey", f."customerId"))::int AS customers
      FROM f WHERE ${view.where}
    `,
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      date: r.date,
      status: r.status,
      customerName: r.customerName,
      state: r.state,
      repName: r.repName,
      teamName: r.teamName,
      netAmount: Number(r.netAmount),
      returning: r.returning,
      reorder: r.reorder,
      upsell: r.upsell,
      crossSell: r.crossSell,
      source: r.formId ? "Form" : "Manual",
    })),
    total: Number(totals[0]?.total ?? 0),
    customers: Number(totals[0]?.customers ?? 0),
  };
}
