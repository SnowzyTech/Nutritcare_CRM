/**
 * Seeds the Chart of Accounts (docs/nutritcare.xlsx) into the database.
 *
 * Maps the chart onto the existing two-level structure used by the Accounting
 * module: each account GROUP becomes an ExpenseCategory and each leaf ACCOUNT
 * becomes an ExpenseName carrying its real code, class, type, normal balance and
 * financial statement.
 *
 * Idempotent & safe to re-run:
 *   - Expense categories/names with NO posted expenses are wiped and rebuilt.
 *   - The two Cash & Bank accounts are seeded as PaymentAccounts if missing.
 *
 * Run:  npm run db:seed:coa
 */

import { PrismaClient } from "@prisma/client";
import { CHART_OF_ACCOUNTS, CLASS_LABELS } from "../modules/finance/data/chart-of-accounts";

// ── Inline the same Neon-aware client logic from lib/db/prisma.ts ──────────────
function createClient() {
  const url = process.env.DATABASE_URL ?? "";
  if (url.includes("neon.tech")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool, neonConfig } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require("@prisma/adapter-neon");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    neonConfig.webSocketConstructor = require("ws");
    const pool = new Pool({ connectionString: url });
    return new PrismaClient({ adapter: new PrismaNeon(pool) } as never);
  }
  return new PrismaClient();
}

const prisma = createClient() as PrismaClient;

async function main() {
  // ── 1. Remove any expense categories/names that carry no posted expenses ──────
  const referencedCatIds = new Set(
    (await prisma.expense.findMany({ select: { expenseCategoryId: true } })).map(
      (e) => e.expenseCategoryId,
    ),
  );
  const referencedNameIds = new Set(
    (
      await prisma.expense.findMany({
        where: { expenseNameId: { not: null } },
        select: { expenseNameId: true },
      })
    ).map((e) => e.expenseNameId as string),
  );

  await prisma.expenseName.deleteMany({
    where: { id: { notIn: [...referencedNameIds] } },
  });
  await prisma.expenseCategory.deleteMany({
    where: { id: { notIn: [...referencedCatIds] } },
  });

  // ── 2. Build category groups (preserve first-seen order per the chart) ────────
  const groups = new Map<
    string,
    { accountClass: number; financialStatement: string | null; accountType: string | null }
  >();
  for (const a of CHART_OF_ACCOUNTS) {
    if (!groups.has(a.group)) {
      groups.set(a.group, {
        accountClass: a.accountClass,
        financialStatement: a.financialStatement,
        accountType: a.accountType,
      });
    }
  }

  const categoryIdByGroup = new Map<string, string>();
  for (const [group, meta] of groups) {
    const cat = await prisma.expenseCategory.upsert({
      where: { name: group },
      update: {
        accountClass: meta.accountClass,
        financialStatement: meta.financialStatement,
        accountType: meta.accountType,
      },
      create: {
        name: group,
        accountClass: meta.accountClass,
        financialStatement: meta.financialStatement,
        accountType: meta.accountType,
      },
    });
    categoryIdByGroup.set(group, cat.id);
  }

  // ── 3. Create leaf accounts (ExpenseName) with real codes ─────────────────────
  let created = 0;
  for (const a of CHART_OF_ACCOUNTS) {
    const expenseCategoryId = categoryIdByGroup.get(a.group)!;
    await prisma.expenseName.upsert({
      where: { name_expenseCategoryId: { name: a.accountName, expenseCategoryId } },
      update: {
        code: a.code,
        accountClass: a.accountClass,
        accountType: a.accountType,
        normalBalance: a.normalBalance,
        financialStatement: a.financialStatement,
      },
      create: {
        name: a.accountName,
        expenseCategoryId,
        code: a.code,
        accountClass: a.accountClass,
        accountType: a.accountType,
        normalBalance: a.normalBalance,
        financialStatement: a.financialStatement,
      },
    });
    created++;
  }

  // ── 4. Seed Cash & Bank payment accounts (used by Expense "Paid From") ────────
  const bankAccounts = [
    { name: "Zenith Bank — Operations Account", type: "BANK" },
    { name: "Moniepoint Account — Revenue Account", type: "BANK" },
    { name: "Petty Cash", type: "CASH" },
  ];
  for (const acc of bankAccounts) {
    const existing = await prisma.paymentAccount.findFirst({ where: { name: acc.name } });
    if (!existing) {
      await prisma.paymentAccount.create({
        data: { name: acc.name, type: acc.type, isActive: true },
      });
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  const byClass = new Map<number, number>();
  for (const a of CHART_OF_ACCOUNTS)
    byClass.set(a.accountClass, (byClass.get(a.accountClass) ?? 0) + 1);

  console.log(`Chart of Accounts seeded: ${groups.size} categories, ${created} accounts.`);
  for (const [cls, n] of [...byClass].sort((x, y) => x[0] - y[0])) {
    console.log(`  Class ${cls} (${CLASS_LABELS[cls]}): ${n} accounts`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
