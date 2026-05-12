import {
  getAgentsForDropdown,
  getProductsForDropdown,
} from "@/modules/inventory/services/inventory.service";
import OutgoingCreateClient from "./outgoing-create-client";

export default async function CreateOutgoingPage() {
  const [agents, products] = await Promise.all([
    getAgentsForDropdown(),
    getProductsForDropdown(),
  ]);

  return <OutgoingCreateClient agents={agents} products={products} />;
}
