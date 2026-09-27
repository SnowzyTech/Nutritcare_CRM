import { Prisma } from "@prisma/client";
import { dayOffset, type Period } from "@/lib/lagos-time";
import { FOLLOW_UP_STAGES, type FollowUpStage } from "@/lib/orders/follow-up";
import type { DateBounds } from "@/modules/reports/sales/sql";
import { OPEN_SQL, UNRESPONSIVE_SQL } from "@/modules/reports/sales/sql";

/**
 * Every non-cohort figure (backlog, recovered backlog, customer journey, data
 * checks) as a "view": the orders in scope + the predicate that selects them.
 * The same view is COUNTed on the report and LISTed on the drill-down page, so
 * a figure always equals the list behind it (template: traceability).
 *
 * Definitions: docs/sales-reporting.md. Server-only.
 */

export type View = {
  bounds: DateBounds;
  /** Order-level narrowing of the scan (aliases o/c/u). */
  extra?: Prisma.Sql;
  /** Predicate over the `f` CTE. */
  where: Prisma.Sql;
};

/** Order-level narrowing to currently open orders (uses the status index). */
export const OPEN_ORDERS = Prisma.sql`o.status::text IN ('PENDING', 'CONFIRMED', 'FAILED')`;

// ── Backlog (current open orders, any age) ───────────────────────────────────

export const BACKLOG_ROWS = [
  { key: "pendingConfirmation", label: "Pending Confirmation", where: Prisma.sql`f.status = 'PENDING'` },
  { key: "pendingDelivery", label: "Pending Delivery", where: Prisma.sql`f.status = 'CONFIRMED'` },
  { key: "failed", label: "Failed attempt – awaiting re-delivery", where: Prisma.sql`f.status = 'FAILED'` },
  { key: "rescheduled", label: "Rescheduled", where: Prisma.sql`${OPEN_SQL} AND f."isRescheduled"` },
  { key: "unresponsive", label: "Unresponsive", where: Prisma.sql`${OPEN_SQL} AND ${UNRESPONSIVE_SQL}` },
] as const;

export type BacklogRowKey = (typeof BACKLOG_ROWS)[number]["key"] | "recovered";

export function backlogView(key: Exclude<BacklogRowKey, "recovered">): View {
  const row = BACKLOG_ROWS.find((r) => r.key === key)!;
  return { bounds: {}, extra: OPEN_ORDERS, where: row.where };
}

// ── Recovered backlog ────────────────────────────────────────────────────────

/**
 * Orders received BEFORE the period that were still open when it began
 * (not delivered and not cancelled before its start).
 */
function openAtStart(p: Period): Prisma.Sql {
  return Prisma.sql`NOT (f.status = 'DELIVERED' AND f."deliveredAt" < ${p.start})
    AND NOT (f.status = 'CANCELLED' AND f."updatedAt" < ${p.start})`;
}

/** Narrows the scan to orders that could have been open at the period start. */
function couldBeOpenAt(p: Period): Prisma.Sql {
  return Prisma.sql`(${OPEN_ORDERS} OR o."updatedAt" >= ${p.start}
    OR EXISTS (SELECT 1 FROM deliveries d WHERE d."orderId" = o.id AND d."deliveredTime" >= ${p.start}))`;
}

export function backlogAtStartView(p: Period): View {
  return { bounds: { end: p.start }, extra: couldBeOpenAt(p), where: openAtStart(p) };
}

/** Backlog at the start that got confirmed or delivered during the period. */
export function recoveredView(p: Period): View {
  return {
    bounds: { end: p.start },
    extra: couldBeOpenAt(p),
    where: Prisma.sql`${openAtStart(p)} AND (
      (f."confirmedAt" >= ${p.start} AND f."confirmedAt" < ${p.end})
      OR (f.status = 'DELIVERED' AND f."deliveredAt" >= ${p.start} AND f."deliveredAt" < ${p.end})
    )`,
  };
}

// ── Customer journey (Day 1 / 2 / 4 / 7 after delivery) ──────────────────────

export type JourneyMode = "due" | "done" | "open";

/** Orders delivered N Lagos days before `day`, and whether that stage's follow-up is done. */
export function journeyView(day: Period, stage: FollowUpStage, mode: JourneyMode): View {
  const n = FOLLOW_UP_STAGES.find((s) => s.value === stage)!.day;
  const deliveredOn = dayOffset(day, n);
  const due = Prisma.sql`f.status = 'DELIVERED' AND f."deliveredAt" >= ${deliveredOn.start} AND f."deliveredAt" < ${deliveredOn.end}`;
  const done = Prisma.sql`EXISTS (SELECT 1 FROM customer_follow_ups fu WHERE fu."orderId" = f.id AND fu.stage = ${stage})`;
  return {
    bounds: {},
    extra: Prisma.sql`EXISTS (SELECT 1 FROM deliveries d WHERE d."orderId" = o.id
      AND d."deliveredTime" >= ${deliveredOn.start} AND d."deliveredTime" < ${deliveredOn.end})`,
    where: mode === "due" ? due : mode === "done" ? Prisma.sql`${due} AND ${done}` : Prisma.sql`${due} AND NOT ${done}`,
  };
}

// ── Data accuracy checks (template section 7) ────────────────────────────────

export const LONG_PENDING_DAYS = 7;
export const NO_UPDATE_HOURS = 48;

export type DataCheck = {
  key: string;
  label: string;
  description: string;
  /** "period" = orders received in the report period; "open" = all currently open orders. */
  scope: "period" | "open";
  where: Prisma.Sql;
};

export const DATA_CHECKS: DataCheck[] = [
  {
    key: "duplicate",
    label: "Possible duplicate orders",
    description: "Another order from the same phone number for the same product within 24 hours.",
    scope: "period",
    where: Prisma.sql`f."phoneKey" IS NOT NULL AND EXISTS (
      SELECT 1 FROM orders o2 JOIN customers c2 ON c2.id = o2."customerId"
      WHERE o2.id <> f.id AND o2."deletedAt" IS NULL AND c2."phoneKey" = f."phoneKey"
        AND o2.date BETWEEN f.date - interval '24 hours' AND f.date + interval '24 hours'
        AND EXISTS (
          SELECT 1 FROM order_items a JOIN order_items b ON a."productId" = b."productId"
          WHERE a."orderId" = f.id AND b."orderId" = o2.id
        )
    )`,
  },
  {
    key: "missingCustomer",
    label: "Missing customer details",
    description: "Customer name, phone, delivery address or state is blank.",
    scope: "period",
    where: Prisma.sql`(btrim(COALESCE(f."customerName", '')) = '' OR btrim(COALESCE(f."customerPhone", '')) = ''
      OR btrim(COALESCE(f."deliveryAddress", '')) = '' OR btrim(COALESCE(f.state, '')) = '')`,
  },
  {
    key: "noStatusUpdate",
    label: "No status update",
    description: `Still pending after ${NO_UPDATE_HOURS} hours with no call outcome recorded.`,
    scope: "period",
    where: Prisma.sql`f.status = 'PENDING' AND f.date < now() - make_interval(hours => ${NO_UPDATE_HOURS}) AND f."lastFeedback" IS NULL`,
  },
  {
    key: "deliveredUnconfirmed",
    label: "Delivered without confirmation",
    description: "Marked delivered but has no confirmation (delivery) record.",
    scope: "period",
    where: Prisma.sql`f.status = 'DELIVERED' AND f."confirmedAt" IS NULL`,
  },
  {
    key: "revenueMismatch",
    label: "Revenue mismatch",
    description: "Order total ≠ sum of its lines, or net ≠ total − discount.",
    scope: "period",
    where: Prisma.sql`(
      abs(f."totalAmount" - (SELECT COALESCE(SUM(li."lineTotal"), 0) FROM order_items li WHERE li."orderId" = f.id)) > 0.01
      OR abs(f."netAmount" - (f."totalAmount" - f."discountAmount")) > 0.01
    )`,
  },
  {
    key: "missingDelivery",
    label: "Missing delivery information",
    description: "Confirmed/delivered with no delivery agent, or delivered with no delivery date.",
    scope: "period",
    where: Prisma.sql`((f.status IN ('CONFIRMED', 'DELIVERED') AND f."agentId" IS NULL)
      OR (f.status = 'DELIVERED' AND f."deliveredAt" IS NULL))`,
  },
  {
    key: "longPending",
    label: "Long-pending backlog",
    description: `Open for more than ${LONG_PENDING_DAYS} days (all open orders, any period).`,
    scope: "open",
    where: Prisma.sql`f.date < now() - make_interval(days => ${LONG_PENDING_DAYS})`,
  },
  {
    key: "rescheduled",
    label: "Rescheduled (tracked)",
    description: "Open orders whose delivery has been rescheduled.",
    scope: "open",
    where: Prisma.sql`f."isRescheduled"`,
  },
  {
    key: "unresponsive",
    label: "Unresponsive customers (tracked)",
    description: "Open orders whose latest call outcome is Not Picking / Not Reachable / Switched Off.",
    scope: "open",
    where: UNRESPONSIVE_SQL,
  },
];

export function dataCheckView(check: DataCheck, p: Period): View {
  return check.scope === "open"
    ? { bounds: {}, extra: OPEN_ORDERS, where: check.where }
    : { bounds: { start: p.start, end: p.end }, where: check.where };
}
