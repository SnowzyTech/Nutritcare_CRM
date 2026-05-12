import { prisma } from "@/lib/db/prisma";

const fmt = (n: number) =>
  `₦${Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

// ── Chart of Accounts ─────────────────────────────────────────────────────────

export interface ChartRow {
  type: string;
  description: string;
  instances: string;
}

export async function getChartOfAccounts(): Promise<ChartRow[]> {
  const [categories, accounts] = await Promise.all([
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.paymentAccount.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const rows: ChartRow[] = [];

  if (categories.length > 0) {
    rows.push({
      type: "Expense",
      description: "Operating and business expense categories",
      instances: categories.map((c) => c.name).join(", "),
    });
  }

  const grouped = accounts.reduce<Record<string, string[]>>((acc, a) => {
    (acc[a.type] = acc[a.type] ?? []).push(a.name);
    return acc;
  }, {});

  for (const [type, names] of Object.entries(grouped)) {
    rows.push({
      type,
      description: `${type} payment accounts`,
      instances: names.join(", "),
    });
  }

  return rows;
}

// ── Journal Entries ───────────────────────────────────────────────────────────

export async function listJournalEntries() {
  const db = prisma as any;
  return db.journalEntry.findMany({
    include: { rows: true },
    orderBy: { date: "desc" },
    take: 100,
  });
}

export async function getNextJournalNo(): Promise<string> {
  const db = prisma as any;
  const last = await db.journalEntry.findFirst({
    orderBy: { createdAt: "desc" },
    select: { journalNo: true },
  });
  const n = last ? parseInt(last.journalNo as string, 10) : 1000;
  return String((isNaN(n) ? 1000 : n) + 1);
}

// ── General Ledger ────────────────────────────────────────────────────────────

export interface LedgerRow {
  account: string;
  description: string;
  ref: string;
  debit: string;
  credit: string;
  balance: string;
  date: string;
}

export async function getGeneralLedger(filters: {
  account?: string;
  from?: Date;
  to?: Date;
} = {}): Promise<LedgerRow[]> {
  const db = prisma as any;

  const entries = await db.journalEntry.findMany({
    where: {
      ...(filters.from || filters.to
        ? {
            date: {
              ...(filters.from && { gte: filters.from }),
              ...(filters.to && { lte: filters.to }),
            },
          }
        : {}),
    },
    include: {
      rows: {
        ...(filters.account && filters.account !== "All"
          ? { where: { account: filters.account } }
          : {}),
      },
    },
    orderBy: { date: "asc" },
    take: 500,
  });

  const rows: LedgerRow[] = [];
  const runningBalances: Record<string, number> = {};

  for (const entry of entries) {
    for (const row of entry.rows) {
      const acc = row.account as string;
      const debit = Number(row.debits ?? 0);
      const credit = Number(row.credits ?? 0);
      runningBalances[acc] = (runningBalances[acc] ?? 0) + debit - credit;

      rows.push({
        account: acc,
        description: (row.description as string | null) ?? "",
        ref: entry.journalNo as string,
        debit: debit > 0 ? fmt(debit) : "—",
        credit: credit > 0 ? fmt(credit) : "—",
        balance: fmt(Math.abs(runningBalances[acc])),
        date: (entry.date as Date).toISOString().slice(0, 10),
      });
    }
  }

  return rows.reverse();
}
