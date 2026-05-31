"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  itemId: z.string().min(1),
  sourceType: z.enum(["stockOut", "stockTransfer"]),
  finalStatus: z.enum(["DELIVERED", "FAILED"]),
});

export async function updateDeliveryStatusAction(
  itemId: string,
  sourceType: "stockOut" | "stockTransfer",
  finalStatus: "DELIVERED" | "FAILED"
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const parsed = schema.safeParse({ itemId, sourceType, finalStatus });
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  if (sourceType === "stockOut") {
    const movement = await prisma.stockMovement.findUnique({
      where: { id: itemId },
      select: { id: true, status: true, type: true },
    });
    if (!movement) return { success: false, error: "Stock movement not found" };
    if (movement.status !== "QC_CHECK")
      return { success: false, error: "Delivery is not in transit" };

    await prisma.stockMovement.update({
      where: { id: itemId },
      data: { status: finalStatus === "DELIVERED" ? "RECEIVED" : "NOT_RECEIVED" },
    });
  } else {
    if (finalStatus === "DELIVERED") {
      return { success: false, error: "Stock transfers are completed by the receiving warehouse when they shelve the goods" };
    }
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: itemId },
      select: { id: true, status: true },
    });
    if (!transfer) return { success: false, error: "Stock transfer not found" };
    if (transfer.status !== "IN_TRANSIT")
      return { success: false, error: "Delivery is not in transit" };

    await prisma.stockTransfer.update({
      where: { id: itemId },
      data: { status: "FAILED" },
    });
  }

  revalidatePath("/logistics/deliveries");
  return { success: true };
}
