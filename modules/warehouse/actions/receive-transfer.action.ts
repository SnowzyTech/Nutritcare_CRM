"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import {
  creditWarehouse,
  creditShelfProducts,
  applyWarehouseLocationDeltas,
  type ShelfAllocationItem,
} from "@/modules/inventory/services/stock-level.service";

type ShelfEntry = { productId: string; locationId: string; quantity: number };

async function requireWarehouseManager() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!session.user.warehouseId) throw new Error("No warehouse assigned to your account");
  return { userId: session.user.id, warehouseId: session.user.warehouseId };
}

export async function receiveStockTransferAction(
  transferId: string,
  shelfEntries: ShelfEntry[],
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  let warehouseId: string;
  try {
    ({ warehouseId } = await requireWarehouseManager());
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }

  const transfer = await prisma.stockTransfer.findUnique({
    where: { id: transferId },
    include: { items: { select: { productId: true, quantity: true } } },
  });

  if (!transfer) return { success: false, error: "Transfer not found" };
  if (transfer.targetType !== "WAREHOUSE" || transfer.targetId !== warehouseId) {
    return { success: false, error: "This transfer is not destined for your warehouse" };
  }
  if (transfer.status !== "IN_TRANSIT") {
    return { success: false, error: "Transfer is not in transit" };
  }

  if (shelfEntries.length > 0) {
    const requiredMap = new Map(transfer.items.map((i) => [i.productId, i.quantity]));
    const assignedMap = new Map<string, number>();
    for (const e of shelfEntries) {
      assignedMap.set(e.productId, (assignedMap.get(e.productId) ?? 0) + e.quantity);
    }
    for (const [productId, required] of requiredMap) {
      const assigned = assignedMap.get(productId) ?? 0;
      if (assigned !== required) {
        return { success: false, error: "Shelf assignment quantities don't match transfer quantities for all products" };
      }
    }
    const locationIds = [...new Set(shelfEntries.map((e) => e.locationId))];
    const locs = await prisma.warehouseLocation.findMany({
      where: { id: { in: locationIds } },
      select: { id: true, warehouseId: true },
    });
    if (locs.length !== locationIds.length || locs.some((l) => l.warehouseId !== warehouseId)) {
      return { success: false, error: "One or more selected shelf locations are invalid" };
    }
  } else {
    return { success: false, error: "At least one shelf assignment is required to receive the transfer" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockTransfer.update({
      where: { id: transferId },
      data: { status: "COMPLETED", notes: notes ?? undefined },
    });

    const creditDeltas = new Map<string, number>();
    for (const e of shelfEntries) {
      creditDeltas.set(e.locationId, (creditDeltas.get(e.locationId) ?? 0) + e.quantity);
    }
    await applyWarehouseLocationDeltas(tx, creditDeltas);
    await creditShelfProducts(tx, shelfEntries as ShelfAllocationItem[]);
    await creditWarehouse(tx, warehouseId, transfer.items);
  });

  revalidatePath("/warehouse/incoming-goods");
  revalidatePath("/logistics/deliveries");
  revalidatePath("/inventory/transfer");
  return { success: true };
}
