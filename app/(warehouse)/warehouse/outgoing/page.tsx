import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { getOutgoingMovementsForWarehouse } from "@/modules/warehouse/services/warehouse.service";
import OutgoingClient from "./client";

export const metadata: Metadata = { title: "Outgoing" };

export default async function OutgoingPage() {
  const session = await auth();
  const warehouseId = session?.user?.warehouseId ?? null;

  const items = warehouseId ? await getOutgoingMovementsForWarehouse(warehouseId) : [];

  return (
    <div className="h-full flex flex-col">
      <OutgoingClient items={items} hasWarehouse={!!warehouseId} />
    </div>
  );
}
