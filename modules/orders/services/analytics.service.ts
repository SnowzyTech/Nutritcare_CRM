import { prisma } from "@/lib/db/prisma";

export type ProductStat = { name: string; qty: number };

export type MonthMetrics = {
  totalProductsSold: number;
  totalOrders: number;
  uniqueCustomers: number;
  bestSellingProduct: string;
  generalPerformance: number;
  upsellRate: number;
  confirmationRate: number;
  deliveryRate: number;
  cancellationRate: number;
  recoveryRate: number;
  topProducts: ProductStat[];
  upsoldProducts: ProductStat[];
};

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

  const confirmationRate =
    total > 0 ? Math.round((attemptedDelivery / total) * 100) : 0;
  const deliveryRate =
    attemptedDelivery > 0 ? Math.round((delivered / attemptedDelivery) * 100) : 0;
  const cancellationRate =
    total > 0 ? Math.round((cancelled / total) * 100) : 0;
  const recoveryRate =
    deliveryAttempted > 0 ? Math.round((delivered / deliveryAttempted) * 100) : 0;
  const generalPerformance = Math.round(
    confirmationRate * 0.7 + (100 - cancellationRate) * 0.3
  );

  // Total products sold = all items in non-cancelled orders
  const nonCancelledOrders = orders.filter((o) => o.status !== "CANCELLED");
  const totalProductsSold = nonCancelledOrders
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

  // Upsell = orders with >1 distinct product type (multi-item orders)
  const multiItemOrders = orders.filter(
    (o) => new Set(o.items.map((i) => i.productId)).size > 1
  );
  const upsellRate =
    total > 0 ? Math.round((multiItemOrders.length / total) * 100) : 0;

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
    uniqueCustomers,
    bestSellingProduct,
    generalPerformance,
    upsellRate,
    confirmationRate,
    deliveryRate,
    cancellationRate,
    recoveryRate,
    topProducts,
    upsoldProducts,
  };
}

export async function getSalesRepAnalytics(salesRepId: string): Promise<AnalyticsData> {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [currentOrders, lastOrders] = await Promise.all([
    fetchOrders(salesRepId, currentMonthStart),
    fetchOrders(salesRepId, lastMonthStart, currentMonthStart),
  ]);

  return {
    current: computeMetrics(currentOrders),
    last: lastOrders.length > 0 ? computeMetrics(lastOrders) : null,
  };
}
