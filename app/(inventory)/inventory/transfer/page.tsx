import { getStockTransfers } from "@/modules/inventory/services/inventory.service";
import { TransferClient } from "./transfer-client";

export default async function StockTransferPage() {
  const rows = await getStockTransfers();
  return <TransferClient initialRows={rows} />;
}
