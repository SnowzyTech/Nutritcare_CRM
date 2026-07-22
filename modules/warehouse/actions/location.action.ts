"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

async function requireWarehouseManager() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!session.user.warehouseId) throw new Error("No warehouse assigned to your account");
  return { userId: session.user.id, warehouseId: session.user.warehouseId };
}

export interface ZoneThresholds {
  fullThreshold: number;
  partialThreshold: number;
  emptyThreshold: number;
}

export async function addWarehouseZoneAction(
  zone: string,
  thresholds?: ZoneThresholds,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { warehouseId } = await requireWarehouseManager();

    const existing = await prisma.warehouseLocation.findFirst({ where: { warehouseId, zone } });
    if (existing) return { success: false, error: `Zone ${zone} already exists` };

    // Validate thresholds (when provided) so they stay internally consistent:
    // empty < partial < full, all non-negative.
    let full: number | null = null;
    let partial: number | null = null;
    let empty: number | null = null;
    if (thresholds) {
      const { fullThreshold, partialThreshold, emptyThreshold } = thresholds;
      const values = [fullThreshold, partialThreshold, emptyThreshold];
      if (values.some((v) => !Number.isFinite(v) || v < 0)) {
        return { success: false, error: "Stock amounts must be non-negative numbers." };
      }
      if (!(emptyThreshold < partialThreshold && partialThreshold < fullThreshold)) {
        return {
          success: false,
          error: "Stock amounts must increase: Empty < Partial < Full.",
        };
      }
      full = fullThreshold;
      partial = partialThreshold;
      empty = emptyThreshold;
    }

    await prisma.warehouseLocation.createMany({
      data: ["1", "2", "3", "4", "5", "6"].map((col) => ({
        warehouseId,
        locationCode: `${zone}${col}`,
        zone,
        // New shelves start with no stock, so they begin EMPTY; the thresholds
        // drive automatic Full/Partial/Empty colouring as stock changes.
        occupancyStatus: "EMPTY" as const,
        fullThreshold: full,
        partialThreshold: partial,
        emptyThreshold: empty,
      })),
    });

    revalidatePath("/warehouse/location-management");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function removeWarehouseZoneAction(
  zone: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { warehouseId } = await requireWarehouseManager();

    await prisma.warehouseLocation.deleteMany({ where: { warehouseId, zone } });

    revalidatePath("/warehouse/location-management");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// Manual overrides are limited to RESERVED and DAMAGE — FULL/PARTIAL/EMPTY are
// always derived from stock vs. threshold (see deriveOccupancyStatus) and must
// never be set by hand. "AUTO" clears an override by writing the neutral EMPTY
// placeholder, which deriveOccupancyStatus then recomputes from live stock.
export async function updateLocationOccupancyAction(
  locationCode: string,
  status: "RESERVED" | "DAMAGE" | "AUTO",
): Promise<{ success: boolean; error?: string }> {
  try {
    const { warehouseId } = await requireWarehouseManager();

    if (!["RESERVED", "DAMAGE", "AUTO"].includes(status)) {
      return { success: false, error: "A location can only be manually set to Reserved or Damage." };
    }

    await prisma.warehouseLocation.updateMany({
      where: { warehouseId, locationCode },
      data: { occupancyStatus: status === "AUTO" ? "EMPTY" : status },
    });

    revalidatePath("/warehouse/location-management");
    revalidatePath("/warehouse");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
