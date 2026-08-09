import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { getWarehouseStockSnapshot } from "@/modules/warehouse/services/warehouse.service";
import StockSnapshotClient from "./client";

export const metadata: Metadata = { title: "Stock Snapshot" };

export default async function StockSnapshotPage() {
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

  const snapshot = await getWarehouseStockSnapshot(warehouseId);

  return <StockSnapshotClient snapshot={snapshot} />;
}
