import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import {
  getRecordedIncomingVouchers,
  getWarehouseLocations,
} from "@/modules/warehouse/services/warehouse.service";
import { prisma } from "@/lib/db/prisma";
import AddIncomingGoodsClient from "./client";

export const metadata: Metadata = { title: "Confirm Incoming Goods" };

export default async function AddIncomingGoodsPage() {
  const session = await auth();
  const warehouseId = session?.user?.warehouseId ?? null;

  if (!warehouseId) redirect("/warehouse/incoming-goods");

  const [recordedVouchers, warehouse, locationRows] = await Promise.all([
    getRecordedIncomingVouchers(warehouseId),
    prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { id: true, name: true },
    }),
    getWarehouseLocations(warehouseId),
  ]);

  const shelfLocations = locationRows.map((l) => ({
    id: l.id,
    locationCode: l.locationCode,
    occupancyStatus: l.occupancyStatus,
    currentStock: l.currentStock,
    maxCapacity: l.maxCapacity,
  }));

  return (
    <AddIncomingGoodsClient
      recordedVouchers={recordedVouchers}
      warehouseName={warehouse?.name ?? "Your Warehouse"}
      shelfLocations={shelfLocations}
    />
  );
}
