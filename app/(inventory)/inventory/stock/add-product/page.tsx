import { getStockCategories } from "@/modules/inventory/services/inventory.service";
import { AddProductClient } from "./add-product-client";

export default async function AddProductPage() {
  const categories = await getStockCategories();
  return <AddProductClient categories={categories} />;
}
