import { prisma } from "@/lib/db/prisma";
import {
  getAgentStockMap,
  getWarehouseStockMap,
} from "@/modules/inventory/services/stock-level.service";
// Single source of truth for which orders count as revenue. Shared with the P&L
// and Balance Sheet so this dashboard and the reports can never disagree.
import { REVENUE_STATUSES } from "@/modules/finance/services/reports-accounting.service";

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

export async function getFinancialSummary(refDate: Date = new Date()) {
  const monthStart = startOfMonth(refDate);
  const monthEnd = endOfMonth(refDate);
  const lastMonthStart = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
  const lastMonthEnd = monthStart;

  const [revenueAgg, lastRevenueAgg, expenseAgg, lastExpenseAgg, deliveryAgg] = await Promise.all([
    prisma.order.aggregate({
      _sum: { netAmount: true },
      where: {
        status: { in: REVENUE_STATUSES },
        deletedAt: null,
        date: { gte: monthStart, lt: monthEnd },
      },
    }),
    prisma.order.aggregate({
      _sum: { netAmount: true },
      where: {
        status: { in: REVENUE_STATUSES },
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
    where: { status: { in: REVENUE_STATUSES }, deletedAt: null, date: { gte: earliest } },
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

  // Month buckets — current calendar year up to the current month (year-to-date),
  // so future months aren't plotted as misleading zeros.
  const currentMonthIdx = now.getMonth();
  const month: TrendPoint[] = MONTH_LABELS.slice(0, currentMonthIdx + 1).map((name) => ({
    name,
    value: 0,
  }));

  for (const o of orders) {
    const amt = Number(o.netAmount);
    const d = o.date;

    const di = dayIndex.get(dayKey(startOfDay(d)));
    if (di !== undefined) day[di].value += amt;

    const wi = weekStarts.indexOf(startOfWeekMon(d).getTime());
    if (wi !== -1) week[wi].value += amt;

    if (d.getFullYear() === now.getFullYear() && d.getMonth() <= currentMonthIdx) {
      month[d.getMonth()].value += amt;
    }
  }

  return { day, week, month, year: now.getFullYear() };
}

/** A [from, to) date window (to is exclusive). */
export interface DateRange {
  from: Date;
  to: Date;
}

/** Period selector shared by the dashboard's activity charts. */
export type DashboardPeriod =
  | { type: "week" }
  | { type: "month"; month: number; year: number };

/** Resolve a dashboard period into a concrete [from, to) window. */
export function resolvePeriodRange(period: DashboardPeriod, now: Date = new Date()): DateRange {
  if (period.type === "week") {
    const from = startOfWeekMon(now);
    return { from, to: addDays(from, 7) };
  }
  const from = new Date(period.year, period.month - 1, 1);
  const to = new Date(period.year, period.month, 1);
  return { from, to };
}

export async function getSalesByProduct(range?: DateRange, limit = 8) {
  // Sales uses REVENUE_STATUSES — the same definition as the P&L and Balance
  // Sheet, not just the rest of this dashboard. An optional date range scopes it
  // to the period selected on the dashboard (week / month).
  const items = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        status: { in: REVENUE_STATUSES },
        deletedAt: null,
        ...(range ? { date: { gte: range.from, lt: range.to } } : {}),
      },
    },
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

export async function getSalesByState(range?: DateRange, limit = 12) {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: REVENUE_STATUSES },
      deletedAt: null,
      ...(range ? { date: { gte: range.from, lt: range.to } } : {}),
    },
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
  const [products, agentStockMap, warehouseStockMap, unassignedRows] =
    await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null, isActive: true },
        select: { id: true, name: true, costPrice: true, lowStockAlertQtyTotal: true },
      }),
      getAgentStockMap(),
      getWarehouseStockMap(),
      prisma.stockLevel.findMany({
        where: { locationKind: "UNASSIGNED" },
        select: { productId: true, quantity: true },
      }),
    ]);

  // Restrict every figure to the snapshot's product set (active, non-deleted).
  const countedIds = new Set(products.map((p) => p.id));

  // On-hand per product = sum of POSITIVE balances across every location kind
  // (warehouse + agent + unassigned), floored per row. We do NOT use
  // getProductTotalsMap here because it floors the per-product NET at 0, so a
  // single negative balance (an oversold location) would make Total Products
  // undercount and fall below Stock With Agents — the bug this fixes. Summing
  // per-row-floored balances guarantees Total ≥ each location's stock.
  const onHandByProduct: Record<string, number> = {};
  const accumulateMap = (m: Record<string, Record<string, number>>) => {
    for (const perProduct of Object.values(m)) {
      for (const [productId, qty] of Object.entries(perProduct)) {
        if (countedIds.has(productId)) {
          onHandByProduct[productId] = (onHandByProduct[productId] ?? 0) + qty;
        }
      }
    }
  };
  accumulateMap(agentStockMap);
  accumulateMap(warehouseStockMap);
  for (const r of unassignedRows) {
    if (countedIds.has(r.productId)) {
      onHandByProduct[r.productId] =
        (onHandByProduct[r.productId] ?? 0) + Math.max(0, r.quantity);
    }
  }

  const breakdown = products.map((p) => {
    const total = onHandByProduct[p.id] ?? 0;
    const value = total * Number(p.costPrice);
    const lowStock = p.lowStockAlertQtyTotal != null && total <= p.lowStockAlertQtyTotal;
    return { id: p.id, name: p.name, total, value, lowStock };
  });

  const totalValue = breakdown.reduce((s, p) => s + p.value, 0);
  const totalProducts = breakdown.reduce((s, p) => s + p.total, 0);

  // Per-location-kind totals + how many locations actually HOLD stock (not the
  // raw warehouse/agent record counts).
  const summarize = (m: Record<string, Record<string, number>>) => {
    let total = 0;
    let locationsWithStock = 0;
    for (const perProduct of Object.values(m)) {
      let locTotal = 0;
      for (const [productId, qty] of Object.entries(perProduct)) {
        if (countedIds.has(productId)) locTotal += qty;
      }
      if (locTotal > 0) {
        total += locTotal;
        locationsWithStock += 1;
      }
    }
    return { total, locationsWithStock };
  };

  const agents = summarize(agentStockMap);
  const warehouses = summarize(warehouseStockMap);

  return {
    totalValue,
    totalProducts,
    agentStock: agents.total,
    warehouseStock: warehouses.total,
    agentCount: agents.locationsWithStock,
    warehouseCount: warehouses.locationsWithStock,
    products: breakdown,
  };
}

export async function getAgentSettlementSummary(range?: DateRange) {
  // Derived from the agent ledger — the exact source of truth the Agent List
  // page uses. For each agent within the window we net debits (deliveries the
  // agent owes for) against credits (remittances / adjustments):
  //   • net > 0  → agent still owes the company  (pending remittance)
  //   • net < 0  → the company owes the agent     (overpayment)
  // With no range ("all time") the window covers every entry, and the per-agent
  // net equals their current running balance.
  const dateWhere = range ? { date: { gte: range.from, lt: range.to } } : {};

  const [balances, remittances] = await Promise.all([
    // Net position change per agent across all ledger activity in the window.
    prisma.agentLedgerEntry.groupBy({
      by: ["agentId"],
      where: dateWhere,
      _sum: { debit: true, credit: true },
    }),
    // Money actually remitted by each agent in the window (credits tagged
    // REMITTANCE) — drives the "Top Performing Agent" figure.
    prisma.agentLedgerEntry.groupBy({
      by: ["agentId"],
      where: { ...dateWhere, referenceType: "REMITTANCE" },
      _sum: { credit: true },
    }),
  ]);

  const remittedByAgent = new Map(
    remittances.map((r) => [r.agentId, Number(r._sum.credit ?? 0)]),
  );

  const agentIds = balances.map((b) => b.agentId);
  const agents = agentIds.length
    ? await prisma.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, companyName: true, state: true },
      })
    : [];
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  let totalPendingRemittance = 0;
  let totalPendingCount = 0;
  let companyOwingAgents = 0;
  let top: { name: string; state: string; remitted: number } | null = null;

  for (const b of balances) {
    const balance = Number(b._sum.debit ?? 0) - Number(b._sum.credit ?? 0);
    if (balance > 0) {
      totalPendingRemittance += balance;
      totalPendingCount += 1;
    } else if (balance < 0) {
      companyOwingAgents += -balance;
    }

    const remitted = remittedByAgent.get(b.agentId) ?? 0;
    if (!top || remitted > top.remitted) {
      const a = agentMap.get(b.agentId);
      top = { name: a?.companyName ?? "—", state: a?.state ?? "", remitted };
    }
  }

  return {
    totalPendingRemittance,
    totalPendingCount,
    // Money the company owes agents (overpayments) — same ledger-derived figure.
    totalOverpayments: companyOwingAgents,
    companyOwingAgents,
    topAgentName: top?.name ?? "—",
    topAgentState: top?.state ?? "",
    topAgentRemitted: top?.remitted ?? 0,
  };
}
