import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import {
  getAgentsForReturnForm,
  getWarehouseLocations,
} from "@/modules/warehouse/services/warehouse.service";
import AddReturnClient from "./client";

export const metadata: Metadata = { title: "Add Return" };

export default async function AddReturnPage() {
  const session = await auth();
  const warehouseId = session?.user?.warehouseId as string | null | undefined;
  if (!warehouseId) redirect("/warehouse");

  const [agents, locations] = await Promise.all([
    getAgentsForReturnForm(),
    getWarehouseLocations(warehouseId),
  ]);

  return <AddReturnClient agents={agents} locations={locations} />;
}
