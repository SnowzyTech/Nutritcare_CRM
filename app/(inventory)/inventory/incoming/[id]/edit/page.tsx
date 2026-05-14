import { notFound } from "next/navigation";
import {
  getIncomingMovementForEdit,
  getWarehousesForDropdown,
  getSuppliersForDropdown,
  getProductsForDropdown,
} from "@/modules/inventory/services/inventory.service";
import IncomingEditClient from "./incoming-edit-client";

export default async function EditIncomingPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const [movement, warehouses, suppliers, products] = await Promise.all([
    getIncomingMovementForEdit(id),
    getWarehousesForDropdown(),
    getSuppliersForDropdown(),
    getProductsForDropdown(),
  ]);

  if (!movement) {
    notFound();
  }

  return (
    <IncomingEditClient
      movement={movement}
      warehouses={warehouses}
      suppliers={suppliers}
      products={products}
    />
  );
}
