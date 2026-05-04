import { getIncomingMovements } from "@/modules/inventory/services/inventory.service";
import { IncomingClient } from "./incoming-client";

export default async function IncomingStockPage() {
  const rows = await getIncomingMovements();
  return <IncomingClient initialRows={rows} />;
}
