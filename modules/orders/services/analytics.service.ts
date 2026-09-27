import { prisma } from "@/lib/db/prisma";
import { unstable_cache } from "next/cache";
import { generalPerformanceScore, kpiScore } from "@/lib/performance";
import { periodCacheKey, periodWindows } from "@/lib/staff-period";
import type { MonthPeriod } from "@/lib/month-period";
import type { DatePeriod } from "@/lib/date-period";

export type ProductStat = { name: string; qty: number };

export type MonthMetrics = {
  totalOrders: number;
  ordersDelivered: number;
  uniqueCustomers: number;
  bestSellingProduct: string;
  generalPerformance: number;
  upsellRate: number;
  reorderRate: number;
  confirmationRate: number;
  deliveryRate: number;
  cancellationRate: number;
  recoveryRate: number;
  kpi: number;
  topProducts: ProductStat[];
  upsoldProducts: ProductStat[];
};

export type AnalyticsData = {
  current: MonthMetrics;
  last: MonthMetrics | null;
};

type OrderRow = Awaited<ReturnType<typeof fetchOrders>>[number];

/** `to` is INCLUSIVE when given (period windows end at 23:59:59.999). */
async function fetchOrders(salesRepId: string, from: Date, to?: Date) {
  return prisma.order.findMany({
    where: {
      salesRepId,
      deletedAt: null,
      createdAt: { gte: from, ...(to ? { lte: to } : {}) },
    },
    select: {
      status: true,
      customerId: true,
      isReorder: true,
      items: {
        select: {
          productId: true,
          quantity: true,
          product: { select: { name: true } },
        },
      },
    },
  });
}

function computeMetrics(orders: OrderRow[]): MonthMetrics {
  const total = orders.length;

  const confirmed = orders.filter((o) => o.status === "CONFIRMED").length;
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
  const failed = orders.filter((o) => o.status === "FAILED").length;

  const attemptedDelivery = confirmed + delivered + failed;
  const deliveryAttempted = delivered + failed;

  const reorders = orders.filter((o) => o.isReorder).length;

  const confirmationRate =
    total > 0 ? Math.round((attemptedDelivery / total) * 100) : 0;
  // Delivery Rate mirrors the KPI: delivered / total orders handled.
  const deliveryRate = kpiScore(delivered, total);
  const cancellationRate =
    total > 0 ? Math.round((cancelled / total) * 100) : 0;
  const recoveryRate =
    deliveryAttempted > 0 ? Math.round((delivered / deliveryAttempted) * 100) : 0;
  const reorderRate = total > 0 ? Math.round((reorders / total) * 100) : 0;

  // Upsell = orders with >1 distinct product type (multi-item orders)
  const multiItemOrders = orders.filter(
    (o) => new Set(o.items.map((i) => i.productId)).size > 1
  );
  const upsellRate =
    total > 0 ? Math.round((multiItemOrders.length / total) * 100) : 0;

  // No orders handled → no performance (avoid the low-cancellation baseline).
  const generalPerformance =
    total > 0
      ? generalPerformanceScore({
          deliveryRate,
          recoveryRate,
          upsellRate,
          reorderRate,
          cancellationRate,
        })
      : 0;

  const kpi = kpiScore(delivered, total);

  const uniqueCustomers = new Set(orders.map((o) => o.customerId)).size;

  // Top products by quantity in DELIVERED orders
  const deliveredProductQty = new Map<string, number>();
  for (const order of orders.filter((o) => o.status === "DELIVERED")) {
    for (const item of order.items) {
      const name = item.product.name;
      deliveredProductQty.set(name, (deliveredProductQty.get(name) ?? 0) + item.quantity);
    }
  }
  const topProducts: ProductStat[] = [...deliveredProductQty.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, qty]) => ({ name, qty }));

  const bestSellingProduct = topProducts[0]?.name ?? "N/A";

  // Upsold products: products that appear in multi-item orders
  const upsoldQty = new Map<string, number>();
  for (const order of multiItemOrders) {
    for (const item of order.items) {
      const name = item.product.name;
      upsoldQty.set(name, (upsoldQty.get(name) ?? 0) + 1);
    }
  }
  const upsoldProducts: ProductStat[] = [...upsoldQty.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, qty]) => ({ name, qty }));

  return {
    totalOrders: total,
    ordersDelivered: delivered,
    uniqueCustomers,
    bestSellingProduct,
    generalPerformance,
    upsellRate,
    reorderRate,
    confirmationRate,
    deliveryRate,
    cancellationRate,
    recoveryRate,
    kpi,
    topProducts,
    upsoldProducts,
  };
}

async function _getSalesRepWeeklyAnalytics(salesRepId: string): Promise<MonthMetrics> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const orders = await fetchOrders(salesRepId, weekStart);
  return computeMetrics(orders);
}

/**
 * A rep's metrics for a period (from `parseStaffPeriod(...).arg`) plus the
 * previous period for trend deltas: a day vs the day before, a Mon–Sun week vs
 * the previous week, a calendar month vs the previous month.
 */
async function _getSalesRepAnalytics(
  salesRepId: string,
  period: MonthPeriod | DatePeriod,
): Promise<AnalyticsData> {
  const { currentStart, currentEnd, prevStart, prevEnd } = periodWindows(period);

  const [currentOrders, lastOrders] = await Promise.all([
    fetchOrders(salesRepId, currentStart, currentEnd),
    fetchOrders(salesRepId, prevStart, prevEnd),
  ]);

  return {
    current: computeMetrics(currentOrders),
    last: lastOrders.length > 0 ? computeMetrics(lastOrders) : null,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Cached entry points (Phase A — docs/dashboard-caching-plan.md).

   Rep analytics are read from the rep's own portal AND every admin/manager/analyst
   view of that rep, so the same (rep, period) result is recomputed a lot. Caching
   runs the order scan + metric reduce at most once per TTL. MonthMetrics is
   entirely numbers/strings (Decimal-free), so it serialises cleanly. Keyed by
   rep + period + explicit month so different reps/months never collide; the
   "current" (no targetMonth) case is bounded by the TTL.
   ──────────────────────────────────────────────────────────────────────────── */
const ANALYTICS_TTL_SECONDS = 120;

export function getSalesRepWeeklyAnalytics(salesRepId: string): Promise<MonthMetrics> {
  return unstable_cache(
    () => _getSalesRepWeeklyAnalytics(salesRepId),
    ["rep-weekly-analytics", salesRepId],
    { revalidate: ANALYTICS_TTL_SECONDS }
  )();
}

export function getSalesRepAnalytics(
  salesRepId: string,
  period: MonthPeriod | DatePeriod,
): Promise<AnalyticsData> {
  return unstable_cache(
    () => _getSalesRepAnalytics(salesRepId, period),
    ["rep-analytics", salesRepId, periodCacheKey(period)],
    { revalidate: ANALYTICS_TTL_SECONDS }
  )();
}
