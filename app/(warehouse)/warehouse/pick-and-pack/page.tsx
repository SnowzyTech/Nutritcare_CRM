import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import {
  getPickPackOrders,
  getAvailablePickers,
  getWarehouseLocations,
} from "@/modules/warehouse/services/warehouse.service";
import PickAndPackClient from "./client";

export const metadata: Metadata = { title: "Pick & Pack" };

export default async function PickAndPackPage() {
  const session = await auth();
  const warehouseId = session?.user?.warehouseId ?? null;

  const [orders, pickers, locationCodes] = await Promise.all([
    getPickPackOrders(),
    getAvailablePickers(),
    warehouseId
      ? getWarehouseLocations(warehouseId).then((locs) => locs.map((l) => l.locationCode))
      : Promise.resolve([] as string[]),
  ]);

  return <PickAndPackClient initialOrders={orders} pickers={pickers} locationCodes={locationCodes} />;
}
