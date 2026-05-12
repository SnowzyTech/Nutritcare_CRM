import {
  getWarehousesForDropdown,
  getProductsForDropdown,
} from "@/modules/inventory/services/inventory.service";
import AdjustmentCreateClient from "./adjustment-create-client";

export default async function CreateAdjustmentPage() {
  const [warehouses, products] = await Promise.all([
    getWarehousesForDropdown(),
    getProductsForDropdown(),
  ]);

  return <AdjustmentCreateClient warehouses={warehouses} products={products} />;
}
