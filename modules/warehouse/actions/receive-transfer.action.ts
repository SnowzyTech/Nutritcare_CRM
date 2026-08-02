"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import {
  creditWarehouse,
  creditShelfProducts,
  applyWarehouseLocationDeltas,
  isTransferSourceDebited,
  type ShelfAllocationItem,
} from "@/modules/inventory/services/stock-level.service";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { suppressCameraForRequest } from "@/lib/audit/context";

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
  let userId: string;
  try {
    ({ userId, warehouseId } = await requireWarehouseManager());
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
  suppressCameraForRequest();

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
  // Crediting this warehouse is only legitimate once the source warehouse has
  // given the stock up (PickPack PACKED). IN_TRANSIT is set at dispatch, which
  // happens before packing — receiving here would otherwise create stock.
  if (!(await isTransferSourceDebited(prisma, transferId))) {
    return {
      success: false,
      error: "The source warehouse has not packed this transfer yet — it cannot be received",
    };
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

  try {
    await prisma.$transaction(async (tx) => {
      // Conditional flip: if a concurrent request already moved this transfer out
      // of IN_TRANSIT, count is 0 and we abort rather than credit the stock twice.
      const flipped = await tx.stockTransfer.updateMany({
        where: { id: transferId, status: "IN_TRANSIT" },
        data: { status: "COMPLETED", notes: notes ?? undefined },
      });
      if (flipped.count === 0) {
        throw new Error("This transfer has already been received");
      }

      const creditDeltas = new Map<string, number>();
      for (const e of shelfEntries) {
        creditDeltas.set(e.locationId, (creditDeltas.get(e.locationId) ?? 0) + e.quantity);
      }
      await applyWarehouseLocationDeltas(tx, creditDeltas);
      await creditShelfProducts(tx, shelfEntries as ShelfAllocationItem[]);
      await creditWarehouse(tx, warehouseId, transfer.items);
    });
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }

  await logActivity({
    userId,
    action: "Updated",
    entityType: "StockTransfer",
    entityId: transferId,
    description: `Received and shelved stock transfer ${transfer.referenceNumber}`,
  });

  revalidatePath("/warehouse/incoming-goods");
  revalidatePath("/logistics/deliveries");
  revalidatePath("/inventory/transfer");
  return { success: true };
}
