"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

type PickPackStatus = "QUEUED" | "PACKING" | "PACKED" | "DISPATCHED";

// Called when the warehouse manager assigns a picker to one or more IN_TRANSIT deliveries.
// Creates a PickPack record (QUEUED) for each delivery that doesn't have one yet.
export async function assignPickerAction(
  deliveryIds: string[],
  pickerId: string,
  locationCode: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    if (!deliveryIds.length) return { success: false, error: "No deliveries selected" };
    if (!pickerId) return { success: false, error: "No picker selected" };

    // Resolve orderId for each delivery
    const deliveries = await prisma.delivery.findMany({
      where: { id: { in: deliveryIds }, status: "IN_TRANSIT" },
      select: {
        orderId: true,
        order: {
          select: {
            _count: { select: { items: true } },
            pickPacks: { select: { id: true }, take: 1 },
          },
        },
      },
    });

    const now = new Date();

    for (const d of deliveries) {
      if (d.order.pickPacks.length > 0) {
        // Already has a PickPack — update it
        await prisma.pickPack.updateMany({
          where: { orderId: d.orderId },
          data: { pickerId, locationCode, status: "QUEUED", assignedAt: now },
        });
      } else {
        // Create a new PickPack record
        await prisma.pickPack.create({
          data: {
            orderId: d.orderId,
            pickerId,
            locationCode,
            itemsCount: d.order._count.items,
            status: "QUEUED",
            assignedAt: now,
          },
        });
      }
    }

    revalidatePath("/warehouse/pick-and-pack");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updatePickPackStatusAction(
  pickPackId: string,
  status: PickPackStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await prisma.pickPack.update({
      where: { id: pickPackId },
      data: {
        status,
        ...(status === "PACKED" || status === "DISPATCHED" ? { completedAt: new Date() } : {}),
      },
    });

    revalidatePath("/warehouse/pick-and-pack");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
