import { Suspense } from "react";
import { ReportsClient } from "../_components/ReportsClient";
import {
  getProfitAndLoss,
  getTrialBalance,
  getBalanceSheet,
  getCashFlow,
  getRevenueByProduct,
  getInventoryValuation,
  getExpenseLedgerReport,
  getDeliveryTrackerReport,
  monthRange,
  previousMonthRange,
} from "@/modules/finance/services/reports-accounting.service";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

function parseDate(input: string | string[] | undefined, fallback: Date): Date {
  if (typeof input !== "string") return fallback;
  const d = new Date(input);
  return isNaN(d.getTime()) ? fallback : d;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const initialTab = typeof searchParams.tab === "string" ? searchParams.tab : undefined;

  const now = new Date();
  const currentAnchor = parseDate(searchParams.current, now);
  const priorAnchor = parseDate(searchParams.prior, previousMonthRange(currentAnchor).from);

  const currentPeriod = monthRange(currentAnchor);
  const priorPeriod = monthRange(priorAnchor);

  const tab = (initialTab ?? "profit-loss").toLowerCase();

  let reportData: any = null;

  switch (tab) {
    case "profit-loss":
      reportData = await getProfitAndLoss({ current: currentPeriod, prior: priorPeriod });
      break;
    case "statement-of-financial-position":
      reportData = await getBalanceSheet({
        currentAsOf: currentPeriod.to,
        priorAsOf: priorPeriod.to,
      });
      break;
    case "statement-of-cash-flow":
      reportData = await getCashFlow({ current: currentPeriod, prior: priorPeriod });
      break;
    case "revenue-by-product":
      reportData = await getRevenueByProduct(currentPeriod);
      break;
    case "inventory-valuation":
      reportData = await getInventoryValuation(currentPeriod);
      break;
    case "expense-ledger":
      reportData = await getExpenseLedgerReport(currentPeriod);
      break;
    case "delivery-tracker":
      reportData = await getDeliveryTrackerReport(currentPeriod);
      break;
    case "trial-balance":
      reportData = await getTrialBalance(currentPeriod);
      break;
    default:
      reportData = await getProfitAndLoss({ current: currentPeriod, prior: priorPeriod });
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportsClient
        initialTab={initialTab}
        reportData={reportData}
        currentDate={currentAnchor.toISOString()}
        priorDate={priorAnchor.toISOString()}
      />
    </Suspense>
  );
}
