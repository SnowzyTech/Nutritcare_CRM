"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

// Called when the warehouse manager assigns a picker to one or more QUEUED PickPack records.
// PickPack records are created by the logistics dispatch action when a stockOut is dispatched.
export async function assignPickerAction(
  pickPackIds: string[],
  pickerId: string,
  locationCode: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    if (!pickPackIds.length) return { success: false, error: "No items selected" };
    if (!pickerId) return { success: false, error: "No picker selected" };

    const now = new Date();
    await prisma.pickPack.updateMany({
      where: { id: { in: pickPackIds }, status: "QUEUED" },
      data: {
        pickerId,
        locationCode,
        status: "PACKED",
        assignedAt: now,
        completedAt: now,
      },
    });

    revalidatePath("/warehouse/pick-and-pack");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
