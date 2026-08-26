/**
 * scripts/cleanup-demo-finance.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE-OFF PRODUCTION CLEANUP — remove build-phase DEMO finance data.
 *
 * The whole finance module was seeded with demo data during the build phase
 * (every row flagged "[DEMO]" in its notes/name, all dated before 24 Aug 2026),
 * which is why net-profit / balance-sheet / payroll show fake numbers. There is
 * no real finance data yet, so this is a clean sweep. Deletes:
 *   • Expenses flagged [DEMO]            (+ line items cascade)
 *   • SalaryRecords flagged [DEMO]
 *   • FixedAssets flagged [DEMO]
 *   • JournalEntries with [DEMO] rows    (+ rows cascade)
 *   • PurchaseOrders dated before cutoff (+ items cascade)
 *
 * Structural PaymentAccounts are KEPT — but any non-zero openingBalance is
 * reported so you can spot lingering demo cash.
 *
 * SAFE BY DEFAULT: no flags → READ-ONLY dry-run. Writes only when BOTH:
 *     --confirm                 (CLI flag)
 *     CLEANUP_ACK=I_UNDERSTAND  (env var)
 *
 * Usage:
 *   node --env-file=.env --import tsx scripts/cleanup-demo-finance.ts             # dry-run
 *   CLEANUP_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/cleanup-demo-finance.ts --confirm
 *
 * ⚠  BACK UP FIRST. The pre-cleanup-2026-08-26 Neon branch already covers this
 *    data (it predates all of today's deletions).
 */
import { prisma } from "@/lib/db/prisma";
import { withoutCameraAudit } from "@/lib/audit/context";

const CUTOFF = new Date("2026-08-23T23:00:00.000Z"); // 24 Aug 2026 00:00 WAT
const CONFIRM = process.argv.includes("--confirm");
const ACK = process.env.CLEANUP_ACK === "I_UNDERSTAND";
const CHUNK = 500;
const demo = { contains: "[DEMO]", mode: "insensitive" as const };

function chunk<T>(a: T[], n: number): T[][] {
  const o: T[][] = [];
  for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n));
  return o;
}
async function deleteOverChunks(ids: string[], fn: (c: string[]) => Promise<{ count: number }>): Promise<number> {
  let t = 0;
  for (const c of chunk(ids, CHUNK)) t += (await fn(c)).count;
  return t;
}
const naira = (n: number) => "₦" + n.toLocaleString();
function dbHost(): string {
  const raw = process.env.DATABASE_URL ?? "";
  try {
    return new URL(raw).host;
  } catch {
    return "unknown";
  }
}

async function main() {
  console.log("═".repeat(78));
  console.log("  NUCLE CRM — demo finance-data cleanup");
  console.log("═".repeat(78));
  console.log(`  Database host : ${dbHost()}`);
  console.log(`  Confirm flag  : ${CONFIRM}   Ack env: ${ACK}`);
  console.log("─".repeat(78));

  // ── Discover the demo finance rows ─────────────────────────────────────────
  const [expenses, salaries, assets, demoRows, pos] = await Promise.all([
    prisma.expense.findMany({ where: { notes: demo }, select: { id: true, amount: true } }),
    prisma.salaryRecord.findMany({ where: { OR: [{ remark: demo }, { name: demo }] }, select: { id: true, netPay: true } }),
    prisma.fixedAsset.findMany({ where: { OR: [{ assetName: demo }, { description: demo }] }, select: { id: true, purchasePrice: true } }),
    prisma.journalEntryRow.findMany({ where: { OR: [{ description: demo }, { name: demo }] }, select: { journalEntryId: true } }),
    prisma.purchaseOrder.findMany({ where: { date: { lt: CUTOFF } }, select: { id: true } }),
  ]);
  const expenseIds = expenses.map((e) => e.id);
  const salaryIds = salaries.map((s) => s.id);
  const assetIds = assets.map((a) => a.id);
  const journalIds = [...new Set(demoRows.map((r) => r.journalEntryId))];
  const poIds = pos.map((p) => p.id);

  const sum = (rows: { [k: string]: unknown }[], key: string) => rows.reduce((n, r) => n + Number(r[key]), 0);
  console.log("DEMO FINANCE DATA to remove:");
  console.log(`    Expenses (+line items)      ${expenseIds.length}   ${naira(sum(expenses, "amount"))}`);
  console.log(`    SalaryRecords               ${salaryIds.length}   ${naira(sum(salaries, "netPay"))} net`);
  console.log(`    FixedAssets                 ${assetIds.length}   ${naira(sum(assets, "purchasePrice"))} cost`);
  console.log(`    JournalEntries (+rows)      ${journalIds.length}`);
  console.log(`    PurchaseOrders (+items)     ${poIds.length}   (dated before 24 Aug)`);

  // ── Payment accounts (kept — reported for lingering demo cash) ──────────────
  const accounts = await prisma.paymentAccount.findMany({
    select: { name: true, type: true, openingBalance: true, isActive: true },
    orderBy: { name: "asc" },
  });
  console.log("PAYMENT ACCOUNTS (kept — check for demo opening balances):");
  for (const a of accounts) {
    const bal = Number(a.openingBalance);
    console.log(`    ${a.name.padEnd(28)} ${a.type.padEnd(10)} opening=${naira(bal)}${bal !== 0 ? "  ⚠ non-zero" : ""}`);
  }
  console.log("═".repeat(78));

  // ── Gate ───────────────────────────────────────────────────────────────────
  if (!(CONFIRM && ACK)) {
    console.log("DRY RUN — no changes were made.");
    console.log("  To execute: CLEANUP_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/cleanup-demo-finance.ts --confirm");
    return;
  }

  console.log("EXECUTING — writing changes…");
  await withoutCameraAudit(async () => {
    const delExp = await deleteOverChunks(expenseIds, (c) => prisma.expense.deleteMany({ where: { id: { in: c } } }));
    const delSal = await deleteOverChunks(salaryIds, (c) => prisma.salaryRecord.deleteMany({ where: { id: { in: c } } }));
    const delAsset = await deleteOverChunks(assetIds, (c) => prisma.fixedAsset.deleteMany({ where: { id: { in: c } } }));
    const delJournal = await deleteOverChunks(journalIds, (c) => prisma.journalEntry.deleteMany({ where: { id: { in: c } } }));
    const delPo = await deleteOverChunks(poIds, (c) => prisma.purchaseOrder.deleteMany({ where: { id: { in: c } } }));
    console.log(`  expenses=${delExp} salaries=${delSal} assets=${delAsset} journals=${delJournal} purchaseOrders=${delPo}`);
  });

  // ── Verify ─────────────────────────────────────────────────────────────────
  console.log("─".repeat(78));
  console.log("VERIFICATION:");
  const pass = (label: string, n: number) => console.log(`    ${n === 0 ? "PASS" : "FAIL"}  ${label} — ${n} left`);
  pass("demo expenses removed", await prisma.expense.count({ where: { notes: demo } }));
  pass("demo salaries removed", await prisma.salaryRecord.count({ where: { OR: [{ remark: demo }, { name: demo }] } }));
  pass("demo fixed assets removed", await prisma.fixedAsset.count({ where: { OR: [{ assetName: demo }, { description: demo }] } }));
  pass("demo journal rows removed", await prisma.journalEntryRow.count({ where: { OR: [{ description: demo }, { name: demo }] } }));
  pass("pre-cutoff purchase orders removed", await prisma.purchaseOrder.count({ where: { date: { lt: CUTOFF } } }));

  const revenue = await prisma.order.aggregate({ _sum: { netAmount: true }, where: { status: "DELIVERED", deletedAt: null } });
  const expLeft = await prisma.expense.aggregate({ _sum: { amount: true } });
  console.log(`  Net position now → revenue ${naira(Number(revenue._sum.netAmount ?? 0))} − expenses ${naira(Number(expLeft._sum.amount ?? 0))} = ${naira(Number(revenue._sum.netAmount ?? 0) - Number(expLeft._sum.amount ?? 0))}`);
  console.log("═".repeat(78));
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
