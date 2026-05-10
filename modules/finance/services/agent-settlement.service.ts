import { prisma } from "@/lib/db/prisma";

const fmt = (n: number) =>
  `₦${Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

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

export async function listDeliveredOrdersForAgent(agentId: string) {
  const orders = await prisma.order.findMany({
    where: { agentId, status: "DELIVERED", deletedAt: null },
    include: { customer: { select: { name: true, state: true } } },
    orderBy: { date: "desc" },
    take: 50,
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
