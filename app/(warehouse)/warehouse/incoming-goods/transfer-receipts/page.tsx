import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { getInTransitTransfersForWarehouse } from "@/modules/warehouse/services/warehouse.service";
import TransferReceiptsClient from "./client";

export const metadata: Metadata = { title: "Receive Stock Transfers" };

export default async function TransferReceiptsPage() {
  const session = await auth();
  const warehouseId = session?.user?.warehouseId ?? null;

  const transfers = warehouseId ? await getInTransitTransfersForWarehouse(warehouseId) : [];

  return (
    <div className="h-full flex flex-col">
      <TransferReceiptsClient transfers={transfers} hasWarehouse={!!warehouseId} />
    </div>
  );
}
