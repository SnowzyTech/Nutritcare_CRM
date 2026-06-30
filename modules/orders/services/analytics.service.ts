import { prisma } from "@/lib/db/prisma";
import { generalPerformanceScore, kpiScore } from "@/lib/performance";

export type ProductStat = { name: string; qty: number };

export type MonthMetrics = {
  totalProductsSold: number;
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

export type Period = "week" | "month";

export type AnalyticsData = {
  current: MonthMetrics;
  last: MonthMetrics | null;
};

type OrderRow = Awaited<ReturnType<typeof fetchOrders>>[number];

async function fetchOrders(salesRepId: string, from: Date, to?: Date) {
  return prisma.order.findMany({
    where: {
      salesRepId,
      deletedAt: null,
      createdAt: { gte: from, ...(to ? { lt: to } : {}) },
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

  // Total products sold = item quantities across DELIVERED orders only
  const totalProductsSold = orders
    .filter((o) => o.status === "DELIVERED")
    .flatMap((o) => o.items)
    .reduce((sum, item) => sum + item.quantity, 0);

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
    totalProductsSold,
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

export async function getSalesRepWeeklyAnalytics(salesRepId: string): Promise<MonthMetrics> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const orders = await fetchOrders(salesRepId, weekStart);
  return computeMetrics(orders);
}

export async function getSalesRepAnalytics(
  salesRepId: string,
  period: Period = "month",
  targetMonth?: Date,
): Promise<AnalyticsData> {
  if (period === "week") {
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(now.getDate() - 6);
    currentStart.setHours(0, 0, 0, 0);
    const currentEnd = new Date(now);
    currentEnd.setDate(now.getDate() + 1);
    currentEnd.setHours(0, 0, 0, 0);
    const lastStart = new Date(now);
    lastStart.setDate(now.getDate() - 13);
    lastStart.setHours(0, 0, 0, 0);

    const [currentOrders, lastOrders] = await Promise.all([
      fetchOrders(salesRepId, currentStart, currentEnd),
      fetchOrders(salesRepId, lastStart, currentStart),
    ]);

    return {
      current: computeMetrics(currentOrders),
      last: lastOrders.length > 0 ? computeMetrics(lastOrders) : null,
    };
  }

  // Default: month
  const now = targetMonth || new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [currentOrders, lastOrders] = await Promise.all([
    fetchOrders(salesRepId, currentMonthStart, nextMonthStart),
    fetchOrders(salesRepId, lastMonthStart, currentMonthStart),
  ]);

  return {
    current: computeMetrics(currentOrders),
    last: lastOrders.length > 0 ? computeMetrics(lastOrders) : null,
  };
}
