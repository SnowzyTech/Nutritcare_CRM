import { Suspense } from "react";
import {
  getStockAgents,
  getStockSuppliers,
  getStockWarehouses,
  getStockProducts,
  getStockCategories,
} from "@/modules/inventory/services/inventory.service";
import { StockClient } from "./stock-client";

export default async function StockPage() {
  const [agents, suppliers, warehouses, products, categories] = await Promise.all([
    getStockAgents(),
    getStockSuppliers(),
    getStockWarehouses(),
    getStockProducts(),
    getStockCategories(),
  ]);

  return (
    <Suspense>
      <StockClient
        agents={agents}
        suppliers={suppliers}
        warehouses={warehouses}
        products={products}
        categories={categories}
      />
    </Suspense>
  );
}
