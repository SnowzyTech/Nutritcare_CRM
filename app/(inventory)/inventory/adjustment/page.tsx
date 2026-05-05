import { getAdjustments } from "@/modules/inventory/services/inventory.service";
import { AdjustmentClient } from "./adjustment-client";

export default async function StockAdjustmentPage() {
  const rows = await getAdjustments();
  return <AdjustmentClient initialRows={rows} />;
}
