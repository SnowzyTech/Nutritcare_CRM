"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { creditWarehouse, debitWarehouse } from "@/modules/inventory/services/stock-level.service";

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

const OccupancyStatusSchema = z.enum(["FULL", "PARTIAL", "EMPTY"]).optional();

const ConfirmReceiptSchema = z.object({
  stockMovementId: z.string().min(1, "Voucher is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  shelfLocationId: z.string().optional(),
  shelfQuantity: z.coerce.number().int().min(0).optional(),
  occupancyStatus: OccupancyStatusSchema,
  isReserved: z.boolean().default(false),
  isDamaged: z.boolean().default(false),
});

export async function confirmIncomingReceiptAction(
  _prev: { error?: string } | null,
  formData: FormData
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
    shelfLocationId: (formData.get("shelfLocationId") as string) || undefined,
    shelfQuantity: (formData.get("shelfQuantity") as string) || undefined,
    occupancyStatus: (formData.get("occupancyStatus") as string) || undefined,
    isReserved: formData.get("isReserved") === "true",
    isDamaged: formData.get("isDamaged") === "true",
  };

  const parsed = ConfirmReceiptSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const movement = await prisma.stockMovement.findUnique({
    where: { id: parsed.data.stockMovementId },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!movement || movement.type !== "INCOMING") return { error: "Voucher not found" };
  if (movement.warehouseId !== warehouseId) return { error: "This voucher belongs to a different warehouse" };
  if (movement.status !== "RECORDED") return { error: "This voucher has already been processed or is not in Recorded status" };

  if (parsed.data.shelfLocationId) {
    const loc = await prisma.warehouseLocation.findUnique({ where: { id: parsed.data.shelfLocationId } });
    if (!loc || loc.warehouseId !== warehouseId) return { error: "Selected shelf location not found" };
  }

  const totalQty = movement.items.reduce((sum, i) => sum + i.quantity, 0);

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.update({
      where: { id: parsed.data.stockMovementId },
      data: {
        status: "RECEIVED",
        date: new Date(parsed.data.date),
        notes: parsed.data.notes ?? movement.notes,
        shelfLocationId: parsed.data.shelfLocationId ?? null,
        shelfQuantity: parsed.data.shelfQuantity ?? null,
        isReserved: parsed.data.isReserved,
        isDamaged: parsed.data.isDamaged,
      },
    });

    if (parsed.data.shelfLocationId) {
      const shelfLoc = await tx.warehouseLocation.findUnique({
        where: { id: parsed.data.shelfLocationId },
        select: { occupancyStatus: true },
      });
      const newOccupancy =
        parsed.data.occupancyStatus ??
        (shelfLoc?.occupancyStatus === "EMPTY" ? "PARTIAL" : shelfLoc?.occupancyStatus ?? "PARTIAL");
      await tx.warehouseLocation.update({
        where: { id: parsed.data.shelfLocationId },
        data: {
          currentStock: { increment: totalQty },
          occupancyStatus: newOccupancy,
        },
      });
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

  const totalQty = movement.items.reduce((sum, i) => sum + i.quantity, 0);
  const wasCredited = movement.status === "RECEIVED" || movement.status === "SHELVED";

  await prisma.$transaction(async (tx) => {
    if (movement.shelfLocationId && movement.status !== "REVERSED") {
      const shelfLoc = await tx.warehouseLocation.findUnique({
        where: { id: movement.shelfLocationId },
        select: { currentStock: true },
      });
      const newStock = Math.max(0, (shelfLoc?.currentStock ?? 0) - totalQty);
      await tx.warehouseLocation.update({
        where: { id: movement.shelfLocationId },
        data: {
          currentStock: newStock,
          ...(newStock === 0 ? { occupancyStatus: "EMPTY" } : {}),
        },
      });
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
  reason: string
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

  const totalQty = movement.items.reduce((sum, i) => sum + i.quantity, 0);
  const wasCredited = movement.status === "RECEIVED" || movement.status === "SHELVED";

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.update({
      where: { id },
      data: { status: "REVERSED", remarks: reason.trim() || null },
    });

    if (movement.shelfLocationId) {
      const shelfLoc = await tx.warehouseLocation.findUnique({
        where: { id: movement.shelfLocationId },
        select: { currentStock: true },
      });
      const newStock = Math.max(0, (shelfLoc?.currentStock ?? 0) - totalQty);
      await tx.warehouseLocation.update({
        where: { id: movement.shelfLocationId },
        data: {
          currentStock: newStock,
          ...(newStock === 0 ? { occupancyStatus: "EMPTY" } : {}),
        },
      });
    }

    if (wasCredited && movement.warehouseId) {
      await debitWarehouse(tx, movement.warehouseId, movement.items);
    }
  });

  revalidatePath(`/warehouse/incoming-goods/${id}`);
  revalidatePath("/warehouse/incoming-goods");
  return {};
}
