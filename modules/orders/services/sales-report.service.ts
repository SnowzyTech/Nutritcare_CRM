/**
 * Sales reporting metrics.
 *
 * Feeds the Sales Daily Executive Update and the Sales Weekly Performance
 * Review (see docs/reports/). Rate definitions deliberately match
 * `modules/orders/services/analytics.service.ts` so a rep's delivery rate means
 * the same thing on the report as it does on their analytics screen.
 *
 * Services here are pure reads over a `{from, to}` window; composition into a
 * report shape happens in the page.
 */

import { prisma } from "@/lib/db/prisma";
import type { ScorecardRow } from "@/modules/reports/types";
import { type DateRange, rate, scorecardRow } from "@/modules/reports/services/period.service";

/** Orders in the window, with everything the sales reports need off one read. */
async function fetchOrders(range: DateRange) {
  return prisma.order.findMany({
    where: {
      deletedAt: null,
      date: { gte: range.from, lte: range.to },
    },
    select: {
      id: true,
      status: true,
      netAmount: true,
      isReorder: true,
      isRescheduled: true,
      customerId: true,
      salesRepId: true,
      salesRep: {
        select: { id: true, name: true, teamId: true, team: { select: { id: true, name: true } } },
      },
      items: {
        select: {
          quantity: true,
          isUpsell: true,
          upsellQuantity: true,
          upsellAmount: true,
          product: { select: { id: true, name: true, categoryId: true } },
        },
      },
    },
  });
}

type OrderRow = Awaited<ReturnType<typeof fetchOrders>>[number];

/**
 * Cross-sell has no column on `Order`. Define it as an order spanning more than
 * one ProductCategory — distinct from an upsell, which is more of the same
 * thing. Isolated here so it can be swapped for a real flag later without
 * touching the callers.
 */
export function isCrossSell(order: Pick<OrderRow, "items">): boolean {
  return new Set(order.items.map((i) => i.product.categoryId)).size > 1;
}

function toNumber(d: { toString(): string }): number {
  return Number(d.toString());
}

export type SalesTotals = {
  revenue: number;
  ordersGotten: number;
  ordersConfirmed: number;
  ordersDelivered: number;
  ordersCancelled: number;
  confirmationRate: number;
  deliveryRate: number;
  averageOrderValue: number;
  reorders: number;
  upsells: number;
  crossSells: number;
  rescheduled: number;
};

function computeTotals(orders: OrderRow[]): SalesTotals {
  const ordersGotten = orders.length;

  // "Confirmed" in the samples means the order got past confirmation — an order
  // that is now DELIVERED was confirmed too, so it counts. Same treatment as
  // `attemptedDelivery` in analytics.service.ts.
  const confirmed = orders.filter(
    (o) => o.status === "CONFIRMED" || o.status === "DELIVERED" || o.status === "FAILED",
  ).length;
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  const cancelled = orders.filter((o) => o.status === "CANCELLED").length;

  // Revenue counts delivered orders only — an order that never lands is not
  // money in the door, and the samples' revenue tracks alongside delivery.
  const revenue = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + toNumber(o.netAmount), 0);

  const reorders = orders.filter((o) => o.isReorder).length;
  const rescheduled = orders.filter((o) => o.isRescheduled).length;
  const upsells = orders.filter((o) => o.items.some((i) => i.isUpsell || i.upsellQuantity > 0)).length;
  const crossSells = orders.filter(isCrossSell).length;

  return {
    revenue,
    ordersGotten,
    ordersConfirmed: confirmed,
    ordersDelivered: delivered,
    ordersCancelled: cancelled,
    confirmationRate: rate(confirmed, ordersGotten),
    deliveryRate: rate(delivered, ordersGotten),
    averageOrderValue: delivered > 0 ? revenue / delivered : 0,
    reorders,
    upsells,
    crossSells,
    rescheduled,
  };
}

export async function getSalesTotals(range: DateRange): Promise<SalesTotals> {
  return computeTotals(await fetchOrders(range));
}

/**
 * The scorecard both sales reports open with. `priorRange` drives the
 * "Last Week" / trend columns; pass null for a single-column scorecard.
 */
export async function getSalesScorecard(
  range: DateRange,
  priorRange: DateRange | null,
): Promise<{ rows: ScorecardRow[]; current: SalesTotals; prior: SalesTotals | null }> {
  const [current, prior] = await Promise.all([
    getSalesTotals(range),
    priorRange ? getSalesTotals(priorRange) : Promise.resolve(null),
  ]);

  const p = <K extends keyof SalesTotals>(key: K): number | null =>
    prior ? prior[key] : null;

  const rows: ScorecardRow[] = [
    scorecardRow("Revenue Generated", "currency", current.revenue, p("revenue")),
    scorecardRow("Orders Gotten", "number", current.ordersGotten, p("ordersGotten")),
    scorecardRow("Orders Confirmed", "number", current.ordersConfirmed, p("ordersConfirmed")),
    scorecardRow("Orders Delivered", "number", current.ordersDelivered, p("ordersDelivered")),
    scorecardRow("Confirmation Rate", "percent", current.confirmationRate, p("confirmationRate")),
    scorecardRow("Delivery Rate", "percent", current.deliveryRate, p("deliveryRate")),
    scorecardRow("Average Order Value", "currency", current.averageOrderValue, p("averageOrderValue")),
    scorecardRow("Reorders", "number", current.reorders, p("reorders")),
    scorecardRow("Upsells", "number", current.upsells, p("upsells")),
    scorecardRow("Cross-sells", "number", current.crossSells, p("crossSells")),
    // A rise in cancellations is bad — flag the polarity so the UI colours it right.
    scorecardRow("Cancelled Orders", "number", current.ordersCancelled, p("ordersCancelled"), false),
  ];

  return { rows, current, prior };
}

// ── CS performance (product x team x rep) ────────────────────────────────────

export type CsPerformanceRow = {
  product: string;
  team: string;
  rep: string;
  handled: number;
  confirmed: number;
  delivered: number;
  ratePct: number;
};

/**
 * The "CS WEEKLY PERFORMANCE" matrix from the weekly product report: for each
 * product, each team's reps with orders handled / confirmed / delivered and the
 * delivered-over-handled percentage.
 *
 * An order containing two products counts once under each — that mirrors how the
 * sample report is compiled (the per-product totals there exceed the order count).
 */
export async function getCsPerformance(range: DateRange): Promise<CsPerformanceRow[]> {
  const orders = await fetchOrders(range);

  type Bucket = { handled: number; confirmed: number; delivered: number };
  const buckets = new Map<string, Bucket & { product: string; team: string; rep: string }>();

  for (const order of orders) {
    const team = order.salesRep?.team?.name ?? "Unassigned";
    const rep = order.salesRep?.name ?? "Unknown";
    const confirmed =
      order.status === "CONFIRMED" || order.status === "DELIVERED" || order.status === "FAILED";
    const delivered = order.status === "DELIVERED";

    // Distinct products on the order — a 2-line order for one product counts once.
    const products = new Map(order.items.map((i) => [i.product.id, i.product.name]));

    for (const productName of products.values()) {
      const key = `${productName}|${team}|${rep}`;
      const b = buckets.get(key) ?? { product: productName, team, rep, handled: 0, confirmed: 0, delivered: 0 };
      b.handled += 1;
      if (confirmed) b.confirmed += 1;
      if (delivered) b.delivered += 1;
      buckets.set(key, b);
    }
  }

  return [...buckets.values()]
    .map((b) => ({ ...b, ratePct: rate(b.delivered, b.handled) }))
    .sort(
      (a, b) =>
        a.product.localeCompare(b.product) ||
        a.team.localeCompare(b.team) ||
        b.delivered - a.delivered,
    );
}

// ── Backlog ─────────────────────────────────────────────────────────────────

export type BacklogRow = {
  team: string;
  handled: number;
  confirmed: number;
  confirmationRate: number;
  delivered: number;
  deliveryRate: number;
};

/**
 * Orders raised *before* this window that are still open, and what happened to
 * them during it. The samples track this per team because old unconverted
 * orders are where the sales floor quietly loses revenue.
 */
export async function getBacklog(range: DateRange): Promise<BacklogRow[]> {
  const orders = await prisma.order.findMany({
    where: {
      deletedAt: null,
      date: { lt: range.from },
      // Still open at the start of the window, or resolved during it.
      OR: [
        { status: { in: ["PENDING", "CONFIRMED"] } },
        { status: "DELIVERED", updatedAt: { gte: range.from, lte: range.to } },
      ],
    },
    select: {
      status: true,
      updatedAt: true,
      salesRep: { select: { team: { select: { name: true } } } },
    },
  });

  const buckets = new Map<string, BacklogRow>();

  for (const order of orders) {
    const team = order.salesRep?.team?.name ?? "Unassigned";
    const b =
      buckets.get(team) ??
      { team, handled: 0, confirmed: 0, confirmationRate: 0, delivered: 0, deliveryRate: 0 };

    b.handled += 1;
    if (order.status === "CONFIRMED") b.confirmed += 1;
    if (order.status === "DELIVERED") b.delivered += 1;
    buckets.set(team, b);
  }

  return [...buckets.values()]
    .map((b) => ({
      ...b,
      confirmationRate: rate(b.confirmed, b.handled),
      deliveryRate: rate(b.delivered, b.handled),
    }))
    .sort((a, b) => b.handled - a.handled);
}

// ── Top objection inputs ────────────────────────────────────────────────────

export type CancellationReasonRow = { reason: string; count: number };

/**
 * Cancellation reasons in the window. Not one of the sampled tables, but
 * `Order.cancellationReason` is already captured and it is the only structured
 * evidence available for the report's "top customer objections" section — so it
 * is surfaced to help the manager answer that question rather than guess.
 */
export async function getCancellationReasons(range: DateRange): Promise<CancellationReasonRow[]> {
  const grouped = await prisma.order.groupBy({
    by: ["cancellationReason"],
    where: {
      deletedAt: null,
      status: "CANCELLED",
      date: { gte: range.from, lte: range.to },
      cancellationReason: { not: null },
    },
    _count: { _all: true },
  });

  return grouped
    .map((g) => ({ reason: g.cancellationReason ?? "Unspecified", count: g._count._all }))
    .sort((a, b) => b.count - a.count);
}
