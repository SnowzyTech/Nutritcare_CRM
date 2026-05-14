import {
  getAgentsForDropdown,
  getProductsForDropdown,
  getWarehousesForDropdown,
  getAllWarehouseLocations,
} from "@/modules/inventory/services/inventory.service";
import OutgoingCreateClient from "./outgoing-create-client";

export default async function CreateOutgoingPage() {
  const [agents, products, warehouses, locations] = await Promise.all([
    getAgentsForDropdown(),
    getProductsForDropdown(),
    getWarehousesForDropdown(),
    getAllWarehouseLocations(),
  ]);

  return (
    <OutgoingCreateClient
      agents={agents}
      products={products}
      warehouses={warehouses}
      locations={locations}
    />
  );
}
