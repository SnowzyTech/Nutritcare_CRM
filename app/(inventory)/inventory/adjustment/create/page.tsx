import {
  getWarehousesForDropdown,
  getProductsForDropdown,
  getProductStockMap,
} from "@/modules/inventory/services/inventory.service";
import AdjustmentCreateClient from "./adjustment-create-client";

export default async function CreateAdjustmentPage() {
  const [warehouses, products, productStockMap] = await Promise.all([
    getWarehousesForDropdown(),
    getProductsForDropdown(),
    getProductStockMap(),
  ]);

  return (
    <AdjustmentCreateClient
      warehouses={warehouses}
      products={products}
      productStockMap={productStockMap}
    />
  );
}
