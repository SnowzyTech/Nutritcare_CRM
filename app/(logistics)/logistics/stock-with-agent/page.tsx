import type { Metadata } from "next";
import { getAgentsWithStock } from "@/modules/inventory/services/inventory.service";
import {
  StockBalanceExplorer,
  type BalanceNode,
} from "@/components/stock/stock-balance-explorer";

export const metadata: Metadata = { title: "Stock with Agent" };

export default async function LogisticsStockWithAgentPage() {
  const agents = await getAgentsWithStock();

  const nodes: BalanceNode[] = agents.map((a) => ({
    id: a.id,
    name: a.name,
    meta: a.state,
    totalProducts: a.totalProducts,
    totalQty: a.totalQty,
    items: a.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      qty: i.qtyLeft,
    })),
  }));

  return (
    <StockBalanceExplorer
      nodes={nodes}
      kind="agent"
      title="Stock with Agent"
      subtitle="Current stock balance still held by each delivery agent"
      metaLabel="State"
      emptyMessage="No agent is currently holding stock."
      className="max-w-[1400px] mx-auto pb-16"
    />
  );
}
