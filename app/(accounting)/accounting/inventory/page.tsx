import { InventoryClient } from "../_components/InventoryClient";
import {
  getInventoryProductList,
  getInventoryLocationView,
} from "@/modules/finance/services/inventory-accounting.service";

export default async function InventoryPage() {
  const [productList, locationView] = await Promise.all([
    getInventoryProductList(),
    getInventoryLocationView(),
  ]);
  return <InventoryClient productList={productList} locationView={locationView} />;
}
