"use server";

import {
  listDeliveredOrdersForAgent,
  listAgentLedger,
  getCurrentAgentBalance,
} from "@/modules/finance/services/agent-settlement.service";
import { prisma } from "@/lib/db/prisma";

export async function fetchDeliveredOrdersAction(agentId: string) {
  if (!agentId) return [];
  return listDeliveredOrdersForAgent(agentId);
}

export async function fetchAgentRemittancesAction(agentId: string) {
  if (!agentId) return [];
  const entries = await listAgentLedger({ agentId, referenceType: "REMITTANCE" });
  return entries.slice(0, 20);
}

export async function fetchAgentBalanceAction(agentId: string) {
  if (!agentId) return 0;
  return getCurrentAgentBalance(agentId);
}

export async function fetchAgentLedgerRefsAction(agentId: string) {
  if (!agentId) return [];
  const entries = await prisma.agentLedgerEntry.findMany({
    where: { agentId },
    orderBy: { date: "desc" },
    select: {
      id: true,
      referenceId: true,
      referenceType: true,
      date: true,
      debit: true,
      credit: true,
    },
  });
  return entries.map(e => ({
    id: e.id,
    referenceId: e.referenceId,
    referenceType: e.referenceType as string,
    date: e.date.toISOString().slice(0, 10),
    debit: Number(e.debit),
    credit: Number(e.credit),
  }));
}

export async function fetchAgentAdjustmentsAction(agentId: string) {
  if (!agentId) return [];
  const adjustments = await prisma.settlementAdjustment.findMany({
    where: { agentId },
    include: {
      createdBy: { select: { name: true, role: true, avatarUrl: true } },
    },
    orderBy: { date: "desc" },
    take: 30,
  });

  return adjustments.map(a => ({
    id: a.id,
    date: a.date.toISOString().slice(0, 10),
    adjustmentType: a.adjustmentType,
    linkedReferenceId: a.linkedReferenceId,
    paymentType: a.paymentType,
    amount: Number(a.amount),
    note: a.note ?? "",
    ordersJson: a.ordersJson,
    amountRemitted: Number(a.amountRemitted),
    autoRunningBalance: Number(a.autoRunningBalance),
    createdBy: a.createdBy
      ? { name: a.createdBy.name, role: a.createdBy.role }
      : null,
  }));
}
