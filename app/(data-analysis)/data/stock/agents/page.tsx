import type { Metadata } from "next";
import { getAgentsWithStock } from "@/modules/data-analysis/services/stock-analysis.service";
import {
  StockBalanceExplorer,
  type BalanceNode,
} from "../../_components/stock/StockBalanceExplorer";

export const metadata: Metadata = { title: "Stock Left with Agent" };

export default async function StockLeftWithAgentPage() {
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
      title="Stock Left with Agent"
      subtitle="Current stock balance still held by each delivery agent"
      metaLabel="State"
      emptyMessage="No agent is currently holding stock."
    />
  );
}
