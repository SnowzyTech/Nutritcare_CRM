import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { SalesReportFilters } from "@/modules/reports/sales/filters";
import { AGG_COLUMNS, scopeCte, type DateBounds } from "@/modules/reports/sales/sql";
import { EMPTY_TOTALS, type CohortTotals } from "@/modules/reports/sales/metrics";

/**
 * Cohort aggregates: the orders RECEIVED in a period (by `Order.date`), and what
 * has happened to them. One SQL round-trip per grouping — all counting happens
 * in the database (CLAUDE.md scale rule), never in JS.
 */

type Row = CohortTotals & { key: string | null; label: string | null; team: string | null };

function toTotals(r: Partial<Row>): CohortTotals {
  const out = { ...EMPTY_TOTALS };
  for (const k of Object.keys(EMPTY_TOTALS) as (keyof CohortTotals)[]) {
    out[k] = Number(r[k] ?? 0);
  }
  return out;
}

export async function cohortTotals(bounds: DateBounds, f: SalesReportFilters): Promise<CohortTotals> {
  const rows = await prisma.$queryRaw<Row[]>`${scopeCte(bounds, f)} SELECT ${AGG_COLUMNS} FROM f`;
  return rows[0] ? toTotals(rows[0]) : { ...EMPTY_TOTALS };
}

export type TeamTotals = CohortTotals & {
  teamId: string | null;
  teamName: string;
  ghana: boolean;
};

export async function cohortByTeam(bounds: DateBounds, f: SalesReportFilters): Promise<TeamTotals[]> {
  const rows = await prisma.$queryRaw<(Row & { ghana: boolean })[]>`
    ${scopeCte(bounds, f)}
    SELECT f."teamId" AS key, MAX(f."teamName") AS label, BOOL_OR(f.ghana) AS ghana, ${AGG_COLUMNS}
    FROM f GROUP BY f."teamId"
  `;
  return rows.map((r) => ({
    ...toTotals(r),
    teamId: r.key,
    teamName: r.label ?? "No team",
    ghana: Boolean(r.ghana),
  }));
}

export type RepTotals = CohortTotals & { repId: string; repName: string; teamName: string };

export async function cohortByRep(bounds: DateBounds, f: SalesReportFilters): Promise<RepTotals[]> {
  const rows = await prisma.$queryRaw<Row[]>`
    ${scopeCte(bounds, f)}
    SELECT f."salesRepId" AS key, MAX(f."repName") AS label, MAX(f."teamName") AS team, ${AGG_COLUMNS}
    FROM f GROUP BY f."salesRepId"
    ORDER BY handled DESC, label ASC
  `;
  return rows.map((r) => ({
    ...toTotals(r),
    repId: r.key ?? "",
    repName: r.label ?? "Unknown",
    teamName: r.team ?? "No team",
  }));
}

export type ProductTotals = CohortTotals & { productId: string; productName: string };

/**
 * Per product: an order counts once under each distinct product it contains.
 * Revenue is the delivered lines' `lineTotal` scaled by the order's
 * `netAmount / totalAmount`, so discounts are respected and product revenue
 * adds up to the order's net amount (not split evenly).
 */
export async function cohortByProduct(bounds: DateBounds, f: SalesReportFilters): Promise<ProductTotals[]> {
  const rows = await prisma.$queryRaw<Row[]>`
    ${scopeCte(bounds, f)},
    fp AS (
      SELECT f.*, p."productId", p."lineSum"
      FROM f
      JOIN LATERAL (
        SELECT i."productId", SUM(i."lineTotal") AS "lineSum"
        FROM order_items i WHERE i."orderId" = f.id GROUP BY i."productId"
      ) p ON TRUE
    )
    SELECT fp."productId" AS key, MAX(pr.name) AS label,
      ${Prisma.sql`
        COUNT(*)::int AS handled,
        COUNT(*) FILTER (WHERE fp."confirmedAt" IS NOT NULL)::int AS confirmed,
        COUNT(*) FILTER (WHERE fp.status = 'DELIVERED')::int AS delivered,
        COUNT(*) FILTER (WHERE fp.status = 'CANCELLED')::int AS cancelled,
        COUNT(*) FILTER (WHERE fp.status IN ('PENDING', 'CONFIRMED', 'FAILED'))::int AS pending,
        COALESCE(SUM(fp."lineSum" * fp."netAmount" / NULLIF(fp."totalAmount", 0))
          FILTER (WHERE fp.status = 'DELIVERED' AND NOT fp.ghana), 0)::float8 AS revenue,
        COALESCE(SUM(fp."lineSum" * fp."netAmount" / NULLIF(fp."totalAmount", 0))
          FILTER (WHERE fp.status = 'DELIVERED' AND fp.ghana), 0)::float8 AS "ghanaRevenue",
        COUNT(*) FILTER (WHERE fp.reorder)::int AS reorders,
        COUNT(*) FILTER (WHERE fp.upsell)::int AS upsells,
        COUNT(*) FILTER (WHERE fp."crossSell")::int AS "crossSells",
        COUNT(*) FILTER (WHERE NOT fp.returning)::int AS "newOrders",
        COUNT(*) FILTER (WHERE fp.returning)::int AS "returningOrders",
        COUNT(DISTINCT COALESCE(fp."phoneKey", fp."customerId")) FILTER (WHERE NOT fp.returning)::int AS "newCustomers",
        COUNT(DISTINCT COALESCE(fp."phoneKey", fp."customerId")) FILTER (WHERE fp.returning)::int AS "returningCustomers"
      `}
    FROM fp JOIN products pr ON pr.id = fp."productId"
    GROUP BY fp."productId"
    ORDER BY handled DESC, label ASC
  `;
  return rows.map((r) => ({
    ...toTotals(r),
    productId: r.key ?? "",
    productName: r.label ?? "Unknown product",
  }));
}
