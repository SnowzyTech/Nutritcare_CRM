"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  creditWarehouse,
  debitWarehouse,
  creditShelfProducts,
  debitShelfProducts,
  applyWarehouseLocationDeltas,
  type ShelfAllocationItem,
} from "@/modules/inventory/services/stock-level.service";

function generateReferenceNumber(): string {
  const suffix = Date.now().toString(36).toUpperCase().slice(-6);
  return `SI-${suffix}`;
}

async function requireWarehouseManager() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!session.user.warehouseId) throw new Error("No warehouse assigned to your account");
  return { userId: session.user.id, warehouseId: session.user.warehouseId };
}

// ── Confirm Inventory Voucher Receipt ─────────────────────────────────────────

// Per-product shelf assignment submitted from the UI.
// [{productId, locationId, quantity}] stored as JSON in the form.
type IncomingShelfEntry = { productId: string; locationId: string; quantity: number };

const ConfirmReceiptSchema = z.object({
  stockMovementId: z.string().min(1, "Voucher is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  isReserved: z.boolean().default(false),
  isDamaged: z.boolean().default(false),
});

async function deriveOccupancyForLocation(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  locationId: string,
): Promise<"EMPTY" | "PARTIAL" | "FULL"> {
  const loc = await tx.warehouseLocation.findUnique({
    where: { id: locationId },
    select: { currentStock: true, maxCapacity: true },
  });
  if (!loc) return "PARTIAL";
  if (loc.currentStock === 0) return "EMPTY";
  if (loc.maxCapacity && loc.currentStock >= loc.maxCapacity) return "FULL";
  return "PARTIAL";
}

export async function confirmIncomingReceiptAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  let warehouseId: string;
  try {
    ({ warehouseId } = await requireWarehouseManager());
  } catch (e) {
    return { error: (e as Error).message };
  }

  const raw = {
    stockMovementId: formData.get("stockMovementId") as string,
    date: formData.get("date") as string,
    notes: (formData.get("notes") as string) || undefined,
    isReserved: formData.get("isReserved") === "true",
    isDamaged: formData.get("isDamaged") === "true",
  };

  const parsed = ConfirmReceiptSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Parse per-product shelf assignments
  let shelfEntries: IncomingShelfEntry[] = [];
  const shelfEntriesRaw = formData.get("shelfAssignments") as string | null;
  if (shelfEntriesRaw) {
    try {
      shelfEntries = JSON.parse(shelfEntriesRaw);
    } catch {
      return { error: "Invalid shelf assignment data" };
    }
  }

  const movement = await prisma.stockMovement.findUnique({
    where: { id: parsed.data.stockMovementId },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!movement || movement.type !== "INCOMING") return { error: "Voucher not found" };
  if (movement.warehouseId !== warehouseId) return { error: "This voucher belongs to a different warehouse" };
  if (movement.status !== "RECORDED") return { error: "This voucher has already been processed or is not in Recorded status" };

  // Validate shelf assignments cover all required quantities
  if (shelfEntries.length > 0) {
    const requiredMap = new Map(movement.items.map((i) => [i.productId, i.quantity]));
    const assignedMap = new Map<string, number>();
    for (const e of shelfEntries) {
      assignedMap.set(e.productId, (assignedMap.get(e.productId) ?? 0) + e.quantity);
    }
    for (const [productId, required] of requiredMap) {
      const assigned = assignedMap.get(productId) ?? 0;
      if (assigned !== required) {
        return { error: `Shelf assignment quantities don't match voucher quantities for all products` };
      }
    }
    // Validate each locationId belongs to this warehouse
    const locationIds = [...new Set(shelfEntries.map((e) => e.locationId))];
    const locs = await prisma.warehouseLocation.findMany({
      where: { id: { in: locationIds } },
      select: { id: true, warehouseId: true },
    });
    const invalid = locs.find((l) => l.warehouseId !== warehouseId);
    if (invalid || locs.length !== locationIds.length) {
      return { error: "One or more selected shelf locations are invalid" };
    }
  }

  const primaryShelfId = shelfEntries[0]?.locationId ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.update({
      where: { id: parsed.data.stockMovementId },
      data: {
        status: "RECEIVED",
        date: new Date(parsed.data.date),
        notes: parsed.data.notes ?? movement.notes,
        shelfLocationId: primaryShelfId,
        shelfAssignments: shelfEntries.length > 0 ? (shelfEntries as object[]) : undefined,
        isReserved: parsed.data.isReserved,
        isDamaged: parsed.data.isDamaged,
      },
    });

    if (shelfEntries.length > 0) {
      // Group by locationId → credit delta map, then apply in one helper call.
      // applyWarehouseLocationDeltas does 1 findMany + N updates and correctly
      // recomputes occupancyStatus — replacing the old 3N sequential round-trips
      // (increment + findUnique + occupancy-update) that caused Neon timeouts.
      const creditDeltas = new Map<string, number>();
      for (const e of shelfEntries) {
        creditDeltas.set(e.locationId, (creditDeltas.get(e.locationId) ?? 0) + e.quantity);
      }
      await applyWarehouseLocationDeltas(tx, creditDeltas);

      // Update per-product per-shelf stock
      const shelfItems: ShelfAllocationItem[] = shelfEntries.map((e) => ({
        locationId: e.locationId,
        productId: e.productId,
        quantity: e.quantity,
      }));
      await creditShelfProducts(tx, shelfItems);
    }

    // Materialized stock balance — goods now belong to this warehouse.
    await creditWarehouse(tx, warehouseId, movement.items);
  });

  revalidatePath("/warehouse/incoming-goods");
  redirect("/warehouse/incoming-goods");
}

// ── Create Incoming ───────────────────────────────────────────────────────────

const ProductItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive("Quantity must be a positive number"),
});

const CreateIncomingSchema = z.object({
  supplierId: z.string().optional(),
  supplierReference: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  shelfLocationId: z.string().optional(),
  shelfQuantity: z.coerce.number().int().min(0).optional(),
  isReserved: z.boolean().default(false),
  isDamaged: z.boolean().default(false),
  items: z.array(ProductItemSchema).min(1, "At least one product is required"),
});

export async function createIncomingMovementAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  let userId: string;
  let warehouseId: string;

  try {
    ({ userId, warehouseId } = await requireWarehouseManager());
  } catch (e) {
    return { error: (e as Error).message };
  }

  let items: Array<{ productId: string; quantity: number }> = [];
  try {
    items = JSON.parse(formData.get("items") as string);
  } catch {
    return { error: "Invalid product data" };
  }

  const raw = {
    supplierId: (formData.get("supplierId") as string) || undefined,
    supplierReference: (formData.get("supplierReference") as string) || undefined,
    date: formData.get("date") as string,
    notes: (formData.get("notes") as string) || undefined,
    shelfLocationId: (formData.get("shelfLocationId") as string) || undefined,
    shelfQuantity: (formData.get("shelfQuantity") as string) || undefined,
    isReserved: formData.get("isReserved") === "true",
    isDamaged: formData.get("isDamaged") === "true",
    items,
  };

  const parsed = CreateIncomingSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  if (parsed.data.supplierId) {
    const supplier = await prisma.supplier.findUnique({ where: { id: parsed.data.supplierId } });
    if (!supplier) return { error: "Selected supplier not found" };
  }

  if (parsed.data.shelfLocationId) {
    const loc = await prisma.warehouseLocation.findUnique({ where: { id: parsed.data.shelfLocationId } });
    if (!loc || loc.warehouseId !== warehouseId) return { error: "Selected shelf location not found" };
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
    select: { id: true, sku: true },
  });
  if (products.length !== productIds.length) return { error: "One or more products not found" };

  const skuMap = new Map(products.map((p) => [p.id, p.sku]));

  const totalQty = parsed.data.items.reduce((sum, i) => sum + i.quantity, 0);

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: {
        referenceNumber: generateReferenceNumber(),
        type: "INCOMING",
        status: "RECORDED",
        warehouseId,
        supplierId: parsed.data.supplierId ?? null,
        supplierReference: parsed.data.supplierReference ?? null,
        date: new Date(parsed.data.date),
        notes: parsed.data.notes ?? null,
        shelfLocationId: parsed.data.shelfLocationId ?? null,
        shelfQuantity: parsed.data.shelfQuantity ?? null,
        isReserved: parsed.data.isReserved,
        isDamaged: parsed.data.isDamaged,
        createdById: userId,
        items: {
          create: parsed.data.items.map((item) => ({
            productId: item.productId,
            productCode: skuMap.get(item.productId) ?? "",
            quantity: item.quantity,
          })),
        },
      },
    });

    if (parsed.data.shelfLocationId) {
      const shelfLoc = await tx.warehouseLocation.findUnique({
        where: { id: parsed.data.shelfLocationId },
        select: { occupancyStatus: true },
      });
      await tx.warehouseLocation.update({
        where: { id: parsed.data.shelfLocationId },
        data: {
          currentStock: { increment: totalQty },
          ...(shelfLoc?.occupancyStatus === "EMPTY" ? { occupancyStatus: "PARTIAL" } : {}),
        },
      });
    }
  });

  revalidatePath("/warehouse/incoming-goods");
  redirect("/warehouse/incoming-goods");
}

// ── Delete Incoming ───────────────────────────────────────────────────────────

export async function deleteIncomingMovementAction(
  id: string
): Promise<{ error?: string }> {
  let warehouseId: string;
  try {
    ({ warehouseId } = await requireWarehouseManager());
  } catch (e) {
    return { error: (e as Error).message };
  }

  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!movement || movement.type !== "INCOMING") return { error: "Movement not found" };
  if (movement.warehouseId !== warehouseId) return { error: "Access denied" };

  const wasCredited = movement.status === "RECEIVED" || movement.status === "SHELVED";

  let storedAssignments: IncomingShelfEntry[] = [];
  if (movement.shelfAssignments) {
    try {
      storedAssignments = movement.shelfAssignments as IncomingShelfEntry[];
    } catch {
      storedAssignments = [];
    }
  }

  await prisma.$transaction(async (tx) => {
    if (movement.status !== "REVERSED") {
      if (storedAssignments.length > 0) {
        const debitDeltas = new Map<string, number>();
        for (const e of storedAssignments) {
          debitDeltas.set(e.locationId, (debitDeltas.get(e.locationId) ?? 0) - e.quantity);
        }
        await applyWarehouseLocationDeltas(tx, debitDeltas);
        await debitShelfProducts(
          tx,
          storedAssignments.map((e) => ({
            locationId: e.locationId,
            productId: e.productId,
            quantity: e.quantity,
          })),
        );
      } else if (movement.shelfLocationId) {
        const totalQty = movement.items.reduce((sum, i) => sum + i.quantity, 0);
        await applyWarehouseLocationDeltas(
          tx,
          new Map([[movement.shelfLocationId, -totalQty]]),
        );
      }
    }
    // Undo the stock credit if this receipt was already counted.
    if (wasCredited && movement.warehouseId) {
      await debitWarehouse(tx, movement.warehouseId, movement.items);
    }
    await tx.stockMovement.delete({ where: { id } });
  });

  revalidatePath("/warehouse/incoming-goods");
  redirect("/warehouse/incoming-goods");
}

// ── Reverse Incoming ──────────────────────────────────────────────────────────

export async function reverseIncomingMovementWarehouseAction(
  id: string,
  reason: string,
): Promise<{ error?: string }> {
  let warehouseId: string;
  try {
    ({ warehouseId } = await requireWarehouseManager());
  } catch (e) {
    return { error: (e as Error).message };
  }

  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!movement || movement.type !== "INCOMING") return { error: "Movement not found" };
  if (movement.warehouseId !== warehouseId) return { error: "Access denied" };
  if (movement.status === "REVERSED") return { error: "Movement is already reversed" };

  const wasCredited = movement.status === "RECEIVED" || movement.status === "SHELVED";

  // Parse stored per-product shelf assignments for accurate reversal
  let storedAssignments: IncomingShelfEntry[] = [];
  if (movement.shelfAssignments) {
    try {
      storedAssignments = movement.shelfAssignments as IncomingShelfEntry[];
    } catch {
      storedAssignments = [];
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.update({
      where: { id },
      data: { status: "REVERSED", remarks: reason.trim() || null },
    });

    if (storedAssignments.length > 0) {
      const debitDeltas = new Map<string, number>();
      for (const e of storedAssignments) {
        debitDeltas.set(e.locationId, (debitDeltas.get(e.locationId) ?? 0) - e.quantity);
      }
      await applyWarehouseLocationDeltas(tx, debitDeltas);
      await debitShelfProducts(
        tx,
        storedAssignments.map((e) => ({
          locationId: e.locationId,
          productId: e.productId,
          quantity: e.quantity,
        })),
      );
    } else if (movement.shelfLocationId) {
      const totalQty = movement.items.reduce((sum, i) => sum + i.quantity, 0);
      await applyWarehouseLocationDeltas(
        tx,
        new Map([[movement.shelfLocationId, -totalQty]]),
      );
    }

    if (wasCredited && movement.warehouseId) {
      await debitWarehouse(tx, movement.warehouseId, movement.items);
    }
  });

  revalidatePath(`/warehouse/incoming-goods/${id}`);
  revalidatePath("/warehouse/incoming-goods");
  return {};
}
