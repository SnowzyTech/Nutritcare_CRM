import { prisma } from "@/lib/db/prisma";

const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
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

export async function getSalesByMonth(year: number = new Date().getFullYear()) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const orders = await prisma.order.findMany({
    where: { status: "DELIVERED", deletedAt: null, date: { gte: start, lt: end } },
    select: { netAmount: true, date: true },
  });
  const buckets = new Array(12).fill(0);
  for (const o of orders) buckets[o.date.getMonth()] += Number(o.netAmount);
  return buckets.map((value, i) => ({ name: MONTH_LABELS[i], value }));
}

export async function getSalesByProduct(limit = 8) {
  const items = await prisma.orderItem.groupBy({
    by: ["productId"],
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
    return {
      name: (productMap.get(i.productId) ?? "—").toUpperCase().slice(0, 8),
      value: Math.round(total / 1_000_000) || total,
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
    value: Math.round(v / 1_000_000) || v,
    isMax: v === max,
  }));
}

export async function getInventorySnapshot() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      costPrice: true,
      lowStockAlertQtyTotal: true,
      stockMovementItems: {
        select: { quantity: true, stockMovement: { select: { type: true, agentId: true, warehouseId: true } } },
      },
    },
  });

  const breakdown = products.map(p => {
    let total = 0;
    let agent = 0;
    let warehouse = 0;
    for (const item of p.stockMovementItems) {
      const t = item.stockMovement.type;
      const sign = t === "INCOMING" ? 1 : t === "OUTGOING" ? -1 : 1;
      total += item.quantity * sign;
      if (item.stockMovement.agentId) agent += item.quantity * sign;
      if (item.stockMovement.warehouseId) warehouse += item.quantity * sign;
    }
    const value = total * Number(p.costPrice);
    const lowStock = p.lowStockAlertQtyTotal != null && total <= p.lowStockAlertQtyTotal;
    return { id: p.id, name: p.name, total, value, lowStock };
  });

  const totalValue = breakdown.reduce((s, p) => s + p.value, 0);
  const totalProducts = breakdown.reduce((s, p) => s + p.total, 0);

  let agentStock = 0;
  let warehouseStock = 0;
  const movements = await prisma.stockMovement.findMany({
    select: { type: true, agentId: true, warehouseId: true, items: { select: { quantity: true } } },
  });
  for (const m of movements) {
    const sign = m.type === "INCOMING" ? 1 : m.type === "OUTGOING" ? -1 : 1;
    const qty = m.items.reduce((s, i) => s + i.quantity, 0) * sign;
    if (m.agentId) agentStock += qty;
    if (m.warehouseId) warehouseStock += qty;
  }

  const agentCount = await prisma.agent.count({ where: { deletedAt: null, status: "ACTIVE" } });
  const warehouseCount = await prisma.warehouse.count();

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
