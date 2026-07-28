import { DashboardClient } from "./_components/DashboardClient";
import { auth } from "@/lib/auth/auth";
import { getAccountingAccess } from "@/lib/auth/accounting-access";
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

  const [session, access] = await Promise.all([auth(), getAccountingAccess()]);

  // Only fetch gated data the viewer is allowed to see (defense-in-depth: the
  // sections are also conditionally rendered in DashboardClient).
  const [summary, salesTrends, salesByProduct, salesByState, inventory, settlementSummary] =
    await Promise.all([
      access.FINANCIAL_SUMMARY ? getFinancialSummary() : Promise.resolve(undefined),
      access.SALES_ANALYTICS ? getSalesTrends() : Promise.resolve(undefined),
      access.SALES_ANALYTICS ? getSalesByProduct(monthRange) : Promise.resolve(undefined),
      access.SALES_ANALYTICS ? getSalesByState(monthRange) : Promise.resolve(undefined),
      access.INVENTORY_SNAPSHOT ? getInventorySnapshot() : Promise.resolve(undefined),
      // Agent Settlement is always all-time and always visible.
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
      access={access}
    />
  );
}
