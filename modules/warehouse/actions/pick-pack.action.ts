"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import {
  getWarehouseProductStock,
  transferWarehouseToAgent,
  debitWarehouse,
  debitShelfProducts,
  applyWarehouseLocationDeltas,
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

// Per-product per-shelf allocation submitted from the shelf-selection modal.
export type TransferShelfAllocation = {
  locationId: string;
  productId: string;
  quantity: number;
};

// Shared: validate allocations against ShelfProductStock, then deduct them.
// Items = the movement/transfer items (used for the exact-match check).
async function applyExplicitShelfDeductions(
  tx: Tx,
  items: { productId: string; quantity: number; name?: string }[],
  allocations: TransferShelfAllocation[],
): Promise<void> {
  // Validate per-shelf availability
  for (const alloc of allocations) {
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

  // Validate allocations exactly match required quantities (no over, no under)
  const requiredMap = new Map(items.map((i) => [i.productId, i.quantity]));
  const allocatedMap = new Map<string, number>();
  for (const a of allocations) {
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

  // Deduct from ShelfProductStock
  await debitShelfProducts(tx, allocations as ShelfAllocationItem[]);

  // Decrement WarehouseLocation.currentStock per affected bin.
  // applyWarehouseLocationDeltas does 1 findMany + N updates (vs. the old 2N
  // sequential findUnique+update pairs that caused Neon transaction timeouts).
  const debitDeltas = new Map<string, number>();
  for (const a of allocations) {
    debitDeltas.set(a.locationId, (debitDeltas.get(a.locationId) ?? 0) - a.quantity);
  }
  await applyWarehouseLocationDeltas(tx, debitDeltas);
}

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
          const { warehouseId, toAgentId, items } = pp.stockMovement;
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

          if (transferAllocations && transferAllocations.length > 0) {
            // ── Explicit per-shelf deductions from the UI ──────────────────
            await applyExplicitShelfDeductions(tx, items, transferAllocations);
          } else {
            // ── Legacy cascade deduction (no explicit shelf allocations) ───
            const totalQty = items.reduce((s, i) => s + i.quantity, 0);
            const result = await deductFromWarehouseBins(tx, warehouseId, totalQty, locationCode);
            if (!result.ok) {
              throw new Error(
                `Bins in source warehouse hold less than the required quantity (short by ${result.shortfall}). Update bin counts before packing.`,
              );
            }
          }

          // Materialized balance: warehouse loses, destination agent gains.
          // Status stays at QC_CHECK (IN_TRANSIT) until logistics manager marks delivered/failed.
          await transferWarehouseToAgent(tx, warehouseId, toAgentId, items);
        }

        // ── Warehouse → Warehouse (StockTransfer) ────────────────────────────
        if (pp.stockTransfer) {
          const { sourceType, sourceId, targetType, items } = pp.stockTransfer;

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

            // Decrement WarehouseLocation.currentStock per affected bin.
            const wtwDebitDeltas = new Map<string, number>();
            for (const a of transferAllocations) {
              wtwDebitDeltas.set(a.locationId, (wtwDebitDeltas.get(a.locationId) ?? 0) - a.quantity);
            }
            await applyWarehouseLocationDeltas(tx, wtwDebitDeltas);
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

          // Materialized balance: source warehouse loses only.
          // Target warehouse is credited when the receiving warehouse manager shelves the goods.
          await debitWarehouse(tx, sourceId, items);
          // StockTransfer remains IN_TRANSIT until the target warehouse confirms receipt.
        }
      }

      // Flip the pickpacks last so all validations have run first
      await tx.pickPack.updateMany({
        where: { id: { in: pickPackIds }, status: "QUEUED" },
        data: { packerId: pickerId, locationCode, status: "PACKED", assignedAt: now, completedAt: now },
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

export async function createPickPackerAction(
  name: string,
  warehouseId: string | null,
): Promise<{ success: true; packer: { id: string; name: string; activeTasks: number } } | { success: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Name is required" };

    const packer = await prisma.pickPacker.create({
      data: {
        name: trimmed,
        warehouseId: warehouseId || null,
      },
      select: { id: true, name: true },
    });

    revalidatePath("/warehouse/pick-and-pack");
    return { success: true, packer: { ...packer, activeTasks: 0 } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
