"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { suppressCameraForRequest } from "@/lib/audit/context";
import {
  creditWarehouse,
  isTransferSourceDebited,
} from "@/modules/inventory/services/stock-level.service";

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
  suppressCameraForRequest();

  const parsed = schema.safeParse({ itemId, sourceType, finalStatus });
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  let label = "";

  if (sourceType === "stockOut") {
    const movement = await prisma.stockMovement.findUnique({
      where: { id: itemId },
      select: { id: true, status: true, type: true, referenceNumber: true },
    });
    if (!movement) return { success: false, error: "Stock movement not found" };
    if (movement.status !== "QC_CHECK")
      return { success: false, error: "Delivery is not in transit" };

    await prisma.stockMovement.update({
      where: { id: itemId },
      data: { status: finalStatus === "DELIVERED" ? "RECEIVED" : "NOT_RECEIVED" },
    });

    await logActivity({
      userId: session.user.id,
      action: finalStatus === "DELIVERED" ? "Delivered" : "Failed",
      entityType: "StockMovement",
      entityId: itemId,
      description: `Marked stock-out voucher ${movement.referenceNumber} as ${finalStatus === "DELIVERED" ? "delivered" : "failed"}`,
    });
    label = `stock-out ${movement.referenceNumber}`;
  } else {
    if (finalStatus === "DELIVERED") {
      return { success: false, error: "Stock transfers are completed by the receiving warehouse when they shelve the goods" };
    }
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        status: true,
        referenceNumber: true,
        sourceType: true,
        sourceId: true,
        items: { select: { productId: true, quantity: true } },
      },
    });
    if (!transfer) return { success: false, error: "Stock transfer not found" };
    if (transfer.status !== "IN_TRANSIT")
      return { success: false, error: "Delivery is not in transit" };

    // If the source was already debited at packing time, the goods are in
    // flight and owned by nobody. Failing the delivery returns them to the
    // source warehouse — without this the units would simply vanish.
    const sourceDebited =
      transfer.sourceType === "WAREHOUSE" &&
      (await isTransferSourceDebited(prisma, itemId));

    try {
      await prisma.$transaction(async (tx) => {
        const flipped = await tx.stockTransfer.updateMany({
          where: { id: itemId, status: "IN_TRANSIT" },
          data: { status: "FAILED" },
        });
        if (flipped.count === 0) {
          throw new Error("Delivery is no longer in transit");
        }
        if (sourceDebited) {
          await creditWarehouse(tx, transfer.sourceId, transfer.items);
        }
      });
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }

    await logActivity({
      userId: session.user.id,
      action: "Failed",
      entityType: "StockTransfer",
      entityId: itemId,
      description: `Marked stock transfer ${transfer.referenceNumber} as failed${
        sourceDebited ? " — packed stock returned to the source warehouse" : ""
      }`,
    });
    label = `stock transfer ${transfer.referenceNumber}`;
  }

  await logActivity({
    userId: session.user.id,
    action: finalStatus === "DELIVERED" ? "Delivered" : "Failed",
    entityType: sourceType === "stockOut" ? "StockMovement" : "StockTransfer",
    entityId: itemId,
    description: `${label} marked ${finalStatus.toLowerCase()}`,
  });

  revalidatePath("/logistics/deliveries");
  return { success: true };
}
