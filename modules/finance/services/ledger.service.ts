import { prisma } from "@/lib/db/prisma";

const fmt = (n: number) =>
  `₦${Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

// ── Chart of Accounts ─────────────────────────────────────────────────────────

export interface ChartRow {
  code: string;
  categoryId: string;
  categoryName: string;
  financialStatement: string;
  accountName: string;
  accountNameId: string;
}

export interface CategoryForLedger {
  id: string;
  name: string;
  financialStatement: string | null;
  expenseNames: { id: string; name: string }[];
}

export async function getChartOfAccounts(): Promise<ChartRow[]> {
  const categories = await prisma.expenseCategory.findMany({
    orderBy: { name: "asc" },
    include: { expenseNames: { orderBy: { name: "asc" } } },
  });

  const rows: ChartRow[] = [];
  let counter = 1000;

  for (const cat of categories) {
    for (const name of cat.expenseNames) {
      counter++;
      rows.push({
        code: String(counter),
        categoryId: cat.id,
        categoryName: cat.name,
        financialStatement: cat.financialStatement ?? "",
        accountName: name.name,
        accountNameId: name.id,
      });
    }
  }

  return rows;
}

export async function listCategoriesForLedger(): Promise<CategoryForLedger[]> {
  return prisma.expenseCategory.findMany({
    orderBy: { name: "asc" },
    include: { expenseNames: { orderBy: { name: "asc" } } },
  });
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
