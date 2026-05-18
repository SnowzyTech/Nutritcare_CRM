"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

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

    const queuedPacks = await prisma.pickPack.findMany({
      where: { id: { in: pickPackIds }, status: "QUEUED" },
      select: {
        id: true,
        stockMovement: {
          select: {
            items: { select: { productId: true, quantity: true } },
          },
        },
        stockTransfer: {
          select: {
            id: true,
            sourceType: true,
            sourceId: true,
            targetType: true,
            targetId: true,
            items: { select: { productId: true, quantity: true } },
          },
        },
      },
    });

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.pickPack.updateMany({
        where: { id: { in: pickPackIds }, status: "QUEUED" },
        data: { pickerId, locationCode, status: "PACKED", assignedAt: now, completedAt: now },
      });

      for (const pp of queuedPacks) {
        // Warehouse→Agent OUTGOING: deduct product quantities at PACKED time
        if (pp.stockMovement) {
          for (const item of pp.stockMovement.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { decrement: item.quantity } },
            });
          }
        }

        if (pp.stockTransfer) {
          const { id: transferId, sourceType, sourceId, targetType, targetId, items } = pp.stockTransfer;
          const totalQty = items.reduce((s, i) => s + i.quantity, 0);

          if (targetType === "AGENT") {
            // Stock leaves the system to an agent — decrement product quantities
            for (const item of items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { quantity: { decrement: item.quantity } },
              });
            }
          }

          if (sourceType === "WAREHOUSE") {
            // Deduct from source warehouse bin(s), highest-stock bin first
            const sourceLocs = await tx.warehouseLocation.findMany({
              where: { warehouseId: sourceId },
              orderBy: { currentStock: "desc" },
            });
            let remaining = totalQty;
            for (const loc of sourceLocs) {
              if (remaining <= 0) break;
              const deduct = Math.min(loc.currentStock, remaining);
              if (deduct > 0) {
                await tx.warehouseLocation.update({
                  where: { id: loc.id },
                  data: { currentStock: { decrement: deduct } },
                });
                remaining -= deduct;
              }
            }
          }

          if (targetType === "WAREHOUSE") {
            // Credit to target warehouse — find or use the first bin
            const targetLoc = await tx.warehouseLocation.findFirst({
              where: { warehouseId: targetId },
              orderBy: { currentStock: "desc" },
            });
            if (targetLoc) {
              await tx.warehouseLocation.update({
                where: { id: targetLoc.id },
                data: { currentStock: { increment: totalQty } },
              });
            }
          }

          await tx.stockTransfer.update({
            where: { id: transferId },
            data: { status: "COMPLETED" },
          });
        }
      }
    });

    revalidatePath("/warehouse/pick-and-pack");
    revalidatePath("/logistics/deliveries");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
