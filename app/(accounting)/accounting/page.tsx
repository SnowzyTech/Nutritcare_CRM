import { DashboardClient } from "./_components/DashboardClient";
import {
  getFinancialSummary,
  getSalesByMonth,
  getSalesByProduct,
  getSalesByState,
  getInventorySnapshot,
  getAgentSettlementSummary,
} from "@/modules/finance/services/dashboard.service";

export default async function AccountingDashboardPage() {
  const [summary, salesByMonth, salesByProduct, salesByState, inventory, settlementSummary] = await Promise.all([
    getFinancialSummary(),
    getSalesByMonth(),
    getSalesByProduct(),
    getSalesByState(),
    getInventorySnapshot(),
    getAgentSettlementSummary(),
  ]);

  return (
    <DashboardClient
      summary={summary}
      salesByMonth={salesByMonth}
      salesByProductData={salesByProduct}
      salesByStateData={salesByState}
      inventory={inventory}
      settlementSummary={settlementSummary}
    />
  );
}
