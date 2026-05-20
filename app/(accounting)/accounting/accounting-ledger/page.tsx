import { Suspense } from "react";
import { AccountingLedgerClient } from "../_components/AccountingLedgerClient";
import {
  getChartOfAccounts,
  listJournalEntries,
  getNextJournalNo,
  getGeneralLedger,
} from "@/modules/finance/services/ledger.service";

export default async function AccountingLedgerPage() {
  const [chartOfAccounts, rawJournals, nextJournalNo, generalLedger] =
    await Promise.all([
      getChartOfAccounts(),
      listJournalEntries(),
      getNextJournalNo(),
      getGeneralLedger(),
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
      />
    </Suspense>
  );
}
