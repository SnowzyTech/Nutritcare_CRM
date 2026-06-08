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
  const [session, summary, salesTrends, salesByProduct, salesByState, inventory, settlementSummary] = await Promise.all([
    auth(),
    getFinancialSummary(),
    getSalesTrends(),
    getSalesByProduct(),
    getSalesByState(),
    getInventorySnapshot(),
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
