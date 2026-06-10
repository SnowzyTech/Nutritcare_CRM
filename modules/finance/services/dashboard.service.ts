import { prisma } from "@/lib/db/prisma";
import {
  getProductTotalsMap,
  getAgentStockMap,
  getWarehouseStockMap,
} from "@/modules/inventory/services/stock-level.service";

const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Monday-based start of the week containing `date`. */
function startOfWeekMon(date: Date) {
  const s = startOfDay(date);
  const dow = (s.getDay() + 6) % 7; // 0 = Monday … 6 = Sunday
  s.setDate(s.getDate() - dow);
  return s;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export async function getFinancialSummary() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = monthStart;

  const [revenueAgg, lastRevenueAgg, expenseAgg, lastExpenseAgg, deliveryAgg] = await Promise.all([
    prisma.order.aggregate({
      _sum: { netAmount: true },
      where: {
        status: "DELIVERED",
        deletedAt: null,
        date: { gte: monthStart, lt: monthEnd },
      },
    }),
    prisma.order.aggregate({
      _sum: { netAmount: true },
      where: {
        status: "DELIVERED",
        deletedAt: null,
        date: { gte: lastMonthStart, lt: lastMonthEnd },
      },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: lastMonthStart, lt: lastMonthEnd } },
    }),
    prisma.order.aggregate({
      _sum: { deliveryFee: true },
      where: {
        deletedAt: null,
        date: { gte: monthStart, lt: monthEnd },
      },
    }),
  ]);

  const revenue = Number(revenueAgg._sum.netAmount ?? 0);
  const lastRevenue = Number(lastRevenueAgg._sum.netAmount ?? 0);
  const expenses = Number(expenseAgg._sum.amount ?? 0);
  const lastExpenses = Number(lastExpenseAgg._sum.amount ?? 0);
  const deliveryExpenses = Number(deliveryAgg._sum.deliveryFee ?? 0);

  const pct = (curr: number, prev: number) => (prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100));

  return {
    totalRevenue: revenue,
    netProfit: revenue - expenses,
    totalExpenses: expenses,
    deliveryExpenses,
    revenueChangePct: pct(revenue, lastRevenue),
    expenseChangePct: pct(expenses, lastExpenses),
    profitChangePct: pct(revenue - expenses, lastRevenue - lastExpenses),
    deliveryChangePct: 0,
  };
}

export type TrendPoint = { name: string; value: number };
export interface SalesTrends {
  day: TrendPoint[];
  week: TrendPoint[];
  month: TrendPoint[];
  year: number;
}

/**
 * Delivered-order revenue bucketed three ways for the dashboard toggle:
 *   • day   → last 7 days (labelled by weekday)
 *   • week  → last 12 weeks (labelled by week-start date, Monday-based)
 *   • month → 12 calendar months of the current year
 * One query covers the widest range; rows are then fanned out into each bucket.
 */
export async function getSalesTrends(now: Date = new Date()): Promise<SalesTrends> {
  const today = startOfDay(now);
  const dayStart = addDays(today, -6); // 7 days incl. today
  const weekStart = addDays(startOfWeekMon(now), -7 * 11); // 12 weeks incl. this week
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const earliest = new Date(
    Math.min(dayStart.getTime(), weekStart.getTime(), yearStart.getTime()),
  );

  const orders = await prisma.order.findMany({
    where: { status: "DELIVERED", deletedAt: null, date: { gte: earliest } },
    select: { netAmount: true, date: true },
  });

  // Day buckets — last 7 days
  const day: TrendPoint[] = [];
  const dayIndex = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = addDays(dayStart, i);
    dayIndex.set(dayKey(d), i);
    day.push({ name: WEEKDAY_SHORT[d.getDay()], value: 0 });
  }

  // Week buckets — last 12 weeks
  const week: TrendPoint[] = [];
  const weekStarts: number[] = [];
  for (let i = 0; i < 12; i++) {
    const ws = addDays(weekStart, i * 7);
    weekStarts.push(ws.getTime());
    week.push({ name: `${ws.getDate()} ${MONTH_SHORT[ws.getMonth()]}`, value: 0 });
  }

  // Month buckets — current calendar year
  const month: TrendPoint[] = MONTH_LABELS.map((name) => ({ name, value: 0 }));

  for (const o of orders) {
    const amt = Number(o.netAmount);
    const d = o.date;

    const di = dayIndex.get(dayKey(startOfDay(d)));
    if (di !== undefined) day[di].value += amt;

    const wi = weekStarts.indexOf(startOfWeekMon(d).getTime());
    if (wi !== -1) week[wi].value += amt;

    if (d.getFullYear() === now.getFullYear()) month[d.getMonth()].value += amt;
  }

  return { day, week, month, year: now.getFullYear() };
}

export async function getSalesByProduct(limit = 8) {
  // Sales = revenue from DELIVERED orders only (matches the revenue definition
  // used everywhere else on this dashboard).
  const items = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { status: "DELIVERED", deletedAt: null } },
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { lineTotal: "desc" } },
    take: limit,
  });
  if (items.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: items.map(i => i.productId) } },
    select: { id: true, name: true },
  });
  const productMap = new Map(products.map(p => [p.id, p.name]));
  const max = Math.max(...items.map(i => Number(i._sum.lineTotal ?? 0)));
  return items.map(i => {
    const total = Number(i._sum.lineTotal ?? 0);
    const fullName = productMap.get(i.productId) ?? "—";
    return {
      name: fullName.toUpperCase(),
      fullName,
      value: total, // real ₦ — charts format for display, tooltip shows exact
      quantity: Number(i._sum.quantity ?? 0),
      isMax: total === max && max > 0,
    };
  });
}

export async function getSalesByState(limit = 12) {
  const orders = await prisma.order.findMany({
    where: { status: "DELIVERED", deletedAt: null },
    select: { netAmount: true, customer: { select: { state: true } } },
  });
  const map = new Map<string, number>();
  for (const o of orders) {
    const s = o.customer?.state ?? "—";
    map.set(s, (map.get(s) ?? 0) + Number(o.netAmount));
  }
  const list = [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  if (list.length === 0) return [];
  const max = Math.max(...list.map(([, v]) => v));
  return list.map(([name, v]) => ({
    name: name.toUpperCase(),
    fullName: name,
    value: v, // real ₦ — charts format for display, tooltip shows exact
    isMax: v === max,
  }));
}

export async function getInventorySnapshot() {
  // Source of truth is the materialized StockLevel table (locationKind +
  // locationId), NOT StockMovement aggregation — agent stock arrives via
  // warehouse→agent transfers and leaves on delivery, neither of which writes
  // agentId-tagged StockMovement rows. Reading movements here reported 0.
  const [products, totalsMap, agentStockMap, warehouseStockMap, agentCount, warehouseCount] =
    await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null, isActive: true },
        select: { id: true, name: true, costPrice: true, lowStockAlertQtyTotal: true },
      }),
      getProductTotalsMap(),
      getAgentStockMap(),
      getWarehouseStockMap(),
      prisma.agent.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.warehouse.count(),
    ]);

  const breakdown = products.map((p) => {
    const total = totalsMap[p.id] ?? 0;
    const value = total * Number(p.costPrice);
    const lowStock = p.lowStockAlertQtyTotal != null && total <= p.lowStockAlertQtyTotal;
    return { id: p.id, name: p.name, total, value, lowStock };
  });

  const totalValue = breakdown.reduce((s, p) => s + p.value, 0);
  const totalProducts = breakdown.reduce((s, p) => s + p.total, 0);

  // Sum every product's balance across all locations of a given kind.
  const sumLocationMap = (m: Record<string, Record<string, number>>) =>
    Object.values(m).reduce(
      (sum, perProduct) => sum + Object.values(perProduct).reduce((a, b) => a + b, 0),
      0,
    );

  const agentStock = sumLocationMap(agentStockMap);
  const warehouseStock = sumLocationMap(warehouseStockMap);

  return {
    totalValue,
    totalProducts,
    agentStock,
    warehouseStock,
    agentCount,
    warehouseCount,
    products: breakdown,
  };
}

export async function getAgentSettlementSummary() {
  const settlements = await prisma.agentSettlement.findMany({
    select: { balance: true, overpayment: true, underpayment: true, totalRemitted: true, agent: { select: { companyName: true, state: true } } },
    orderBy: { date: "desc" },
  });

  const totalPendingRemittance = settlements.reduce((s, x) => s + Math.max(0, Number(x.balance)), 0);
  const totalPendingCount = settlements.filter(s => Number(s.balance) > 0).length;
  const totalOverpayments = settlements.reduce((s, x) => s + Number(x.overpayment), 0);
  const companyOwingAgents = settlements.reduce((s, x) => s + Math.max(0, -Number(x.balance)), 0);

  const top = [...settlements].sort((a, b) => Number(b.totalRemitted) - Number(a.totalRemitted))[0];

  return {
    totalPendingRemittance,
    totalPendingCount,
    totalOverpayments,
    companyOwingAgents,
    topAgentName: top?.agent?.companyName ?? "—",
    topAgentState: top?.agent?.state ?? "",
    topAgentRemitted: Number(top?.totalRemitted ?? 0),
  };
}
