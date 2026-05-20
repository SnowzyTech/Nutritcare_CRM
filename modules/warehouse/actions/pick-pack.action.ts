"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import {
  getWarehouseProductStock,
  transferWarehouseToAgent,
  transferWarehouseToWarehouse,
  debitShelfProducts,
  creditShelfProducts,
  type ShelfAllocationItem,
} from "@/modules/inventory/services/stock-level.service";

type Tx = Prisma.TransactionClient;

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

// Returns the locationId of the credited bin so callers can also update ShelfProductStock.
async function creditTargetWarehouseBin(tx: Tx, warehouseId: string, qty: number): Promise<string | null> {
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
    data: { currentStock: { increment: qty }, occupancyStatus: "PARTIAL" },
  });
  return target.id;
}

// Per-product per-shelf allocation submitted from the transfer assign modal.
export type TransferShelfAllocation = {
  locationId: string;
  productId: string;
  quantity: number;
};

export async function assignPickerAction(
  pickPackIds: string[],
  pickerId: string,
  locationCode: string,
  // Provided when any selected PickPack is a W-to-W transfer
  transferAllocations?: TransferShelfAllocation[],
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
            toAgentId: true,
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
          const { id: movementId, warehouseId, toAgentId, items } = pp.stockMovement;
          if (!warehouseId) {
            throw new Error("Warehouse-to-Agent movement is missing a source warehouse");
          }
          if (!toAgentId) {
            throw new Error("Warehouse-to-Agent movement is missing a destination agent");
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

          // Materialized balance: warehouse loses, destination agent gains.
          await transferWarehouseToAgent(tx, warehouseId, toAgentId, items);

          // Mark the movement as shelved-out (kept for audit/UI status labels)
          await tx.stockMovement.update({
            where: { id: movementId },
            data: { status: "SHELVED" },
          });
        }

        // ── Warehouse → Warehouse (StockTransfer) ────────────────────────────
        if (pp.stockTransfer) {
          const { id: transferId, sourceType, sourceId, targetType, targetId, items } = pp.stockTransfer;

          if (sourceType !== "WAREHOUSE" || targetType !== "WAREHOUSE") {
            throw new Error("Stock transfers must be warehouse-to-warehouse");
          }

          // Validate per-product availability in materialized StockLevel
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

          if (transferAllocations && transferAllocations.length > 0) {
            // ── Explicit per-shelf deductions from the UI ──────────────────
            // Validate each allocation against ShelfProductStock
            for (const alloc of transferAllocations) {
              const shelf = await tx.shelfProductStock.findUnique({
                where: { locationId_productId: { locationId: alloc.locationId, productId: alloc.productId } },
              });
              const shelfQty = shelf?.quantity ?? 0;
              if (shelfQty < alloc.quantity) {
                const loc = await tx.warehouseLocation.findUnique({
                  where: { id: alloc.locationId },
                  select: { locationCode: true },
                });
                const product = await tx.product.findUnique({
                  where: { id: alloc.productId },
                  select: { name: true },
                });
                throw new Error(
                  `Shelf ${loc?.locationCode ?? alloc.locationId} only has ${shelfQty} of "${product?.name ?? alloc.productId}", but ${alloc.quantity} requested`,
                );
              }
            }

            // Validate allocations match required quantities exactly (not under, not over)
            const requiredMap = new Map(items.map((i) => [i.productId, i.quantity]));
            const allocatedMap = new Map<string, number>();
            for (const a of transferAllocations) {
              allocatedMap.set(a.productId, (allocatedMap.get(a.productId) ?? 0) + a.quantity);
            }
            for (const [productId, required] of requiredMap) {
              const allocated = allocatedMap.get(productId) ?? 0;
              if (allocated !== required) {
                const product = await tx.product.findUnique({
                  where: { id: productId },
                  select: { name: true },
                });
                throw new Error(
                  allocated < required
                    ? `Shelf allocations for "${product?.name ?? productId}" cover only ${allocated} of ${required} required`
                    : `Shelf allocations for "${product?.name ?? productId}" exceed the required ${required} (got ${allocated})`,
                );
              }
            }

            // Deduct from ShelfProductStock per allocation
            await debitShelfProducts(tx, transferAllocations as ShelfAllocationItem[]);

            // Update WarehouseLocation.currentStock per affected bin
            const qtyByLocation = new Map<string, number>();
            for (const a of transferAllocations) {
              qtyByLocation.set(a.locationId, (qtyByLocation.get(a.locationId) ?? 0) + a.quantity);
            }
            for (const [locationId, qty] of qtyByLocation) {
              const loc = await tx.warehouseLocation.findUnique({
                where: { id: locationId },
                select: { currentStock: true },
              });
              const newStock = Math.max(0, (loc?.currentStock ?? 0) - qty);
              await tx.warehouseLocation.update({
                where: { id: locationId },
                data: {
                  currentStock: newStock,
                  ...(newStock === 0 ? { occupancyStatus: "EMPTY" } : {}),
                },
              });
            }
          } else {
            // ── Legacy cascade deduction (no explicit shelf allocations) ───
            const totalQty = items.reduce((s, i) => s + i.quantity, 0);
            const result = await deductFromWarehouseBins(tx, sourceId, totalQty, locationCode);
            if (!result.ok) {
              throw new Error(
                `Bins in source warehouse hold less than the required quantity (short by ${result.shortfall}). Update bin counts before packing.`,
              );
            }
          }

          // Credit a bin in the target warehouse
          const totalQty = items.reduce((s, i) => s + i.quantity, 0);
          const targetBin = await creditTargetWarehouseBin(tx, targetId, totalQty);
          // Also credit ShelfProductStock for the target bin if we got one back
          if (targetBin) {
            await creditShelfProducts(
              tx,
              items.map((i) => ({ locationId: targetBin, productId: i.productId, quantity: i.quantity })),
            );
          }

          // Materialized balance: source warehouse loses, target gains.
          await transferWarehouseToWarehouse(tx, sourceId, targetId, items);

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
