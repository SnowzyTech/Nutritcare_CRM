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

export async function addWarehouseZoneAction(
  zone: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { warehouseId } = await requireWarehouseManager();

    const existing = await prisma.warehouseLocation.findFirst({ where: { warehouseId, zone } });
    if (existing) return { success: false, error: `Zone ${zone} already exists` };

    await prisma.warehouseLocation.createMany({
      data: ["1", "2", "3", "4", "5", "6"].map((col) => ({
        warehouseId,
        locationCode: `${zone}${col}`,
        zone,
        occupancyStatus: "EMPTY" as const,
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

export async function updateLocationOccupancyAction(
  locationCode: string,
  status: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { warehouseId } = await requireWarehouseManager();

    await prisma.warehouseLocation.updateMany({
      where: { warehouseId, locationCode },
      data: { occupancyStatus: status as "FULL" | "PARTIAL" | "RESERVED" | "EMPTY" | "DAMAGE" },
    });

    revalidatePath("/warehouse/location-management");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
