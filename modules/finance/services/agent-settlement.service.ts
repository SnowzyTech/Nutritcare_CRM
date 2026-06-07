import { prisma } from "@/lib/db/prisma";

const fmt = (n: number) =>
  `₦${Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

async function getRunningBalance(agentId: string): Promise<number> {
  const last = await prisma.agentLedgerEntry.findFirst({
    where: { agentId },
    orderBy: { createdAt: "desc" },
    select: { runningBalance: true },
  });
  return Number(last?.runningBalance ?? 0);
}

/**
 * Called when an order is marked DELIVERED. Creates a DELIVERY_FEE debit entry
 * on the agent's ledger — recording that the agent collected netAmount from the
 * customer and now owes that amount to the company.
 * Idempotent: skips silently if an entry for this order already exists.
 */
export async function recordDeliveryFeeEntry(order: {
  agentId: string;
  netAmount: number | string;
  orderNumber: string;
  date: Date;
}): Promise<void> {
  const existing = await prisma.agentLedgerEntry.findFirst({
    where: { agentId: order.agentId, referenceType: "DELIVERY_FEE", referenceId: order.orderNumber },
    select: { id: true },
  });
  if (existing) return;

  const prevBalance = await getRunningBalance(order.agentId);
  const amount = Number(order.netAmount);

  await prisma.agentLedgerEntry.create({
    data: {
      agentId: order.agentId,
      date: order.date,
      referenceType: "DELIVERY_FEE",
      referenceId: order.orderNumber,
      debit: amount,
      credit: 0,
      runningBalance: prevBalance + amount,
    },
  });
}

export interface AgentSettlementRow {
  id: string;
  agentId: string;
  agentName: string;
  state: string;
  totalSalesValue: string;
  delFeesEarned: string;
  totalRemitted: string;
  balance: string;
  overpayment: string;
  underpayment: string;
  date: string;
}

export async function listAgentSettlements(filters: {
  search?: string;
  state?: string;
  status?: string;
  from?: Date;
  to?: Date;
} = {}): Promise<AgentSettlementRow[]> {
  const settlements = await prisma.agentSettlement.findMany({
    where: {
      ...(filters.from || filters.to
        ? { date: { ...(filters.from && { gte: filters.from }), ...(filters.to && { lte: filters.to }) } }
        : {}),
      ...(filters.state && filters.state !== "All" ? { agent: { state: filters.state } } : {}),
      ...(filters.search
        ? { agent: { companyName: { contains: filters.search, mode: "insensitive" } } }
        : {}),
    },
    include: { agent: { select: { id: true, companyName: true, state: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });

  return settlements.map(s => ({
    id: s.id,
    agentId: s.agentId,
    agentName: s.agent.companyName,
    state: s.agent.state ?? "",
    totalSalesValue: fmt(Number(s.totalSalesValue)),
    delFeesEarned: fmt(Number(s.deliveryFeesEarned)),
    totalRemitted: fmt(Number(s.totalRemitted)),
    balance: fmt(Number(s.balance)),
    overpayment: fmt(Number(s.overpayment)),
    underpayment: fmt(Number(s.underpayment)),
    date: s.date.toISOString().slice(0, 10),
  }));
}

export async function listAgentLedger(filters: {
  agentId?: string;
  referenceType?: string;
  search?: string;
  from?: Date;
  to?: Date;
} = {}) {
  const entries = await prisma.agentLedgerEntry.findMany({
    where: {
      ...(filters.agentId ? { agentId: filters.agentId } : {}),
      ...(filters.referenceType && filters.referenceType !== "All"
        ? { referenceType: filters.referenceType.toUpperCase() as any }
        : {}),
      ...(filters.from || filters.to
        ? { date: { ...(filters.from && { gte: filters.from }), ...(filters.to && { lte: filters.to }) } }
        : {}),
    },
    include: { agent: { select: { id: true, companyName: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });

  const titleCase = (s: string) =>
    s
      .toLowerCase()
      .split("_")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return entries.map(e => ({
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    agent: e.agent.companyName,
    agentId: e.agentId,
    referenceType: titleCase(e.referenceType),
    referenceId: e.referenceId,
    debit: fmt(Number(e.debit)),
    credit: fmt(Number(e.credit)),
    runningBalance: fmt(Number(e.runningBalance)),
  }));
}

export async function getAgentDetail(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
    },
  });
  if (!agent) return null;

  const settlements = await prisma.agentSettlement.findMany({
    where: { agentId },
    orderBy: { date: "desc" },
  });

  const ledger = await listAgentLedger({ agentId });

  return { agent, settlements, ledger };
}

export async function listAgentsForSelect() {
  return prisma.agent.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: { id: true, companyName: true, state: true },
    orderBy: { companyName: "asc" },
  });
}

export interface DeliveryAgentRow {
  agentId: string;
  agentName: string;
  state: string;
  totalSalesValue: string;
  delFeesEarned: string;
  totalRemitted: string;
  balance: string;
  overpayment: string;
  underpayment: string;
  date: string;
}

export async function listDeliveryAgentsWithStats(filters: {
  search?: string;
  state?: string;
} = {}): Promise<DeliveryAgentRow[]> {
  const agents = await prisma.agent.findMany({
    where: {
      deletedAt: null,
      user: { role: "DELIVERY_AGENT" },
      ...(filters.state && filters.state !== "All" ? { state: filters.state } : {}),
      ...(filters.search
        ? { companyName: { contains: filters.search, mode: "insensitive" } }
        : {}),
    },
    include: {
      agentSettlements: {
        orderBy: { date: "desc" },
      },
      // Latest ledger entry — its runningBalance is the live source of truth and
      // already reflects deliveries, remittances AND every settlement adjustment.
      agentLedgerEntries: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { runningBalance: true },
      },
    },
    orderBy: { companyName: "asc" },
  });

  return agents.map(a => {
    const settlements = a.agentSettlements;
    const sum = (field: keyof typeof settlements[0]) =>
      settlements.reduce((acc, s) => acc + Number(s[field] ?? 0), 0);

    // Current net position straight from the ledger. Positive = the agent still
    // owes the company (underpayment); negative = the company owes the agent
    // (overpayment). Derived from the ledger so the Agent List stays in lockstep
    // with the Agents Ledger tab and reacts to settlement adjustments.
    const ledgerBalance = Number(a.agentLedgerEntries[0]?.runningBalance ?? 0);

    return {
      agentId: a.id,
      agentName: a.companyName,
      state: a.state ?? "",
      totalSalesValue: fmt(sum("totalSalesValue")),
      delFeesEarned: fmt(sum("deliveryFeesEarned")),
      totalRemitted: fmt(sum("totalRemitted")),
      balance: fmt(ledgerBalance),
      overpayment: fmt(Math.max(0, -ledgerBalance)),
      underpayment: fmt(Math.max(0, ledgerBalance)),
      date: settlements[0]?.date.toISOString().slice(0, 10) ?? "—",
    };
  });
}

export async function listDeliveredOrdersForAgent(agentId: string) {
  // Only delivered orders that have not yet been remitted. Remittance status is
  // tracked on the order itself (set to REMITTED when a remittance is recorded),
  // so fully-remitted orders are filtered out at the query level.
  const orders = await prisma.order.findMany({
    where: { agentId, status: "DELIVERED", remittanceStatus: "NOT_REMITTED", deletedAt: null },
    include: { customer: { select: { name: true, state: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });

  return orders.map(o => ({
    id: o.id,
    orderId: o.orderNumber,
    customer: o.customer.name,
    state: o.customer.state,
    netAmount: fmt(Number(o.netAmount)),
    netAmountNum: Number(o.netAmount),
    date: o.date.toISOString().slice(0, 10),
  }));
}

export async function getCurrentAgentBalance(agentId: string): Promise<number> {
  const last = await prisma.agentLedgerEntry.findFirst({
    where: { agentId },
    orderBy: { createdAt: "desc" },
    select: { runningBalance: true },
  });
  return Number(last?.runningBalance ?? 0);
}

export interface AgentPageData {
  agent: {
    id: string;
    companyName: string;
    state: string | null;
    phone1: string;
    phone2: string | null;
    status: string;
    email: string | null;
    userName: string | null;
  };
  monthlyChart: { name: string; sales: number }[];
  weeklyChart: { name: string; sales: number }[];
  totalSalesYear: number;
  prevYearSalesTotal: number;
  ledger: {
    id: string;
    date: string;
    referenceType: string;
    referenceId: string;
    debit: string;
    credit: string;
    runningBalance: string;
  }[];
  inventory: {
    product: string;
    left: number;
    scheduled: number;
    value: string;
  }[];
}

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

export async function getAgentPageData(agentId: string): Promise<AgentPageData | null> {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, deletedAt: null },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!agent) return null;

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const prevYearEnd = new Date(now.getFullYear(), 0, 1);

  // Weekly chart spans the last 8 weeks (Monday-based), ending with this week.
  const WEEKS_BACK = 8;
  const startOfWeek = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const mondayOffset = (x.getDay() + 6) % 7; // Mon=0 … Sun=6
    x.setDate(x.getDate() - mondayOffset);
    return x;
  };
  const currentWeekStart = startOfWeek(now);
  const weekStarts: Date[] = Array.from({ length: WEEKS_BACK }, (_, i) => {
    const ws = new Date(currentWeekStart);
    ws.setDate(ws.getDate() - (WEEKS_BACK - 1 - i) * 7);
    return ws;
  });
  const eightWeeksAgo = weekStarts[0];

  // Fetch all data in parallel
  const [deliveredOrders, weeklyOrders, prevOrders, ledgerEntries, stockLevels, pendingOrders] =
    await Promise.all([
      // Current year delivered orders — for chart only (no longer used for inventory)
      prisma.order.findMany({
        where: { agentId, status: "DELIVERED", deletedAt: null, date: { gte: yearStart } },
        select: { netAmount: true, date: true },
      }),
      // Last 8 weeks delivered orders — for the weekly chart (may cross the year boundary)
      prisma.order.findMany({
        where: { agentId, status: "DELIVERED", deletedAt: null, date: { gte: eightWeeksAgo } },
        select: { netAmount: true, date: true },
      }),
      // Previous year for % comparison
      prisma.order.findMany({
        where: { agentId, status: "DELIVERED", deletedAt: null, date: { gte: prevYearStart, lt: prevYearEnd } },
        select: { netAmount: true },
      }),
      // Ledger entries
      prisma.agentLedgerEntry.findMany({
        where: { agentId },
        orderBy: { date: "desc" },
        take: 50,
      }),
      // Materialized stock balance — replaces the old OUTGOING movement tally.
      // StockLevel is decremented on every delivery completion, return, and
      // agent-to-agent transfer, so it is always the accurate "stock at hand".
      prisma.stockLevel.findMany({
        where: { locationKind: "AGENT", locationId: agentId },
        select: {
          productId: true,
          quantity: true,
          product: { select: { name: true, sellingPrice: true } },
        },
      }),
      // Pending orders — for "scheduled" count only
      prisma.order.findMany({
        where: { agentId, status: { in: ["PENDING", "CONFIRMED"] }, deletedAt: null },
        select: { items: { select: { quantity: true, product: { select: { id: true } } } } },
      }),
    ]);

  // ── Chart data ──────────────────────────────────────────────────────────────
  const monthTotals = Array(12).fill(0);
  let totalSalesYear = 0;
  for (const o of deliveredOrders) {
    const m = new Date(o.date).getMonth();
    const val = Number(o.netAmount);
    monthTotals[m] += val;
    totalSalesYear += val;
  }
  const monthlyChart = MONTHS.map((name, i) => ({ name, sales: Math.round(monthTotals[i] / 1000) }));
  const prevYearSalesTotal = prevOrders.reduce((s, o) => s + Number(o.netAmount), 0);

  // ── Weekly chart (last 8 weeks) ───────────────────────────────────────────────
  const weekTotals = Array(WEEKS_BACK).fill(0);
  for (const o of weeklyOrders) {
    const t = new Date(o.date).getTime();
    for (let i = 0; i < WEEKS_BACK; i++) {
      const start = weekStarts[i].getTime();
      const end = start + 7 * 24 * 60 * 60 * 1000;
      if (t >= start && t < end) {
        weekTotals[i] += Number(o.netAmount);
        break;
      }
    }
  }
  const weeklyChart = weekStarts.map((ws, i) => ({
    name: `${ws.getDate()} ${MONTHS[ws.getMonth()]}`,
    sales: Math.round(weekTotals[i] / 1000),
  }));

  // ── Ledger ──────────────────────────────────────────────────────────────────
  const titleCase = (s: string) =>
    s.toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const ledger = ledgerEntries.map((e) => ({
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    referenceType: titleCase(e.referenceType),
    referenceId: e.referenceId,
    debit: Number(e.debit) > 0 ? fmt(Number(e.debit)) : "₦0",
    credit: Number(e.credit) > 0 ? fmt(Number(e.credit)) : "₦0",
    runningBalance: fmt(Number(e.runningBalance)),
  }));

  // ── Inventory ────────────────────────────────────────────────────────────────
  // StockLevel is the materialized balance — already accounts for all incoming
  // movements, transfers, returns, AND delivery completions.  No manual
  // aggregation needed.
  const scheduledQty: Record<string, number> = {};
  for (const o of pendingOrders) {
    for (const item of o.items) {
      scheduledQty[item.product.id] = (scheduledQty[item.product.id] ?? 0) + item.quantity;
    }
  }

  const inventory = stockLevels
    .map((sl) => ({
      product: sl.product.name,
      left: Math.max(0, sl.quantity),
      scheduled: scheduledQty[sl.productId] ?? 0,
      value: fmt(Math.max(0, sl.quantity) * Number(sl.product.sellingPrice)),
    }))
    .filter((row) => row.left > 0 || row.scheduled > 0);

  return {
    agent: {
      id: agent.id,
      companyName: agent.companyName,
      state: agent.state,
      phone1: agent.phone1,
      phone2: agent.phone2,
      status: agent.status,
      email: agent.user?.email ?? null,
      userName: agent.user?.name ?? null,
    },
    monthlyChart,
    weeklyChart,
    totalSalesYear,
    prevYearSalesTotal,
    ledger,
    inventory,
  };
}
