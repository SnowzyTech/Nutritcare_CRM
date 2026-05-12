import {
  getWarehousesForDropdown,
  getSuppliersForDropdown,
  getProductsForDropdown,
} from "@/modules/inventory/services/inventory.service";
import IncomingCreateClient from "./incoming-create-client";

export default async function CreateIncomingPage() {
  const [warehouses, suppliers, products] = await Promise.all([
    getWarehousesForDropdown(),
    getSuppliersForDropdown(),
    getProductsForDropdown(),
  ]);

  return (
    <IncomingCreateClient
      warehouses={warehouses}
      suppliers={suppliers}
      products={products}
    />
  );
}
