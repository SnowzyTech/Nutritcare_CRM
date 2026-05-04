import { getReturnedMovements } from "@/modules/inventory/services/inventory.service";
import { ReturnedClient } from "./returned-client";

export default async function ReturnedStockPage() {
  const rows = await getReturnedMovements();
  return <ReturnedClient initialRows={rows} />;
}
