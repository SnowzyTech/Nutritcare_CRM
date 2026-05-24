import {
  getWarehousesForDropdown,
  getProductsForDropdown,
  getWarehouseLocationsGrouped,
  getShelfProductStockMap,
} from "@/modules/inventory/services/inventory.service";
import AdjustmentCreateClient from "./adjustment-create-client";

export default async function CreateAdjustmentPage() {
  const [warehouses, products, warehouseLocationsMap, shelfStockMap] = await Promise.all([
    getWarehousesForDropdown(),
    getProductsForDropdown(),
    getWarehouseLocationsGrouped(),
    getShelfProductStockMap(),
  ]);

  return (
    <AdjustmentCreateClient
      warehouses={warehouses}
      products={products}
      warehouseLocationsMap={warehouseLocationsMap}
      shelfStockMap={shelfStockMap}
    />
  );
}
