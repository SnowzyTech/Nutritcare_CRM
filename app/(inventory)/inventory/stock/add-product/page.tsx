import {
  getStockCategories,
  getProductsForDropdown,
} from "@/modules/inventory/services/inventory.service";
import { AddProductClient } from "./add-product-client";

export default async function AddProductPage() {
  const [categories, products] = await Promise.all([
    getStockCategories(),
    getProductsForDropdown(),
  ]);
  return <AddProductClient categories={categories} products={products} />;
}
