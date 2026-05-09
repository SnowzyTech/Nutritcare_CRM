import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { getIncomingGoodsForWarehouse } from "@/modules/warehouse/services/warehouse.service";
import IncomingGoodsClient from "./client";

export const metadata: Metadata = { title: "Incoming Goods" };

export default async function IncomingGoodsPage() {
  const session = await auth();
  const warehouseId = session?.user?.warehouseId ?? null;

  const goods = warehouseId ? await getIncomingGoodsForWarehouse(warehouseId) : [];

  return (
    <div className="h-full flex flex-col">
      <IncomingGoodsClient goods={goods} hasWarehouse={!!warehouseId} />
    </div>
  );
}
