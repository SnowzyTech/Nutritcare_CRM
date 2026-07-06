import { DashboardClient } from "./_components/DashboardClient";
import { auth } from "@/lib/auth/auth";
import {
  getFinancialSummary,
  getSalesTrends,
  getSalesByProduct,
  getSalesByState,
  getInventorySnapshot,
  getAgentSettlementSummary,
} from "@/modules/finance/services/dashboard.service";

export default async function AccountingDashboardPage() {
  // Activity charts default to the current month so they don't render all-time
  // totals; the client can refetch other periods (week / specific month).
  const now = new Date();
  const monthRange = {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };

  const [session, summary, salesTrends, salesByProduct, salesByState, inventory, settlementSummary] = await Promise.all([
    auth(),
    getFinancialSummary(),
    getSalesTrends(),
    getSalesByProduct(monthRange),
    getSalesByState(monthRange),
    getInventorySnapshot(),
    // Agent Settlement is always all-time (outstanding balances don't split
    // meaningfully by period), so it's not passed a date range.
    getAgentSettlementSummary(),
  ]);

  return (
    <DashboardClient
      summary={summary}
      salesTrends={salesTrends}
      salesByProductData={salesByProduct}
      salesByStateData={salesByState}
      inventory={inventory}
      settlementSummary={settlementSummary}
      userName={session?.user?.name ?? undefined}
    />
  );
}
