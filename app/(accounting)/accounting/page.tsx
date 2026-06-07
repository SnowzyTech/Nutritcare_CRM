import { DashboardClient } from "./_components/DashboardClient";
import {
  getFinancialSummary,
  getSalesTrends,
  getSalesByProduct,
  getSalesByState,
  getInventorySnapshot,
  getAgentSettlementSummary,
} from "@/modules/finance/services/dashboard.service";

export default async function AccountingDashboardPage() {
  const [summary, salesTrends, salesByProduct, salesByState, inventory, settlementSummary] = await Promise.all([
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
    />
  );
}
