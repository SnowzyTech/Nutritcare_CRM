import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import {
  getWarehouseLocations,
  getLocationSummary,
  getLocationBinDetailMap,
} from "@/modules/warehouse/services/warehouse.service";
import LocationManagementClient from "./client";

export const metadata: Metadata = { title: "Location Management" };

export default async function LocationManagementPage() {
  const session = await auth();
  const warehouseId = session?.user?.warehouseId ?? null;

  if (!warehouseId) {
    return (
      <div className="mt-8 rounded-lg bg-amber-50 border border-amber-200 p-6 max-w-lg">
        <p className="text-amber-800 font-medium">No warehouse assigned to your account.</p>
        <p className="text-amber-700 text-sm mt-1">
          Contact your administrator to assign you to a warehouse.
        </p>
      </div>
    );
  }

  const [bins, summaryData, binDetails] = await Promise.all([
    getWarehouseLocations(warehouseId),
    getLocationSummary(warehouseId),
    getLocationBinDetailMap(warehouseId),
  ]);

  return (
    <LocationManagementClient
      initialBins={bins}
      summaryData={summaryData}
      binDetails={binDetails}
    />
  );
}
