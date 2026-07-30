import type { Metadata } from "next";
import { getWarehousesWithStock } from "@/modules/data-analysis/services/stock-analysis.service";
import {
  StockBalanceExplorer,
  type BalanceNode,
} from "../../_components/stock/StockBalanceExplorer";

export const metadata: Metadata = { title: "Stock in Warehouse" };

export default async function StockInWarehousePage() {
  const warehouses = await getWarehousesWithStock();

  const nodes: BalanceNode[] = warehouses.map((w) => ({
    id: w.id,
    name: w.name,
    meta: w.managerName,
    totalProducts: w.totalProducts,
    totalQty: w.totalQty,
    items: w.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      qty: i.qtyLeft,
    })),
  }));

  return (
    <StockBalanceExplorer
      nodes={nodes}
      kind="warehouse"
      title="Stock in Warehouse"
      subtitle="Current stock balance held at each warehouse"
      metaLabel="Manager"
      emptyMessage="No warehouse is currently holding stock."
    />
  );
}
