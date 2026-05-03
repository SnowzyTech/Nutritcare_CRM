import { getOutgoingMovements } from "@/modules/inventory/services/inventory.service";
import { OutgoingClient } from "./outgoing-client";

export default async function OutgoingStockPage() {
  const rows = await getOutgoingMovements();
  return <OutgoingClient initialRows={rows} />;
}
