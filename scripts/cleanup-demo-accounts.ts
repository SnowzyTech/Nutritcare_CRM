/**
 * scripts/cleanup-demo-accounts.ts — remove demo PaymentAccounts.
 * A demo account = its openingBalance is back-dated (openingBalanceAsOf before the
 * 24-Aug go-live). Deletes only accounts with ZERO referencing expenses (else skips
 * and warns). Dry-run by default; writes only with --confirm + CLEANUP_ACK.
 *   node --env-file=.env --import tsx scripts/cleanup-demo-accounts.ts            # check
 *   CLEANUP_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/cleanup-demo-accounts.ts --confirm
 */
import { prisma } from "@/lib/db/prisma";
import { withoutCameraAudit } from "@/lib/audit/context";

const CUTOFF = new Date("2026-08-23T23:00:00.000Z");
const CONFIRM = process.argv.includes("--confirm");
const ACK = process.env.CLEANUP_ACK === "I_UNDERSTAND";
const naira = (n: number) => "₦" + n.toLocaleString();

async function main() {
  const accounts = await prisma.paymentAccount.findMany({
    select: { id: true, name: true, type: true, openingBalance: true, openingBalanceAsOf: true, createdAt: true, updatedAt: true },
    orderBy: { name: "asc" },
  });
  console.log(`PAYMENT ACCOUNTS (total ${accounts.length}):`);
  const toDelete: { id: string; name: string }[] = [];
  const blocked: { name: string; refs: number }[] = [];

  for (const a of accounts) {
    const refs = await prisma.expense.count({ where: { paidFromAccountId: a.id } });
    const backDated = a.openingBalanceAsOf != null && a.openingBalanceAsOf < CUTOFF;
    const isDemo = backDated && Number(a.openingBalance) !== 0;
    console.log(
      `  ${a.name}\n    created=${a.createdAt.toISOString().slice(0, 10)} updated=${a.updatedAt.toISOString().slice(0, 10)} ` +
        `opening=${naira(Number(a.openingBalance))} asOf=${a.openingBalanceAsOf ? a.openingBalanceAsOf.toISOString().slice(0, 10) : "(none)"} ` +
        `expenseRefs=${refs} → ${isDemo ? (refs === 0 ? "DEMO, will delete" : "DEMO but has refs — SKIP") : "keep"}`
    );
    if (isDemo && refs === 0) toDelete.push({ id: a.id, name: a.name });
    else if (isDemo && refs > 0) blocked.push({ name: a.name, refs });
  }
  console.log(`\n→ ${toDelete.length} demo account(s) to delete${blocked.length ? `, ${blocked.length} blocked by references` : ""}`);
  console.log("═".repeat(70));

  if (!(CONFIRM && ACK)) {
    console.log("DRY RUN — no changes were made.");
    return;
  }
  console.log("EXECUTING…");
  await withoutCameraAudit(async () => {
    const del = await prisma.paymentAccount.deleteMany({ where: { id: { in: toDelete.map((a) => a.id) } } });
    console.log(`  payment accounts deleted=${del.count}`);
  });
  const left = await prisma.paymentAccount.count();
  console.log(`VERIFY: ${left} payment account(s) remain.`);
  console.log("Done.");
}

main().catch((e) => { console.error("Failed:", e); process.exit(1); }).finally(() => prisma.$disconnect());
