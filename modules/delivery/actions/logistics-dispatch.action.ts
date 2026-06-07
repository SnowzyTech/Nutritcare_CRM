"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const dispatchSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  sourceType: z.enum(["order", "stockOut", "stockTransfer"]),
  driverAgentId: z.string().optional(),
});

export async function dispatchOrderAction(
  itemId: string,
  driverAgentId?: string,
  sourceType: "order" | "stockOut" | "stockTransfer" = "order"
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const parsed = dispatchSchema.safeParse({
    itemId,
    sourceType,
    driverAgentId: driverAgentId || undefined,
  });
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  if (sourceType === "order") {
    const order = await prisma.order.findUnique({
      where: { id: itemId },
      select: { id: true, status: true },
    });

    if (!order) return { success: false, error: "Order not found" };
    if (order.status !== "CONFIRMED")
      return { success: false, error: "Only CONFIRMED orders can be dispatched" };

    const existing = await prisma.delivery.findFirst({
      where: { orderId: itemId, status: "PENDING_DISPATCH" },
      select: { id: true },
    });

    if (existing) {
      await prisma.delivery.update({
        where: { id: existing.id },
        data: {
          status: "IN_TRANSIT",
          truckDriverId: driverAgentId || null,
          scheduledTime: new Date(),
        },
      });
    } else {
      await prisma.delivery.create({
        data: {
          orderId: itemId,
          truckDriverId: driverAgentId || null,
          status: "IN_TRANSIT",
          scheduledTime: new Date(),
        },
      });
    }
  } else if (sourceType === "stockOut") {
    const movement = await prisma.stockMovement.findUnique({
      where: { id: itemId },
      include: { items: { select: { quantity: true } } },
    });

    if (!movement) return { success: false, error: "Stock movement not found" };
    if (movement.type !== "OUTGOING")
      return { success: false, error: "Only outgoing movements can be dispatched" };
    if (movement.status !== "RECORDED")
      return { success: false, error: "Movement is not in a dispatchable state" };

    const alreadyQueued = await prisma.pickPack.findFirst({
      where: { stockMovementId: itemId },
      select: { id: true },
    });

    if (!alreadyQueued) {
      const itemsCount = movement.items.reduce((sum, i) => sum + i.quantity, 0);
      await prisma.pickPack.create({
        data: {
          stockMovementId: itemId,
          itemsCount,
          status: "QUEUED",
        },
      });
    }

    await prisma.stockMovement.update({
      where: { id: itemId },
      data: {
        status: "QC_CHECK",
        driverId: driverAgentId || null,
        scheduledTime: new Date(),
      },
    });
  } else {
    // stockTransfer
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: itemId },
      include: { items: { select: { quantity: true } } },
    });

    if (!transfer) return { success: false, error: "Stock transfer not found" };
    if (transfer.status !== "SUBMITTED")
      return { success: false, error: "Transfer is not in a dispatchable state" };

    const alreadyQueued = await prisma.pickPack.findFirst({
      where: { stockTransferId: itemId },
      select: { id: true },
    });

    if (!alreadyQueued) {
      const itemsCount = transfer.items.reduce((sum, i) => sum + i.quantity, 0);
      await prisma.pickPack.create({
        data: {
          stockTransferId: itemId,
          itemsCount,
          status: "QUEUED",
        },
      });
    }

    await prisma.stockTransfer.update({
      where: { id: itemId },
      data: {
        status: "IN_TRANSIT",
        driverId: driverAgentId || null,
        scheduledTime: new Date(),
      },
    });
  }

  revalidatePath("/logistics/deliveries");
  revalidatePath("/logistics/orders");
  revalidatePath("/warehouse/pick-and-pack");

  return { success: true };
}
