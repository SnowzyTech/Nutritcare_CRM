import { Prisma } from "@prisma/client";
import type { SalesReportFilters } from "@/modules/reports/sales/filters";
import { UNRESPONSIVE_FEEDBACK } from "@/modules/reports/sales/metrics";

/**
 * The SQL core of sales reporting: one CTE that yields every order in scope
 * with every per-order flag the template needs. Counts (GROUP BY), drill-down
 * lists, backlog, journey and data checks ALL read from it, so a figure and the
 * order list behind it can never disagree (template rule: traceability).
 *
 * Definitions: docs/sales-reporting.md. Server-only (Prisma.sql).
 */

export type DateBounds = { start?: Date; end?: Date };

/**
 * Filters that apply directly to order / customer / rep columns.
 * `o` = orders, `c` = customers, `u` = users (rep).
 */
function columnFilters(f: SalesReportFilters): Prisma.Sql[] {
  const parts: Prisma.Sql[] = [];
  if (f.team === "none") parts.push(Prisma.sql`u."teamId" IS NULL`);
  else if (f.team) parts.push(Prisma.sql`u."teamId" = ${f.team}`);
  if (f.rep) parts.push(Prisma.sql`o."salesRepId" = ${f.rep}`);
  if (f.product) {
    parts.push(
      Prisma.sql`EXISTS (SELECT 1 FROM order_items pi WHERE pi."orderId" = o.id AND pi."productId" = ${f.product})`,
    );
  }
  if (f.source === "form") parts.push(Prisma.sql`o."formId" IS NOT NULL`);
  if (f.source === "manual") parts.push(Prisma.sql`o."formId" IS NULL`);
  if (f.status) parts.push(Prisma.sql`o.status::text = ${f.status}`);
  if (f.agent) parts.push(Prisma.sql`o."agentId" = ${f.agent}`);
  if (f.state) parts.push(Prisma.sql`c.state = ${f.state}`);
  return parts;
}

/** Filters on the computed flags (applied after the flags exist). */
function flagFilters(f: SalesReportFilters): Prisma.Sql[] {
  const parts: Prisma.Sql[] = [];
  if (f.customer === "new") parts.push(Prisma.sql`NOT b.returning`);
  if (f.customer === "returning") parts.push(Prisma.sql`b.returning`);
  if (f.reorder) parts.push(Prisma.sql`b.reorder`);
  if (f.upsell) parts.push(Prisma.sql`b.upsell`);
  if (f.crossSell) parts.push(Prisma.sql`b."crossSell"`);
  return parts;
}

function and(parts: Prisma.Sql[]): Prisma.Sql {
  return parts.length ? Prisma.sql` AND ${Prisma.join(parts, " AND ")}` : Prisma.empty;
}

/**
 * `WITH base AS (…), f AS (…)` — `f` is the filtered order set with flags:
 *   confirmedAt   first Delivery row (created at confirmation) — "reached confirmation"
 *   deliveredAt   latest Delivery.deliveredTime
 *   returning     an earlier non-deleted order exists with the same phone key
 *   reorder       rep-ticked isReorder, or an earlier DELIVERED order, same phone key
 *   upsell        a merged line with extra units of the same product
 *   crossSell     a line added by the rep for a different product
 *   ghana         rep's team is a Ghana team — GHC, never summed into Naira
 */
export function scopeCte(
  bounds: DateBounds,
  f: SalesReportFilters,
  /** Extra order-level condition (aliases `o`, `c`, `u`) that narrows the scan, e.g. open orders only. */
  extra?: Prisma.Sql,
): Prisma.Sql {
  const range: Prisma.Sql[] = [];
  if (bounds.start) range.push(Prisma.sql`o.date >= ${bounds.start}`);
  if (bounds.end) range.push(Prisma.sql`o.date < ${bounds.end}`);
  if (extra) range.push(extra);

  return Prisma.sql`
    WITH base AS (
      SELECT
        o.id,
        o."orderNumber",
        o.status::text AS status,
        o."netAmount",
        o."totalAmount",
        o."discountAmount",
        o."isRescheduled",
        o.date,
        o."updatedAt",
        o."formId",
        o."salesRepId",
        o."agentId",
        o."lastFeedback",
        o."customerId",
        u.name AS "repName",
        u."teamId",
        t.name AS "teamName",
        (t.name IS NOT NULL AND t.name ~* 'ghana') AS ghana,
        c.name AS "customerName",
        c.phone AS "customerPhone",
        c."deliveryAddress",
        c.state,
        c."phoneKey",
        (SELECT MIN(d."createdAt") FROM deliveries d WHERE d."orderId" = o.id) AS "confirmedAt",
        (SELECT MAX(d."deliveredTime") FROM deliveries d WHERE d."orderId" = o.id) AS "deliveredAt",
        (c."phoneKey" IS NOT NULL AND EXISTS (
          SELECT 1 FROM orders o2 JOIN customers c2 ON c2.id = o2."customerId"
          WHERE c2."phoneKey" = c."phoneKey" AND o2."deletedAt" IS NULL
            AND (o2.date < o.date OR (o2.date = o.date AND o2.id < o.id))
        )) AS returning,
        (o."isReorder" OR (c."phoneKey" IS NOT NULL AND EXISTS (
          SELECT 1 FROM orders o2 JOIN customers c2 ON c2.id = o2."customerId"
          WHERE c2."phoneKey" = c."phoneKey" AND o2."deletedAt" IS NULL
            AND o2.status = 'DELIVERED'
            AND (o2.date < o.date OR (o2.date = o.date AND o2.id < o.id))
        ))) AS reorder,
        EXISTS (
          SELECT 1 FROM order_items i
          WHERE i."orderId" = o.id AND i."isUpsell" = false AND i."upsellQuantity" > 0
        ) AS upsell,
        EXISTS (
          SELECT 1 FROM order_items i WHERE i."orderId" = o.id AND i."isUpsell" = true
        ) AS "crossSell"
      FROM orders o
      JOIN customers c ON c.id = o."customerId"
      JOIN users u ON u.id = o."salesRepId"
      LEFT JOIN teams t ON t.id = u."teamId"
      WHERE o."deletedAt" IS NULL${and(range)}${and(columnFilters(f))}
    ),
    f AS (
      SELECT b.* FROM base b WHERE TRUE${and(flagFilters(f))}
    )
  `;
}

/** Open = not closed: awaiting confirmation, awaiting delivery, or a failed attempt. */
export const OPEN_SQL = Prisma.sql`f.status IN ('PENDING', 'CONFIRMED', 'FAILED')`;

export const UNRESPONSIVE_SQL = Prisma.sql`f."lastFeedback" IN (${Prisma.join([...UNRESPONSIVE_FEEDBACK])})`;

/** The aggregate columns every grouped query returns (see metrics.ts for meaning). */
export const AGG_COLUMNS = Prisma.sql`
  COUNT(*)::int AS handled,
  COUNT(*) FILTER (WHERE f."confirmedAt" IS NOT NULL)::int AS confirmed,
  COUNT(*) FILTER (WHERE f.status = 'DELIVERED')::int AS delivered,
  COUNT(*) FILTER (WHERE f.status = 'CANCELLED')::int AS cancelled,
  COUNT(*) FILTER (WHERE ${OPEN_SQL})::int AS pending,
  COALESCE(SUM(f."netAmount") FILTER (WHERE f.status = 'DELIVERED' AND NOT f.ghana), 0)::float8 AS revenue,
  COALESCE(SUM(f."netAmount") FILTER (WHERE f.status = 'DELIVERED' AND f.ghana), 0)::float8 AS "ghanaRevenue",
  COUNT(*) FILTER (WHERE f.reorder)::int AS reorders,
  COUNT(*) FILTER (WHERE f.upsell)::int AS upsells,
  COUNT(*) FILTER (WHERE f."crossSell")::int AS "crossSells",
  COUNT(*) FILTER (WHERE NOT f.returning)::int AS "newOrders",
  COUNT(*) FILTER (WHERE f.returning)::int AS "returningOrders",
  COUNT(DISTINCT COALESCE(f."phoneKey", f."customerId")) FILTER (WHERE NOT f.returning)::int AS "newCustomers",
  COUNT(DISTINCT COALESCE(f."phoneKey", f."customerId")) FILTER (WHERE f.returning)::int AS "returningCustomers"
`;
