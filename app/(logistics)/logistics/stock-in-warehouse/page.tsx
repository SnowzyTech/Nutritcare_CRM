import type { Metadata } from "next";
import { getWarehousesWithStock } from "@/modules/inventory/services/inventory.service";
import {
  StockBalanceExplorer,
  type BalanceNode,
} from "@/components/stock/stock-balance-explorer";

export const metadata: Metadata = { title: "Stock in Warehouse" };

export default async function LogisticsStockInWarehousePage() {
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
      className="max-w-[1400px] mx-auto pb-16"
    />
  );
}
