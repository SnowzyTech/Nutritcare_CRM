import {
  getAgentsForDropdown,
  getProductsForDropdown,
  getWarehousesForDropdown,
  getWarehouseProductStockMap,
  getAgentProductStockMap,
} from "@/modules/inventory/services/inventory.service";
import OutgoingCreateClient from "./outgoing-create-client";

export default async function CreateOutgoingPage() {
  const [agents, products, warehouses, warehouseProductStock, agentProductStock] = await Promise.all([
    getAgentsForDropdown(),
    getProductsForDropdown(),
    getWarehousesForDropdown(),
    getWarehouseProductStockMap(),
    getAgentProductStockMap(),
  ]);

  return (
    <OutgoingCreateClient
      agents={agents}
      products={products}
      warehouses={warehouses}
      warehouseProductStock={warehouseProductStock}
      agentProductStock={agentProductStock}
    />
  );
}
