import { InventoryClient } from "../_components/InventoryClient";
import {
  getInventoryProductList,
  getInventoryLocationView,
  getInventoryProductBreakdown,
} from "@/modules/finance/services/inventory-accounting.service";

export default async function InventoryPage() {
  const [productList, locationView, productBreakdown] = await Promise.all([
    getInventoryProductList(),
    getInventoryLocationView(),
    getInventoryProductBreakdown(),
  ]);
  return <InventoryClient productList={productList} locationView={locationView} productBreakdown={productBreakdown} />;
}
