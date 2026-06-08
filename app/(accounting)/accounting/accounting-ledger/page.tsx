import { Suspense } from "react";
import { AccountingLedgerClient } from "../_components/AccountingLedgerClient";
import {
  getChartOfAccounts,
  listJournalEntries,
  getNextJournalNo,
  getGeneralLedger,
  listCategoriesForLedger,
} from "@/modules/finance/services/ledger.service";
import { listFixedAssets } from "@/modules/finance/services/fixed-assets.service";

export default async function AccountingLedgerPage() {
  const [chartOfAccounts, rawJournals, nextJournalNo, generalLedger, categories, fixedAssets] =
    await Promise.all([
      getChartOfAccounts(),
      listJournalEntries(),
      getNextJournalNo(),
      getGeneralLedger(),
      listCategoriesForLedger(),
      listFixedAssets(),
    ]);

  const savedJournals = rawJournals.map((j: any) => ({
    journalNo: j.journalNo as string,
    date: (j.date as Date).toISOString().slice(0, 10),
    rows: (j.rows as any[]).map((r) => ({
      account: r.account as string,
      debits: String(r.debits),
      credits: String(r.credits),
      description: (r.description as string | null) ?? "",
      name: (r.name as string | null) ?? "",
      tax: String(r.tax),
    })),
    totalDebits: `N${Number(j.totalDebit).toLocaleString("en-NG", { maximumFractionDigits: 0 })}.00`,
    totalCredits: `N${Number(j.totalCredit).toLocaleString("en-NG", { maximumFractionDigits: 0 })}.00`,
  }));

  return (
    <Suspense>
      <AccountingLedgerClient
        initialChartOfAccounts={chartOfAccounts}
        initialSavedJournals={savedJournals}
        initialNextJournalNo={nextJournalNo}
        initialGeneralLedger={generalLedger}
        initialCategories={categories}
        initialFixedAssets={fixedAssets}
      />
    </Suspense>
  );
}
