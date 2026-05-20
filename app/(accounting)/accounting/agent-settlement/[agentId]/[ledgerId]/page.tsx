// Ledger entry detail page
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { LedgerDetailClient } from './LedgerDetailClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Ledger Entry Detail' };

async function getLedgerEntry(ledgerId: string) {
  const entry = await prisma.agentLedgerEntry.findUnique({
    where: { id: ledgerId },
    include: {
      agent: {
        select: {
          id: true,
          companyName: true,
          state: true,
        },
      },
    },
  });
  return entry;
}

async function getRelatedAdjustments(agentId: string, referenceId: string) {
  // Fetch adjustments that relate to this entry
  return prisma.settlementAdjustment.findMany({
    where: { agentId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      adjustmentType: true,
      linkedReferenceId: true,
      amount: true,
      note: true,
      createdAt: true,
    },
  });
}

async function getOrdersCoveredByEntry(agentId: string, referenceId: string) {
  // If the entry is a REMITTANCE, it may cover multiple orders
  // Try to find orders for this agent around the remittance date
  const orders = await prisma.order.findMany({
    where: { agentId, status: 'DELIVERED', deletedAt: null },
    select: { orderNumber: true },
    orderBy: { date: 'desc' },
    take: 20,
  });
  return orders.map((o) => o.orderNumber);
}

async function getRecordedBy() {
  // Fetch an accountant from DB (the logged-in user)
  const accountant = await prisma.user.findFirst({
    where: { role: 'ACCOUNTANT', isActive: true },
    select: { name: true, role: true, avatarUrl: true },
  });
  return accountant;
}

export default async function LedgerDetailPage({
  params,
}: {
  params: Promise<{ agentId: string; ledgerId: string }>;
}) {
  const { agentId, ledgerId } = await params;

  const [entry, adjustments, accountant] = await Promise.all([
    getLedgerEntry(ledgerId),
    getRelatedAdjustments(agentId, ledgerId),
    getRecordedBy(),
  ]);

  if (!entry) notFound();

  const ordersCovered = await getOrdersCoveredByEntry(agentId, entry.referenceId);

  const fmt = (n: number | string) =>
    `₦${Number(n).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

  const entryData = {
    id: entry.id,
    referenceId: entry.referenceId,
    referenceType: entry.referenceType
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    date: entry.date.toISOString().slice(0, 10),
    debit: fmt(Number(entry.debit)),
    credit: fmt(Number(entry.credit)),
    runningBalance: fmt(Number(entry.runningBalance)),
    agentName: entry.agent.companyName,
    agentId: entry.agent.id,
    agentInitial: entry.agent.companyName.charAt(0).toUpperCase(),
  };

  const adjustmentHistory = adjustments.map((a) => ({
    id: a.id,
    type: a.adjustmentType
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    referenceId: a.linkedReferenceId,
    amount: fmt(Number(a.amount)),
    note: a.note,
    date: a.createdAt.toISOString().slice(0, 10),
  }));

  const recorder = accountant
    ? { name: accountant.name, role: 'Accountant', avatarUrl: accountant.avatarUrl }
    : null;

  return (
    <LedgerDetailClient
      entry={entryData}
      ordersCovered={ordersCovered}
      adjustmentHistory={adjustmentHistory}
      recorder={recorder}
      agentId={agentId}
    />
  );
}
