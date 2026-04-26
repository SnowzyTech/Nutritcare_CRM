import { prisma } from "@/lib/db/prisma";

export type PeriodStats = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  failedOrders: number;
  totalProductsSold: number;
  uniqueCustomers: number;
  bestSellingProduct: string;
  leastSellingProduct: string;
  confirmationRate: number;
  deliveryRate: number;
  failedOrderRate: number;
  avgOrdersPerDay: number;
  totalStockIn: number;
  totalStockOut: number;
};

export type ChartPoint = { name: string; value: number };

export type AdminDashboardData = {
  current: PeriodStats;
  last: PeriodStats;
  monthlyRevenue: ChartPoint[];
  weeklyOrders: ChartPoint[];
  remainingStock: number;
};

function emptyStats(): PeriodStats {
  return {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    failedOrders: 0,
    totalProductsSold: 0,
    uniqueCustomers: 0,
    bestSellingProduct: "N/A",
    leastSellingProduct: "N/A",
    confirmationRate: 0,
    deliveryRate: 0,
    failedOrderRate: 0,
    avgOrdersPerDay: 0,
    totalStockIn: 0,
    totalStockOut: 0,
  };
}

async function computePeriodStats(from: Date, to: Date): Promise<PeriodStats> {
  const daysInPeriod = Math.max(
    1,
    Math.ceil((to.getTime() - from.getTime()) / (86400 * 1000))
  );

  const [orders, expensesAgg, stockInAgg, stockOutAgg] = await Promise.all([
    prisma.order.findMany({
      where: { deletedAt: null, createdAt: { gte: from, lt: to } },
      select: {
        status: true,
        netAmount: true,
        customerId: true,
        items: {
          select: {
            quantity: true,
            product: { select: { name: true } },
          },
        },
      },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: from, lt: to } },
      _sum: { amount: true },
    }),
    prisma.stockMovementItem.aggregate({
      where: {
        stockMovement: { type: "INCOMING", date: { gte: from, lt: to } },
      },
      _sum: { quantity: true },
    }),
    prisma.stockMovementItem.aggregate({
      where: {
        stockMovement: { type: "OUTGOING", date: { gte: from, lt: to } },
      },
      _sum: { quantity: true },
    }),
  ]);

  if (orders.length === 0) return emptyStats();

  const total = orders.length;
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
  const failed = orders.filter((o) => o.status === "FAILED").length;
  const confirmed = orders.filter((o) => o.status === "CONFIRMED").length;

  const totalRevenue = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + Number(o.netAmount), 0);

  const totalExpenses = Number(expensesAgg._sum.amount ?? 0);
  const netProfit = totalRevenue - totalExpenses;

  const attemptedDelivery = confirmed + delivered + failed;
  const confirmationRate =
    total > 0 ? Math.round((attemptedDelivery / total) * 100) : 0;
  const deliveryRate =
    attemptedDelivery > 0
      ? Math.round((delivered / attemptedDelivery) * 100)
      : 0;
  const failedOrderRate =
    total > 0 ? Math.round((failed / total) * 100) : 0;
  const avgOrdersPerDay = Math.round(total / daysInPeriod);

  const deliveredOrdersList = orders.filter((o) => o.status === "DELIVERED");
  const productQtyMap = new Map<string, number>();
  let totalProductsSold = 0;

  for (const order of deliveredOrdersList) {
    for (const item of order.items) {
      totalProductsSold += item.quantity;
      productQtyMap.set(
        item.product.name,
        (productQtyMap.get(item.product.name) ?? 0) + item.quantity
      );
    }
  }

  const sortedProducts = [...productQtyMap.entries()].sort(
    (a, b) => b[1] - a[1]
  );
  const bestSellingProduct = sortedProducts[0]?.[0] ?? "N/A";
  const leastSellingProduct =
    sortedProducts[sortedProducts.length - 1]?.[0] ?? "N/A";

  const uniqueCustomers = new Set(orders.map((o) => o.customerId)).size;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    totalOrders: total,
    deliveredOrders: delivered,
    cancelledOrders: cancelled,
    failedOrders: failed,
    totalProductsSold,
    uniqueCustomers,
    bestSellingProduct,
    leastSellingProduct,
    confirmationRate,
    deliveryRate,
    failedOrderRate,
    avgOrdersPerDay,
    totalStockIn: stockInAgg._sum.quantity ?? 0,
    totalStockOut: stockOutAgg._sum.quantity ?? 0,
  };
}

async function getMonthlyRevenue(year: number): Promise<ChartPoint[]> {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const orders = await prisma.order.findMany({
    where: {
      deletedAt: null,
      status: "DELIVERED",
      createdAt: { gte: yearStart, lt: yearEnd },
    },
    select: { createdAt: true, netAmount: true },
  });

  const monthlyTotals = new Array(12).fill(0);
  for (const order of orders) {
    monthlyTotals[order.createdAt.getMonth()] += Number(order.netAmount);
  }

  const months = [
    "JAN","FEB","MAR","APR","MAY","JUN",
    "JUL","AUG","SEP","OCT","NOV","DEC",
  ];
  return months.map((name, i) => ({ name, value: monthlyTotals[i] }));
}

async function getWeeklyOrders(from: Date, to: Date): Promise<ChartPoint[]> {
  const orders = await prisma.order.findMany({
    where: { deletedAt: null, createdAt: { gte: from, lt: to } },
    select: { createdAt: true },
  });

  // counts[0]=Sun, counts[1]=Mon, ..., counts[6]=Sat
  const counts = new Array(7).fill(0);
  for (const order of orders) {
    counts[order.createdAt.getDay()]++;
  }

  return [
    { name: "Mo", value: counts[1] },
    { name: "Tu", value: counts[2] },
    { name: "We", value: counts[3] },
    { name: "Th", value: counts[4] },
    { name: "Fr", value: counts[5] },
    { name: "Sa", value: counts[6] },
    { name: "Su", value: counts[0] },
  ];
}

async function getRemainingStock(): Promise<number> {
  const [totalIn, totalOut] = await Promise.all([
    prisma.stockMovementItem.aggregate({
      where: { stockMovement: { type: "INCOMING" } },
      _sum: { quantity: true },
    }),
    prisma.stockMovementItem.aggregate({
      where: { stockMovement: { type: "OUTGOING" } },
      _sum: { quantity: true },
    }),
  ]);
  return Math.max(
    0,
    (totalIn._sum.quantity ?? 0) - (totalOut._sum.quantity ?? 0)
  );
}

export async function getAdminDashboardData(
  year: number,
  month: number
): Promise<AdminDashboardData> {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  const lastFrom = new Date(year, month - 2, 1);
  const lastTo = from;

  const [current, last, monthlyRevenue, weeklyOrders, remainingStock] =
    await Promise.all([
      computePeriodStats(from, to),
      computePeriodStats(lastFrom, lastTo),
      getMonthlyRevenue(year),
      getWeeklyOrders(from, to),
      getRemainingStock(),
    ]);

  return { current, last, monthlyRevenue, weeklyOrders, remainingStock };
}
