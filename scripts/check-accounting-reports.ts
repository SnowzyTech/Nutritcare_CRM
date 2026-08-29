/**
 * Pre-session smoke check for the accounting reports.
 *
 * Runs every report service head-on for a given month pair and prints whether
 * each section actually resolves to data — so an empty section is caught before
 * the accountants are looking at the screen, not during the walkthrough.
 *
 * Run:  npx tsx scripts/check-accounting-reports.ts [current YYYY-MM] [prior YYYY-MM]
 * e.g.  npx tsx scripts/check-accounting-reports.ts 2026-08 2026-07
 */

import {
  getProfitAndLoss,
  getTrialBalance,
  getBalanceSheet,
  getCashFlow,
  getRevenueByProduct,
  getInventoryValuation,
  getExpenseLedgerReport,
  getDeliveryTrackerReport,
  type Period,
} from "@/modules/finance/services/reports-accounting.service";
import { getChartOfAccounts, getGeneralLedger, listJournalEntries } from "@/modules/finance/services/ledger.service";

const NGN = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

function monthPeriod(ym: string): Period {
  const [y, m] = ym.split("-").map(Number);
  return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0, 23, 59, 59, 999) };
}

function line(label: string, ok: boolean, detail: string) {
  console.log(`  ${ok ? "OK  " : "EMPTY"}  ${label.padEnd(34)} ${detail}`);
}

async function main() {
  const currentYm = process.argv[2] ?? "2026-08";
  const priorYm = process.argv[3] ?? "2026-07";
  const periods = { current: monthPeriod(currentYm), prior: monthPeriod(priorYm) };

  console.log(`\nAccounting report smoke check — current ${currentYm}, prior ${priorYm}\n`);

  // ── Chart of accounts / journal ────────────────────────────────────────────
  console.log("Chart of accounts & journal");
  const coa = await getChartOfAccounts();
  line("Chart of accounts", coa.length > 0, `${coa.length} accounts, ${new Set(coa.map(c => c.categoryName)).size} categories`);
  const journals = await listJournalEntries();
  line("Journal entries", journals.length > 0, `${journals.length} entries`);
  const unbalanced = (journals as { totalDebit: unknown; totalCredit: unknown }[]).filter(
    (j) => Number(j.totalDebit) !== Number(j.totalCredit),
  );
  line("  ↳ unbalanced entries", true, `${unbalanced.length} (expect 1 — seeded on purpose)`);
  const gl = await getGeneralLedger({});
  line("General ledger", gl.length > 0, `${gl.length} rows`);

  // ── Trial balance ──────────────────────────────────────────────────────────
  console.log("\nTrial Balance (journal-sourced only)");
  const tb = await getTrialBalance(periods.current);
  const tbDr = tb.reduce((s, r) => s + r.debit, 0);
  const tbCr = tb.reduce((s, r) => s + r.credit, 0);
  line("Rows", tb.length > 0, `${tb.length} accounts`);
  line("Dr / Cr", tb.length > 0, `${NGN(tbDr)} / ${NGN(tbCr)}  diff ${NGN(tbDr - tbCr)}`);

  // ── P&L ────────────────────────────────────────────────────────────────────
  console.log("\nProfit & Loss");
  const pl = await getProfitAndLoss(periods);
  line("Revenue lines", pl.revenue.length > 0, `${pl.revenue.length} products, current ${NGN(pl.totals.revenue.current)} / prior ${NGN(pl.totals.revenue.prior)}`);
  line("Cost of sales", pl.totals.cos.current > 0, `current ${NGN(pl.totals.cos.current)} / prior ${NGN(pl.totals.cos.prior)}`);
  line("Gross profit", true, `current ${NGN(pl.totals.grossProfit.current)} / prior ${NGN(pl.totals.grossProfit.prior)}`);
  line("Operating expenses", pl.operatingExpenses.length > 0, `${pl.operatingExpenses.length} groups, current ${NGN(pl.totals.opex.current)} / prior ${NGN(pl.totals.opex.prior)}`);
  line("Operating profit", true, `current ${NGN(pl.totals.operatingProfit.current)} / prior ${NGN(pl.totals.operatingProfit.prior)}`);

  // ── Balance sheet ──────────────────────────────────────────────────────────
  console.log("\nStatement of Financial Position");
  const bs = await getBalanceSheet(periods);
  line("Assets", bs.assets.length > 0, `${bs.assets.length} lines, total ${NGN(bs.totals.assets.current)}`);
  line("Liabilities", bs.liabilities.length > 0, `${bs.liabilities.length} lines, total ${NGN(bs.totals.liabilities.current)}`);
  line("Equity", bs.equity.length > 0, `${bs.equity.length} lines, total ${NGN(bs.totals.equity.current)}`);
  const plug = [...bs.assets, ...bs.liabilities, ...bs.equity].find((l) => /balanc/i.test(l.label));
  line("  ↳ balancing adjustment", true, plug ? `${plug.label} ${NGN(plug.current)}` : "none");
  const aMinusLE = bs.totals.assets.current - bs.totals.liabilities.current - bs.totals.equity.current;
  line("  ↳ A − (L + E)", Math.abs(aMinusLE) < 1, NGN(aMinusLE));
  for (const l of [...bs.assets, ...bs.liabilities, ...bs.equity]) {
    console.log(`         · ${l.label.padEnd(40)} ${NGN(l.current).padStart(16)}`);
  }

  // ── Cash flow ──────────────────────────────────────────────────────────────
  console.log("\nStatement of Cash Flow");
  const cf = await getCashFlow(periods);
  for (const s of cf.sections) {
    line(s.title, s.lines.length > 0, `${s.lines.length} lines, subtotal ${NGN(s.subtotal.current)}`);
  }
  line("Opening / closing cash", true, `${NGN(cf.openingCash.current)} → ${NGN(cf.closingCash.current)}`);
  line("Unexplained", true, NGN(cf.unexplained.current));

  // ── Operational reports ────────────────────────────────────────────────────
  console.log("\nOperational reports");
  const rbp = await getRevenueByProduct(periods.current);
  line("Revenue by product", rbp.length > 0, `${rbp.length} products, ads ${NGN(rbp.reduce((s, r) => s + (r.adsSpend ?? 0), 0))}`);
  const iv = await getInventoryValuation(periods.current);
  line("Inventory valuation", iv.length > 0, `${iv.length} products`);
  const el = await getExpenseLedgerReport(periods.current);
  line("Expense ledger", el.length > 0, `${el.length} expenses`);
  const dt = await getDeliveryTrackerReport(periods.current);
  line("Delivery tracker", dt.length > 0, `${dt.length} agents`);

  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
