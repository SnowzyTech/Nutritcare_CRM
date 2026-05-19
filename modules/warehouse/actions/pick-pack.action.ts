"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

// Compute available (un-shelved-deducted) quantity of a product in a warehouse,
// from stock movements + completed transfers. This is the *logical* inventory
// for validation; physical bin counts are adjusted at PACKED time below.
async function getWarehouseProductStock(tx: Tx, warehouseId: string, productId: string): Promise<number> {
  const [movItems, completedTransfers] = await Promise.all([
    tx.stockMovementItem.findMany({
      where: { productId, stockMovement: { warehouseId } },
      include: { stockMovement: { select: { type: true, status: true } } },
    }),
    tx.stockTransferItem.findMany({
      where: { productId, stockTransfer: { status: "COMPLETED", OR: [{ sourceId: warehouseId }, { targetId: warehouseId }] } },
      include: { stockTransfer: { select: { sourceType: true, sourceId: true, targetType: true, targetId: true } } },
    }),
  ]);

  let available = 0;
  for (const mi of movItems) {
    const { type, status } = mi.stockMovement;
    if (type === "INCOMING" && ["RECEIVED", "SHELVED"].includes(status)) available += mi.quantity;
    else if (type === "OUTGOING" && status === "SHELVED") available -= mi.quantity;
    else if (type === "RETURN") available += mi.quantity;
  }
  for (const ti of completedTransfers) {
    const { sourceType, sourceId, targetType, targetId } = ti.stockTransfer;
    if (sourceType === "WAREHOUSE" && sourceId === warehouseId) available -= ti.quantity;
    if (targetType === "WAREHOUSE" && targetId === warehouseId) available += ti.quantity;
  }
  return Math.max(0, available);
}

// Deduct `qty` from bins of a warehouse: try the picker-selected bin first,
// then cascade to other bins by highest stock until satisfied.
async function deductFromWarehouseBins(
  tx: Tx,
  warehouseId: string,
  qty: number,
  preferredLocationCode: string,
): Promise<{ ok: true } | { ok: false; shortfall: number }> {
  let remaining = qty;

  if (preferredLocationCode) {
    const preferred = await tx.warehouseLocation.findFirst({
      where: { warehouseId, locationCode: preferredLocationCode },
    });
    if (preferred && preferred.currentStock > 0) {
      const deduct = Math.min(preferred.currentStock, remaining);
      await tx.warehouseLocation.update({
        where: { id: preferred.id },
        data: {
          currentStock: { decrement: deduct },
          occupancyStatus: preferred.currentStock - deduct === 0 ? "EMPTY" : preferred.occupancyStatus,
        },
      });
      remaining -= deduct;
    }
  }

  if (remaining > 0) {
    const others = await tx.warehouseLocation.findMany({
      where: {
        warehouseId,
        currentStock: { gt: 0 },
        ...(preferredLocationCode ? { locationCode: { not: preferredLocationCode } } : {}),
      },
      orderBy: { currentStock: "desc" },
    });
    for (const loc of others) {
      if (remaining <= 0) break;
      const deduct = Math.min(loc.currentStock, remaining);
      await tx.warehouseLocation.update({
        where: { id: loc.id },
        data: {
          currentStock: { decrement: deduct },
          occupancyStatus: loc.currentStock - deduct === 0 ? "EMPTY" : loc.occupancyStatus,
        },
      });
      remaining -= deduct;
    }
  }

  return remaining > 0 ? { ok: false, shortfall: remaining } : { ok: true };
}

async function creditTargetWarehouseBin(tx: Tx, warehouseId: string, qty: number): Promise<void> {
  // Prefer an existing non-full bin; fall back to any bin; create one if none exist.
  let target = await tx.warehouseLocation.findFirst({
    where: { warehouseId, occupancyStatus: { not: "FULL" } },
    orderBy: { currentStock: "asc" },
  });
  if (!target) {
    target = await tx.warehouseLocation.findFirst({
      where: { warehouseId },
      orderBy: { currentStock: "asc" },
    });
  }
  if (!target) {
    target = await tx.warehouseLocation.create({
      data: { warehouseId, locationCode: "A1", currentStock: 0, occupancyStatus: "EMPTY" },
    });
  }
  await tx.warehouseLocation.update({
    where: { id: target.id },
    data: {
      currentStock: { increment: qty },
      occupancyStatus: "PARTIAL",
    },
  });
}

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
            id: true,
            warehouseId: true,
            items: { select: { productId: true, productCode: true, quantity: true } },
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
      for (const pp of queuedPacks) {
        // ── Warehouse → Agent (StockMovement OUTGOING) ───────────────────────
        if (pp.stockMovement) {
          const { id: movementId, warehouseId, items } = pp.stockMovement;
          if (!warehouseId) {
            throw new Error("Warehouse-to-Agent movement is missing a source warehouse");
          }

          // Validate physical availability of every item in the source warehouse
          for (const item of items) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { name: true },
            });
            const available = await getWarehouseProductStock(tx, warehouseId, item.productId);
            if (available < item.quantity) {
              throw new Error(
                `Insufficient stock for "${product?.name ?? item.productCode}" — ${available} available, ${item.quantity} required`,
              );
            }
          }

          // Deduct physical bin counts (selected bin first, cascade by stock desc)
          const totalQty = items.reduce((s, i) => s + i.quantity, 0);
          const result = await deductFromWarehouseBins(tx, warehouseId, totalQty, locationCode);
          if (!result.ok) {
            throw new Error(
              `Bins in source warehouse hold less than the required quantity (short by ${result.shortfall}). Update bin counts before packing.`,
            );
          }

          // System inventory leaves the company when goods reach the agent
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { decrement: item.quantity } },
            });
          }

          // Mark the movement as shelved-out so future availability calcs reflect it
          await tx.stockMovement.update({
            where: { id: movementId },
            data: { status: "SHELVED" },
          });
        }

        // ── Warehouse → Warehouse (StockTransfer) ────────────────────────────
        if (pp.stockTransfer) {
          const { id: transferId, sourceType, sourceId, targetType, targetId, items } = pp.stockTransfer;
          const totalQty = items.reduce((s, i) => s + i.quantity, 0);

          if (sourceType !== "WAREHOUSE" || targetType !== "WAREHOUSE") {
            throw new Error("Stock transfers must be warehouse-to-warehouse");
          }

          // Validate per-product source availability
          for (const item of items) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { name: true },
            });
            const available = await getWarehouseProductStock(tx, sourceId, item.productId);
            if (available < item.quantity) {
              throw new Error(
                `Insufficient stock for "${product?.name ?? item.productId}" in source warehouse — ${available} available, ${item.quantity} required`,
              );
            }
          }

          const result = await deductFromWarehouseBins(tx, sourceId, totalQty, locationCode);
          if (!result.ok) {
            throw new Error(
              `Bins in source warehouse hold less than the required quantity (short by ${result.shortfall}). Update bin counts before packing.`,
            );
          }

          await creditTargetWarehouseBin(tx, targetId, totalQty);

          await tx.stockTransfer.update({
            where: { id: transferId },
            data: { status: "COMPLETED" },
          });
        }
      }

      // Flip the pickpacks last so all validations have run first
      await tx.pickPack.updateMany({
        where: { id: { in: pickPackIds }, status: "QUEUED" },
        data: { pickerId, locationCode, status: "PACKED", assignedAt: now, completedAt: now },
      });
    });

    revalidatePath("/warehouse/pick-and-pack");
    revalidatePath("/warehouse/location");
    revalidatePath("/logistics/deliveries");
    revalidatePath("/inventory/outgoing");
    revalidatePath("/inventory/transfer");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
