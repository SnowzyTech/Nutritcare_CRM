import {
  getTransferNodesForDropdown,
  getProductsForDropdown,
} from "@/modules/inventory/services/inventory.service";
import TransferCreateClient from "./transfer-create-client";

export default async function CreateStockTransferPage() {
  const [nodes, products] = await Promise.all([
    getTransferNodesForDropdown(),
    getProductsForDropdown(),
  ]);

  return <TransferCreateClient nodes={nodes} products={products} />;
}
