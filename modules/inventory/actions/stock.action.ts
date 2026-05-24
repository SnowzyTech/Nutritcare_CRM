"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  debitWarehouse,
  transferAgentToAgent,
  reverseWarehouseToAgent,
  transferWarehouseToWarehouse,
  reverseReturn,
  recordAdjustment,
  reverseAdjustment,
  getWarehouseProductStock,
  getAgentProductStock,
} from "@/modules/inventory/services/stock-level.service";

// ── Shared ────────────────────────────────────────────────────────────────────

function generateRefNumber(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

function generateSku(name: string): string {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4)
    .padEnd(3, "X");
  const suffix = Date.now().toString(36).toUpperCase().slice(-5);
  return `${prefix}-${suffix}`;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify the session user still exists in the DB (guards against stale JWTs after re-seeding)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!dbUser) throw new Error("Session expired — please sign out and sign in again");

  return session.user;
}

// ── Create Incoming Movement ──────────────────────────────────────────────────

const CreateIncomingSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  supplierId: z.string().optional(),
  supplierReference: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "RECORDED"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        productCode: z.string().min(1, "Product code is required"),
        quantity: z.number().int().positive("Quantity must be a positive number"),
      })
    )
    .min(1, "At least one product is required"),
});

export async function createIncomingMovementAction(
  data: z.infer<typeof CreateIncomingSchema>
): Promise<{ id?: string; error?: string }> {
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const parsed = CreateIncomingSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { warehouseId, supplierId, supplierReference, date, notes, status, items } = parsed.data;

  try {
    const movement = await prisma.stockMovement.create({
      data: {
        referenceNumber: generateRefNumber("SI"),
        type: "INCOMING",
        status,
        warehouseId,
        supplierId: supplierId || null,
        supplierReference: supplierReference || null,
        date: new Date(date),
        notes: notes || null,
        createdById: user.id,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productCode: item.productCode,
            quantity: item.quantity,
          })),
        },
      },
    });

    revalidatePath("/inventory/incoming");
    return { id: movement.id };
  } catch (e) {
    console.error("createIncomingMovementAction error:", e);
    return { error: "Failed to save — please check your data and try again" };
  }

}

const UpdateIncomingSchema = CreateIncomingSchema.extend({
  id: z.string().min(1, "ID is required"),
});

export async function updateIncomingMovementAction(
  data: z.infer<typeof UpdateIncomingSchema>
): Promise<{ error?: string }> {
  try {
    await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const parsed = UpdateIncomingSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { id, warehouseId, supplierId, supplierReference, date, notes, status, items } = parsed.data;

  try {
    await prisma.$transaction([
      prisma.stockMovementItem.deleteMany({ where: { stockMovementId: id } }),
      prisma.stockMovement.update({
        where: { id },
        data: {
          status,
          warehouseId,
          supplierId: supplierId || null,
          supplierReference: supplierReference || null,
          date: new Date(date),
          notes: notes || null,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productCode: item.productCode,
              quantity: item.quantity,
            })),
          },
        },
      }),
    ]);
  } catch (e) {
    console.error("updateIncomingMovementAction error:", e);
    return { error: "Failed to update — please check your data and try again" };
  }

  revalidatePath("/inventory/incoming");
  revalidatePath(`/inventory/incoming/${id}`);
  return {};
}

// ── Create Outgoing Movement ──────────────────────────────────────────────────

const CreateOutgoingSchema = z.object({
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  date: z.string().min(1, "Date is required"),
  agentId: z.string().min(1, "Agent is required"),
  fromAgentId: z.string().optional(),
  supplierReference: z.string().optional(),
  isAgentToAgentTransfer: z.boolean().default(false),
  warehouseId: z.string().optional(),
  shelfLocationId: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        productCode: z.string(),
        quantity: z.number().int().positive("Quantity must be a positive number"),
      })
    )
    .min(1, "At least one product is required"),
});

export async function createOutgoingMovementAction(
  data: z.infer<typeof CreateOutgoingSchema>
): Promise<{ error?: string }> {
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const parsed = CreateOutgoingSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const {
    state, country, date, agentId, fromAgentId, supplierReference,
    isAgentToAgentTransfer, warehouseId, shelfLocationId, notes, items,
  } = parsed.data;

  if (isAgentToAgentTransfer) {
    if (!fromAgentId) return { error: "Source agent is required for agent-to-agent transfers" };
    if (fromAgentId === agentId) return { error: "Source and destination agent cannot be the same" };
  } else {
    if (!warehouseId) return { error: "Source warehouse is required for warehouse-to-agent movements" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (!isAgentToAgentTransfer && warehouseId) {
        for (const item of items) {
          const available = await getWarehouseProductStock(tx, warehouseId, item.productId);
          if (available < item.quantity) {
            const prod = await tx.product.findUnique({ where: { id: item.productId }, select: { name: true } });
            throw new Error(
              `Insufficient stock in warehouse for "${prod?.name ?? item.productCode}" (${available} available, ${item.quantity} required)`
            );
          }
        }
      }

      if (isAgentToAgentTransfer && fromAgentId) {
        for (const item of items) {
          const available = await getAgentProductStock(tx, fromAgentId, item.productId);
          if (available < item.quantity) {
            const prod = await tx.product.findUnique({ where: { id: item.productId }, select: { name: true } });
            throw new Error(
              `Insufficient stock with agent for "${prod?.name ?? item.productCode}" (${available} available, ${item.quantity} required)`
            );
          }
        }
      }

      await tx.stockMovement.create({
        data: {
          referenceNumber: generateRefNumber("SO"),
          type: "OUTGOING",
          status: "RECORDED",
          agentId: isAgentToAgentTransfer ? (fromAgentId || null) : null,
          toAgentId: agentId,
          warehouseId: (!isAgentToAgentTransfer && warehouseId) ? warehouseId : null,
          shelfLocationId: null,
          state,
          country,
          supplierReference: supplierReference || null,
          isAgentToAgentTransfer,
          date: new Date(date),
          notes: notes || null,
          createdById: user.id,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productCode: item.productCode || item.productId,
              quantity: item.quantity,
            })),
          },
        },
      });

      // Agent → agent ownership changes immediately at create (no pick/pack step).
      // Warehouse → agent moves are credited later at PickPack PACKED.
      if (isAgentToAgentTransfer && fromAgentId) {
        await transferAgentToAgent(tx, fromAgentId, agentId, items);
      }
    });
  } catch (e) {
    console.error("createOutgoingMovementAction error:", e);
    const msg = e instanceof Error ? e.message : "Failed to save — please check your data and try again";
    return { error: msg };
  }

  revalidatePath("/inventory/outgoing");
  return {};
}

// ── Create Stock Transfer ─────────────────────────────────────────────────────

const CreateStockTransferSchema = z.object({
  sourceType: z.literal("WAREHOUSE"),
  sourceId: z.string().min(1, "Source warehouse is required"),
  targetType: z.literal("WAREHOUSE"),
  targetId: z.string().min(1, "Target warehouse is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        quantity: z.number().int().positive("Quantity must be a positive number"),
      })
    )
    .min(1, "At least one product is required"),
});

export async function createStockTransferAction(
  data: z.infer<typeof CreateStockTransferSchema>
): Promise<{ error?: string }> {
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const parsed = CreateStockTransferSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { sourceType, sourceId, targetType, targetId, date, notes, status, items } = parsed.data;

  if (sourceId === targetId) {
    return { error: "Source and target warehouse cannot be the same" };
  }

  // Check per-product availability in the source warehouse before creating
  if (status === "SUBMITTED") {
    for (const item of items) {
      const available = await getWarehouseProductStock(prisma, sourceId, item.productId);
      if (available < item.quantity) {
        const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { name: true } });
        return {
          error: `Insufficient stock for "${product?.name ?? item.productId}" — ${available} available, ${item.quantity} requested`,
        };
      }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.stockTransfer.create({
        data: {
          referenceNumber: generateRefNumber("TR"),
          sourceType,
          sourceId,
          targetType,
          targetId,
          date: new Date(date),
          status,
          notes: notes || null,
          createdById: user.id,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
      });

      // WarehouseLocation.currentStock is adjusted at PACKED time (pick-pack flow), not here.
    });
  } catch (e) {
    console.error("createStockTransferAction error:", e);
    const msg = e instanceof Error ? e.message : "Failed to save — please check your data and try again";
    return { error: msg };
  }

  revalidatePath("/inventory/transfer");
  return {};
}

// ── Create Stock Adjustment ───────────────────────────────────────────────────

const CreateAdjustmentSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["DRAFT", "RECORDED"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        locationId: z.string().min(1, "Shelf is required"),
        quantityBefore: z.number().int().min(0, "Expected quantity must be 0 or more"),
        quantityAfter: z.number().int().min(0, "Actual quantity must be 0 or more"),
      })
    )
    .min(1, "At least one product is required"),
});

async function applyShelfAdjustment(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  items: { productId: string; locationId: string; quantityBefore: number; quantityAfter: number }[],
  invert = false,
) {
  for (const item of items) {
    const rawDelta = item.quantityAfter - item.quantityBefore;
    const delta = invert ? -rawDelta : rawDelta;
    if (delta === 0) continue;

    // Update ShelfProductStock: set the quantity directly rather than incrementing
    // so we don't drift if quantityBefore was already off.
    const targetQty = invert ? item.quantityBefore : item.quantityAfter;
    await tx.shelfProductStock.upsert({
      where: { locationId_productId: { locationId: item.locationId, productId: item.productId } },
      create: { locationId: item.locationId, productId: item.productId, quantity: Math.max(0, targetQty) },
      update: { quantity: Math.max(0, targetQty) },
    });

    // Update WarehouseLocation.currentStock and occupancyStatus
    const loc = await tx.warehouseLocation.findUnique({
      where: { id: item.locationId },
      select: { currentStock: true, maxCapacity: true },
    });
    const newStock = Math.max(0, (loc?.currentStock ?? 0) + delta);
    const isFull = loc?.maxCapacity != null && newStock >= loc.maxCapacity;
    await tx.warehouseLocation.update({
      where: { id: item.locationId },
      data: {
        currentStock: newStock,
        occupancyStatus: newStock === 0 ? "EMPTY" : isFull ? "FULL" : "PARTIAL",
      },
    });
  }
}

export async function createAdjustmentAction(
  data: z.infer<typeof CreateAdjustmentSchema>
): Promise<{ error?: string }> {
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const parsed = CreateAdjustmentSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { warehouseId, reason, notes, date, status, items } = parsed.data;

  // Validate every locationId belongs to this warehouse
  const locationIds = [...new Set(items.map((i) => i.locationId))];
  const locations = await prisma.warehouseLocation.findMany({
    where: { id: { in: locationIds } },
    select: { id: true, warehouseId: true },
  });
  if (locations.length !== locationIds.length)
    return { error: "One or more shelf locations not found" };
  if (locations.some((l) => l.warehouseId !== warehouseId))
    return { error: "One or more shelf locations belong to a different warehouse" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.stockAdjustment.create({
        data: {
          referenceNumber: generateRefNumber("SA"),
          warehouseId,
          reason,
          notes: notes || null,
          date: new Date(date),
          status,
          createdById: user.id,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              locationId: item.locationId,
              quantityBefore: item.quantityBefore,
              quantityAfter: item.quantityAfter,
            })),
          },
        },
      });
      if (status === "RECORDED") {
        // Update the materialized warehouse StockLevel balance
        await recordAdjustment(tx, warehouseId, items);
        // Also update the physical shelf records (WarehouseLocation + ShelfProductStock)
        await applyShelfAdjustment(tx, items);
      }
    });
  } catch (e) {
    console.error("createAdjustmentAction error:", e);
    return { error: "Failed to save — please check your data and try again" };
  }

  revalidatePath("/inventory/adjustment");
  return {};
}

// ── Reverse Stock Adjustment ──────────────────────────────────────────────────

export async function reverseAdjustmentAction(
  id: string,
  reason: string
): Promise<{ error?: string }> {
  try {
    await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const adj = await prisma.stockAdjustment.findUnique({
    where: { id },
    include: {
      items: { select: { productId: true, locationId: true, quantityBefore: true, quantityAfter: true } },
    },
  });
  if (!adj) return { error: "Adjustment not found" };
  if (adj.status === "REVERSED") return { error: "Adjustment is already reversed" };

  await prisma.$transaction(async (tx) => {
    await tx.stockAdjustment.update({
      where: { id },
      data: { status: "REVERSED", notes: reason.trim() || null },
    });
    if (adj.status === "RECORDED") {
      await reverseAdjustment(tx, adj.warehouseId, adj.items);
      // Reverse the shelf-level changes for items that had a shelf assigned
      const shelfItems = adj.items.filter(
        (i): i is typeof i & { locationId: string } => i.locationId != null
      );
      if (shelfItems.length > 0) {
        await applyShelfAdjustment(tx, shelfItems, true);
      }
    }
  });

  revalidatePath(`/inventory/adjustment/${id}`);
  revalidatePath("/inventory/adjustment");
  return {};
}

// ── Delete Stock Adjustment ───────────────────────────────────────────────────

export async function deleteAdjustmentAction(
  id: string
): Promise<{ error?: string }> {
  try {
    await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const adj = await prisma.stockAdjustment.findUnique({
    where: { id },
    include: {
      items: { select: { productId: true, quantityBefore: true, quantityAfter: true } },
    },
  });
  if (!adj) return { error: "Adjustment not found" };

  await prisma.$transaction(async (tx) => {
    if (adj.status === "RECORDED") {
      await reverseAdjustment(tx, adj.warehouseId, adj.items);
    }
    await tx.stockAdjustment.delete({ where: { id } });
  });

  revalidatePath("/inventory/adjustment");
  return {};
}

// ── Reverse Incoming Movement ─────────────────────────────────────────────────

export async function reverseIncomingMovementAction(
  id: string,
  reason: string
): Promise<{ error?: string }> {
  await requireAuth();

  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!movement || movement.type !== "INCOMING") return { error: "Movement not found" };
  if (movement.status === "REVERSED") return { error: "Movement is already reversed" };

  const wasCredited = movement.status === "RECEIVED" || movement.status === "SHELVED";

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.update({
      where: { id },
      data: { status: "REVERSED", remarks: reason.trim() || null },
    });
    if (wasCredited && movement.warehouseId) {
      await debitWarehouse(tx, movement.warehouseId, movement.items);
    }
  });

  revalidatePath(`/inventory/incoming/${id}`);
  revalidatePath("/inventory/incoming");
  return {};
}

// ── Delete Incoming Movement ──────────────────────────────────────────────────

export async function deleteIncomingMovementAction(
  id: string
): Promise<{ error?: string }> {
  await requireAuth();

  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!movement || movement.type !== "INCOMING") return { error: "Movement not found" };

  const wasCredited = movement.status === "RECEIVED" || movement.status === "SHELVED";

  await prisma.$transaction(async (tx) => {
    if (wasCredited && movement.warehouseId) {
      await debitWarehouse(tx, movement.warehouseId, movement.items);
    }
    await tx.stockMovement.delete({ where: { id } });
  });

  revalidatePath("/inventory/incoming");
  return {};
}

// ── Reverse Outgoing Movement ─────────────────────────────────────────────────

export async function reverseOutgoingMovementAction(
  id: string,
  reason: string
): Promise<{ error?: string }> {
  await requireAuth();

  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!movement || movement.type !== "OUTGOING") return { error: "Movement not found" };
  if (movement.status === "REVERSED") return { error: "Movement is already reversed" };

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.update({
      where: { id },
      data: { status: "REVERSED", remarks: reason.trim() || null },
    });

    // Undo any stock changes this movement made.
    if (movement.isAgentToAgentTransfer && movement.agentId && movement.toAgentId) {
      // Agent → agent was applied at create; reverse it.
      await transferAgentToAgent(tx, movement.toAgentId, movement.agentId, movement.items);
    } else if (movement.status === "SHELVED" && movement.warehouseId && movement.toAgentId) {
      // Warehouse → agent was applied at PACKED; undo both sides.
      await reverseWarehouseToAgent(tx, movement.warehouseId, movement.toAgentId, movement.items);
    }
  });

  revalidatePath(`/inventory/outgoing/${id}`);
  revalidatePath("/inventory/outgoing");
  return {};
}

// ── Delete Outgoing Movement ──────────────────────────────────────────────────

export async function deleteOutgoingMovementAction(
  id: string
): Promise<{ error?: string }> {
  await requireAuth();

  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!movement || movement.type !== "OUTGOING") return { error: "Movement not found" };

  await prisma.$transaction(async (tx) => {
    if (
      movement.status !== "REVERSED" &&
      movement.isAgentToAgentTransfer &&
      movement.agentId &&
      movement.toAgentId
    ) {
      await transferAgentToAgent(tx, movement.toAgentId, movement.agentId, movement.items);
    } else if (
      movement.status === "SHELVED" &&
      movement.warehouseId &&
      movement.toAgentId
    ) {
      await reverseWarehouseToAgent(tx, movement.warehouseId, movement.toAgentId, movement.items);
    }
    await tx.stockMovement.delete({ where: { id } });
  });

  revalidatePath("/inventory/outgoing");
  return {};
}

// ── Reverse Stock Transfer ────────────────────────────────────────────────────

export async function reverseStockTransferAction(
  id: string,
  reason: string
): Promise<{ error?: string }> {
  await requireAuth();

  const transfer = await prisma.stockTransfer.findUnique({
    where: { id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!transfer) return { error: "Transfer not found" };
  if (transfer.status === "REVERSED") return { error: "Transfer is already reversed" };

  const wasApplied = transfer.status === "COMPLETED";

  await prisma.$transaction(async (tx) => {
    await tx.stockTransfer.update({
      where: { id },
      data: { status: "REVERSED", notes: reason.trim() || null },
    });
    if (
      wasApplied &&
      transfer.sourceType === "WAREHOUSE" &&
      transfer.targetType === "WAREHOUSE"
    ) {
      // Reverse direction: target → source.
      await transferWarehouseToWarehouse(tx, transfer.targetId, transfer.sourceId, transfer.items);
    }
  });

  revalidatePath(`/inventory/transfer/${id}`);
  revalidatePath("/inventory/transfer");
  return {};
}

// ── Delete Stock Transfer ─────────────────────────────────────────────────────

export async function deleteStockTransferAction(
  id: string
): Promise<{ error?: string }> {
  await requireAuth();

  const transfer = await prisma.stockTransfer.findUnique({
    where: { id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!transfer) return { error: "Transfer not found" };

  await prisma.$transaction(async (tx) => {
    if (
      transfer.status === "COMPLETED" &&
      transfer.sourceType === "WAREHOUSE" &&
      transfer.targetType === "WAREHOUSE"
    ) {
      await transferWarehouseToWarehouse(tx, transfer.targetId, transfer.sourceId, transfer.items);
    }
    await tx.stockTransfer.delete({ where: { id } });
  });

  revalidatePath("/inventory/transfer");
  return {};
}

// ── Update Returned Movement ──────────────────────────────────────────────────

export async function updateReturnedMovementAction(
  id: string,
  damaged: boolean,
  remarks: string
): Promise<{ error?: string }> {
  await requireAuth();

  const movement = await prisma.stockMovement.findUnique({ where: { id } });
  if (!movement || movement.type !== "RETURN") return { error: "Movement not found" };

  await prisma.stockMovement.update({
    where: { id },
    data: { damaged, remarks: remarks.trim() || null },
  });

  revalidatePath(`/inventory/returned/${id}`);
  revalidatePath("/inventory/returned");
  return {};
}

// ── Delete Returned Movement ──────────────────────────────────────────────────

export async function deleteReturnedMovementAction(
  id: string
): Promise<{ error?: string }> {
  await requireAuth();

  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!movement || movement.type !== "RETURN") return { error: "Movement not found" };

  await prisma.$transaction(async (tx) => {
    if (movement.status !== "REVERSED" && movement.agentId) {
      await reverseReturn(tx, movement.agentId, movement.items, movement.warehouseId);
    }
    await tx.stockMovement.delete({ where: { id } });
  });

  revalidatePath("/inventory/returned");
  return {};
}

// ── Add Supplier ──────────────────────────────────────────────────────────────

const AddSupplierSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  phone1: z.string().min(5, "Phone number is required"),
  phone2: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
});

export async function addSupplierAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAuth();

  const raw = {
    supplierName: formData.get("supplierName") as string,
    phone1: formData.get("phone1") as string,
    phone2: (formData.get("phone2") as string) || undefined,
    state: (formData.get("state") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    country: (formData.get("country") as string) || undefined,
  };

  const parsed = AddSupplierSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await prisma.supplier.findUnique({ where: { phone1: parsed.data.phone1 } });
  if (existing) return { error: "A supplier with this phone number already exists" };

  await prisma.supplier.create({
    data: {
      name: parsed.data.supplierName,
      phone1: parsed.data.phone1,
      phone2: parsed.data.phone2 ?? null,
      state: parsed.data.state ?? null,
      address: parsed.data.address ?? null,
      country: parsed.data.country ?? null,
    },
  });

  revalidatePath("/inventory/stock");
  redirect("/inventory/stock");
}

// ── Add Agent ─────────────────────────────────────────────────────────────────

const AddAgentSchema = z.object({
  companyAgentName: z.string().min(1, "Company/Agent name is required"),
  phone1: z.string().min(5, "Phone 1 is required"),
  phone2: z.string().optional(),
  phone3: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  picksFromOffice: z.enum(["yes", "no"]).default("no"),
  country: z.string().optional(),
  statesCovered: z.string().optional(),
  deliveryFee: z.string().optional(),
});

export async function addAgentAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await requireAuth();

  const raw = {
    companyAgentName: formData.get("companyAgentName") as string,
    phone1: formData.get("phone1") as string,
    phone2: (formData.get("phone2") as string) || undefined,
    phone3: (formData.get("phone3") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    status: ((formData.get("status") as string) || "ACTIVE").toUpperCase() as "ACTIVE" | "INACTIVE",
    picksFromOffice: ((formData.get("picksFromOffice") as string) || "no") as "yes" | "no",
    country: (formData.get("country") as string) || undefined,
    statesCovered: (formData.get("statesCovered") as string) || undefined,
    deliveryFee: (formData.get("deliveryFee") as string) || undefined,
  };

  const parsed = AddAgentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await prisma.agent.findUnique({ where: { phone1: parsed.data.phone1 } });
  if (existing) return { error: "An agent with this phone number already exists" };

  const statesArray = parsed.data.statesCovered
    ? parsed.data.statesCovered.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  await prisma.agent.create({
    data: {
      companyName: parsed.data.companyAgentName,
      phone1: parsed.data.phone1,
      phone2: parsed.data.phone2 ?? null,
      phone3: parsed.data.phone3 ?? null,
      address: parsed.data.address ?? null,
      status: parsed.data.status,
      picksFromOfficeStock: parsed.data.picksFromOffice === "yes",
      country: parsed.data.country ?? null,
      statesCovered: statesArray.length > 0 ? statesArray : undefined,
      deliveryFee: parsed.data.deliveryFee ? parseFloat(parsed.data.deliveryFee) : null,
      addedById: user.id,
    },
  });

  revalidatePath("/inventory/stock");
  redirect("/inventory/stock");
}

// ── Add Warehouse ─────────────────────────────────────────────────────────────

const AddWarehouseSchema = z.object({
  warehouseName: z.string().min(1, "Warehouse name is required"),
  warehouseAddress: z.string().optional(),
  warehousePhone: z.string().optional(),
  warehouseEmail: z.string().email("Invalid email").or(z.literal("")).optional(),
  referenceCode: z.string().optional(),
  country: z.string().optional(),
});

export async function addWarehouseAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAuth();

  const raw = {
    warehouseName: formData.get("warehouseName") as string,
    warehouseAddress: (formData.get("warehouseAddress") as string) || undefined,
    warehousePhone: (formData.get("warehousePhone") as string) || undefined,
    warehouseEmail: (formData.get("warehouseEmail") as string) || "",
    referenceCode: (formData.get("referenceCode") as string) || undefined,
    country: (formData.get("country") as string) || undefined,
  };

  const parsed = AddWarehouseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Resolve reference code: use provided value or auto-generate a guaranteed-unique one.
  // A null unique index on Postgres 15+ (NULLS NOT DISTINCT) treats multiple NULLs as duplicates,
  // so we must never store null here.
  let referenceCode = parsed.data.referenceCode?.trim() || null;
  if (referenceCode) {
    const existing = await prisma.warehouse.findUnique({ where: { referenceCode } });
    if (existing) return { error: "A warehouse with this reference code already exists" };
  } else {
    referenceCode = generateRefNumber("WH");
  }

  await prisma.warehouse.create({
    data: {
      name: parsed.data.warehouseName,
      address: parsed.data.warehouseAddress ?? null,
      phone: parsed.data.warehousePhone ?? null,
      email: parsed.data.warehouseEmail || null,
      referenceCode,
      country: parsed.data.country ?? null,
    },
  });

  revalidatePath("/inventory/stock");
  redirect("/inventory/stock");
}

// ── Add Product Category ──────────────────────────────────────────────────────

const AddProductCategorySchema = z.object({
  categoryName: z.string().min(1, "Category name is required"),
  brandName: z.string().min(1, "Brand name is required"),
  brandPhoneNumber: z.string().optional(),
  brandWhatsappNumber: z.string().optional(),
  brandEmail: z.string().email("Invalid brand email").or(z.literal("")).optional(),
  smsSenderId: z.string().optional(),
});

export async function addProductCategoryAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAuth();

  const raw = {
    categoryName: formData.get("categoryName") as string,
    brandName: formData.get("brandName") as string,
    brandPhoneNumber: (formData.get("brandPhoneNumber") as string) || undefined,
    brandWhatsappNumber: (formData.get("brandWhatsappNumber") as string) || undefined,
    brandEmail: (formData.get("brandEmail") as string) || "",
    smsSenderId: (formData.get("smsSenderId") as string) || undefined,
  };

  const parsed = AddProductCategorySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.productCategory.create({
    data: {
      categoryName: parsed.data.categoryName,
      brandName: parsed.data.brandName,
      brandPhone: parsed.data.brandPhoneNumber ?? null,
      brandWhatsappNumber: parsed.data.brandWhatsappNumber ?? null,
      brandEmail: parsed.data.brandEmail || null,
      smsSenderId: parsed.data.smsSenderId ?? null,
    },
  });

  revalidatePath("/inventory/stock");
  redirect("/inventory/stock");
}

// ── Add Product ───────────────────────────────────────────────────────────────

const AddProductSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  productDescription: z.string().optional(),
  categoryId: z.string().min(1, "Product category is required"),
  country: z.string().optional(),
  hasVariations: z.enum(["Yes", "No"]).default("No"),
  hasOffer: z.enum(["Yes", "No"]).default("No"),
  displayText: z.string().optional(),
  fileDownloadLink: z.string().url("Invalid URL").or(z.literal("")).optional(),
  lowStockAgents: z.string().optional(),
  lowStockTotal: z.string().optional(),
  alertEmails: z.string().optional(),
  costPrice: z.string().min(1, "Cost price is required"),
  sellingPrice: z.string().min(1, "Selling price is required"),
  unit: z.string().optional(),
  imageUrl: z.string().optional(),
  quantity: z.string().optional(),
  // Offer fields
  offerName: z.string().optional(),
  offerSellingPrice: z.string().optional(),
  offerQuantity: z.string().optional(),
  offerUnit: z.string().optional(),
  offerRecurring: z.string().optional(),
  showQuantityAndUnit: z.string().optional(),
});

function extractCombosAndGifts(formData: FormData) {
  const comboProductIds = formData.getAll("comboProductId") as string[];
  const comboQuantities = formData.getAll("comboQuantity") as string[];
  const giftProductIds = formData.getAll("giftProductId") as string[];
  const giftQuantities = formData.getAll("giftQuantity") as string[];

  const validCombos = comboProductIds
    .map((pid, i) => ({ productId: pid, quantity: parseInt(comboQuantities[i] || "0", 10) }))
    .filter((c) => c.productId && c.quantity > 0);

  const validGifts = giftProductIds
    .map((pid, i) => ({ productId: pid, quantity: parseInt(giftQuantities[i] || "0", 10) }))
    .filter((g) => g.productId && g.quantity > 0);

  return { validCombos, validGifts };
}

export async function addProductAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAuth();

  const raw = {
    productName: formData.get("productName") as string,
    productDescription: (formData.get("productDescription") as string) || undefined,
    categoryId: formData.get("categoryId") as string,
    country: (formData.get("country") as string) || undefined,
    hasVariations: ((formData.get("hasVariations") as string) || "No") as "Yes" | "No",
    hasOffer: ((formData.get("hasOffer") as string) || "No") as "Yes" | "No",
    displayText: (formData.get("displayText") as string) || undefined,
    fileDownloadLink: (formData.get("fileDownloadLink") as string) || "",
    lowStockAgents: (formData.get("lowStockAgents") as string) || undefined,
    lowStockTotal: (formData.get("lowStockTotal") as string) || undefined,
    alertEmails: (formData.get("alertEmails") as string) || undefined,
    costPrice: formData.get("costPrice") as string,
    sellingPrice: formData.get("sellingPrice") as string,
    unit: (formData.get("unit") as string) || undefined,
    imageUrl: (formData.get("imageUrl") as string) || undefined,
    quantity: (formData.get("quantity") as string) || undefined,
    // Offer fields
    offerName: (formData.get("offerName") as string) || undefined,
    offerSellingPrice: (formData.get("offerSellingPrice") as string) || undefined,
    offerQuantity: (formData.get("offerQuantity") as string) || undefined,
    offerUnit: (formData.get("offerUnit") as string) || undefined,
    offerRecurring: (formData.get("offerRecurring") as string) || undefined,
    showQuantityAndUnit: (formData.get("showQuantityAndUnit") as string) || undefined,
  };

  const parsed = AddProductSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const categoryExists = await prisma.productCategory.findUnique({ where: { id: parsed.data.categoryId } });
  if (!categoryExists) return { error: "Selected category does not exist" };

  const sku = generateSku(parsed.data.productName);
  const { validCombos, validGifts } = extractCombosAndGifts(formData);

  const product = await prisma.product.create({
    data: {
      name: parsed.data.productName,
      description: parsed.data.productDescription ?? null,
      categoryId: parsed.data.categoryId,
      country: parsed.data.country ?? null,
      hasVariations: parsed.data.hasVariations === "Yes",
      hasOffer: parsed.data.hasOffer === "Yes",
      displayText: parsed.data.displayText ?? null,
      fileDownloadLink: parsed.data.fileDownloadLink || null,
      lowStockAlertQtyAgent: parsed.data.lowStockAgents ? parseInt(parsed.data.lowStockAgents, 10) : null,
      lowStockAlertQtyTotal: parsed.data.lowStockTotal ? parseInt(parsed.data.lowStockTotal, 10) : null,
      alertEmails: parsed.data.alertEmails ?? null,
      costPrice: parseFloat(parsed.data.costPrice),
      sellingPrice: parseFloat(parsed.data.sellingPrice),
      unit: parsed.data.unit ?? null,
      imageUrl: parsed.data.imageUrl || null,
      quantity: parsed.data.quantity ? parseInt(parsed.data.quantity, 10) : 0,
      sku,
    },
  });

  if (parsed.data.hasOffer === "Yes" && parsed.data.offerName) {
    await prisma.productOffer.create({
      data: {
        productId: product.id,
        offerName: parsed.data.offerName,
        offerQuantity: parseInt(parsed.data.offerQuantity || "0", 10),
        offerUnit: parsed.data.offerUnit || "Unit",
        recurring: parsed.data.offerRecurring || null,
        sellingPrice: parseFloat(parsed.data.offerSellingPrice || "0"),
        showQuantityAndUnit: parsed.data.showQuantityAndUnit === "true",
      },
    });

    if (validCombos.length > 0) {
      await prisma.productCombo.createMany({
        data: validCombos.map((c) => ({
          productId: product.id,
          comboProductId: c.productId,
          quantity: c.quantity,
        })),
      });
    }

    if (validGifts.length > 0) {
      await prisma.productGift.createMany({
        data: validGifts.map((g) => ({
          productId: product.id,
          giftProductId: g.productId,
          quantity: g.quantity,
        })),
      });
    }
  }

  revalidatePath("/inventory/stock");
  redirect("/inventory/stock");
}

export async function updateProductAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAuth();

  const id = formData.get("id") as string;
  if (!id) return { error: "Product ID is required" };

  const raw = {
    productName: formData.get("productName") as string,
    productDescription: (formData.get("productDescription") as string) || undefined,
    categoryId: formData.get("categoryId") as string,
    country: (formData.get("country") as string) || undefined,
    hasVariations: ((formData.get("hasVariations") as string) || "No") as "Yes" | "No",
    hasOffer: ((formData.get("hasOffer") as string) || "No") as "Yes" | "No",
    displayText: (formData.get("displayText") as string) || undefined,
    fileDownloadLink: (formData.get("fileDownloadLink") as string) || "",
    lowStockAgents: (formData.get("lowStockAgents") as string) || undefined,
    lowStockTotal: (formData.get("lowStockTotal") as string) || undefined,
    alertEmails: (formData.get("alertEmails") as string) || undefined,
    costPrice: formData.get("costPrice") as string,
    sellingPrice: formData.get("sellingPrice") as string,
    unit: (formData.get("unit") as string) || undefined,
    imageUrl: (formData.get("imageUrl") as string) || undefined,
    quantity: (formData.get("quantity") as string) || undefined,
    // Offer fields
    offerName: (formData.get("offerName") as string) || undefined,
    offerSellingPrice: (formData.get("offerSellingPrice") as string) || undefined,
    offerQuantity: (formData.get("offerQuantity") as string) || undefined,
    offerUnit: (formData.get("offerUnit") as string) || undefined,
    offerRecurring: (formData.get("offerRecurring") as string) || undefined,
    showQuantityAndUnit: (formData.get("showQuantityAndUnit") as string) || undefined,
  };

  const parsed = AddProductSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const categoryExists = await prisma.productCategory.findUnique({ where: { id: parsed.data.categoryId } });
  if (!categoryExists) return { error: "Selected category does not exist" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: parsed.data.productName,
          description: parsed.data.productDescription ?? null,
          categoryId: parsed.data.categoryId,
          country: parsed.data.country ?? null,
          hasVariations: parsed.data.hasVariations === "Yes",
          hasOffer: parsed.data.hasOffer === "Yes",
          displayText: parsed.data.displayText ?? null,
          fileDownloadLink: parsed.data.fileDownloadLink || null,
          lowStockAlertQtyAgent: parsed.data.lowStockAgents ? parseInt(parsed.data.lowStockAgents, 10) : null,
          lowStockAlertQtyTotal: parsed.data.lowStockTotal ? parseInt(parsed.data.lowStockTotal, 10) : null,
          alertEmails: parsed.data.alertEmails ?? null,
          costPrice: parseFloat(parsed.data.costPrice),
          sellingPrice: parseFloat(parsed.data.sellingPrice),
          unit: parsed.data.unit ?? null,
          imageUrl: parsed.data.imageUrl || null,
          quantity: parsed.data.quantity ? parseInt(parsed.data.quantity, 10) : 0,
        },
      });

      // Handle offer update
      if (parsed.data.hasOffer === "Yes" && parsed.data.offerName) {
        const offerData = {
          offerName: parsed.data.offerName,
          offerQuantity: parseInt(parsed.data.offerQuantity || "0", 10),
          offerUnit: parsed.data.offerUnit || "Unit",
          recurring: parsed.data.offerRecurring || null,
          sellingPrice: parseFloat(parsed.data.offerSellingPrice || "0"),
          showQuantityAndUnit: parsed.data.showQuantityAndUnit === "true",
        };

        const existingOffer = await tx.productOffer.findFirst({ where: { productId: id } });
        if (existingOffer) {
          await tx.productOffer.update({ where: { id: existingOffer.id }, data: offerData });
        } else {
          await tx.productOffer.create({ data: { ...offerData, productId: id } });
        }

        // Replace combo products
        const { validCombos, validGifts } = extractCombosAndGifts(formData);
        await tx.productCombo.deleteMany({ where: { productId: id } });
        if (validCombos.length > 0) {
          await tx.productCombo.createMany({
            data: validCombos.map((c) => ({
              productId: id,
              comboProductId: c.productId,
              quantity: c.quantity,
            })),
          });
        }

        // Replace gift products
        await tx.productGift.deleteMany({ where: { productId: id } });
        if (validGifts.length > 0) {
          await tx.productGift.createMany({
            data: validGifts.map((g) => ({
              productId: id,
              giftProductId: g.productId,
              quantity: g.quantity,
            })),
          });
        }
      } else {
        // hasOffer is No — clear everything
        await tx.productOffer.deleteMany({ where: { productId: id } });
        await tx.productCombo.deleteMany({ where: { productId: id } });
        await tx.productGift.deleteMany({ where: { productId: id } });
      }
    });

    revalidatePath("/inventory/stock");
    revalidatePath(`/inventory/stock/product/${id}`);
    redirect("/inventory/stock");
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    console.error("updateProductAction error:", e);
    return { error: "Failed to update product" };
  }
}

// ── Update Warehouse ──────────────────────────────────────────────────────────

const UpdateWarehouseSchema = z.object({
  warehouseName: z.string().min(1, "Warehouse name is required"),
  warehouseAddress: z.string().optional(),
  warehousePhone: z.string().optional(),
  warehouseEmail: z.string().email("Invalid email").or(z.literal("")).optional(),
  referenceCode: z.string().optional(),
  country: z.string().optional(),
});

export async function updateWarehouseAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAuth();

  const id = formData.get("id") as string;
  if (!id) return { error: "Warehouse ID is required" };

  const raw = {
    warehouseName: formData.get("warehouseName") as string,
    warehouseAddress: (formData.get("warehouseAddress") as string) || undefined,
    warehousePhone: (formData.get("warehousePhone") as string) || undefined,
    warehouseEmail: (formData.get("warehouseEmail") as string) || "",
    referenceCode: (formData.get("referenceCode") as string) || undefined,
    country: (formData.get("country") as string) || undefined,
  };

  const parsed = UpdateWarehouseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Resolve reference code — never store null (Postgres 15 NULLS NOT DISTINCT)
  let referenceCode = parsed.data.referenceCode?.trim() || null;
  if (referenceCode) {
    const conflict = await prisma.warehouse.findFirst({
      where: { referenceCode, NOT: { id } },
    });
    if (conflict) return { error: "A warehouse with this reference code already exists" };
  } else {
    // Keep the existing code rather than auto-generating a new one on update
    const existing = await prisma.warehouse.findUnique({ where: { id }, select: { referenceCode: true } });
    referenceCode = existing?.referenceCode ?? generateRefNumber("WH");
  }

  try {
    await prisma.warehouse.update({
      where: { id },
      data: {
        name: parsed.data.warehouseName,
        address: parsed.data.warehouseAddress ?? null,
        phone: parsed.data.warehousePhone ?? null,
        email: parsed.data.warehouseEmail || null,
        referenceCode,
        country: parsed.data.country ?? null,
      },
    });
  } catch (e) {
    console.error("updateWarehouseAction error:", e);
    return { error: "Failed to update warehouse" };
  }

  revalidatePath("/inventory/stock");
  revalidatePath(`/inventory/stock/warehouse/${id}`);
  redirect(`/inventory/stock/warehouse/${id}`);
}

// ── Update Supplier ───────────────────────────────────────────────────────────

const UpdateSupplierSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  phone1: z.string().min(5, "Phone number is required"),
  phone2: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
});

export async function updateSupplierAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAuth();

  const id = formData.get("id") as string;
  if (!id) return { error: "Supplier ID is required" };

  const raw = {
    supplierName: formData.get("supplierName") as string,
    phone1: formData.get("phone1") as string,
    phone2: (formData.get("phone2") as string) || undefined,
    state: (formData.get("state") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    country: (formData.get("country") as string) || undefined,
  };

  const parsed = UpdateSupplierSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Check phone uniqueness excluding this record
  const conflict = await prisma.supplier.findFirst({
    where: { phone1: parsed.data.phone1, NOT: { id } },
  });
  if (conflict) return { error: "Another supplier already uses this phone number" };

  try {
    await prisma.supplier.update({
      where: { id },
      data: {
        name: parsed.data.supplierName,
        phone1: parsed.data.phone1,
        phone2: parsed.data.phone2 ?? null,
        state: parsed.data.state ?? null,
        address: parsed.data.address ?? null,
        country: parsed.data.country ?? null,
      },
    });
  } catch (e) {
    console.error("updateSupplierAction error:", e);
    return { error: "Failed to update supplier" };
  }

  revalidatePath("/inventory/stock");
  revalidatePath(`/inventory/stock/supplier/${id}`);
  redirect(`/inventory/stock/supplier/${id}`);
}

// ── Update Product Category ───────────────────────────────────────────────────

const UpdateProductCategorySchema = z.object({
  categoryName: z.string().min(1, "Category name is required"),
  brandName: z.string().min(1, "Brand name is required"),
  brandPhoneNumber: z.string().optional(),
  brandWhatsappNumber: z.string().optional(),
  brandEmail: z.string().email("Invalid brand email").or(z.literal("")).optional(),
  smsSenderId: z.string().optional(),
});

export async function updateProductCategoryAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAuth();

  const id = formData.get("id") as string;
  if (!id) return { error: "Category ID is required" };

  const raw = {
    categoryName: formData.get("categoryName") as string,
    brandName: formData.get("brandName") as string,
    brandPhoneNumber: (formData.get("brandPhoneNumber") as string) || undefined,
    brandWhatsappNumber: (formData.get("brandWhatsappNumber") as string) || undefined,
    brandEmail: (formData.get("brandEmail") as string) || "",
    smsSenderId: (formData.get("smsSenderId") as string) || undefined,
  };

  const parsed = UpdateProductCategorySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await prisma.productCategory.update({
      where: { id },
      data: {
        categoryName: parsed.data.categoryName,
        brandName: parsed.data.brandName,
        brandPhone: parsed.data.brandPhoneNumber ?? null,
        brandWhatsappNumber: parsed.data.brandWhatsappNumber ?? null,
        brandEmail: parsed.data.brandEmail || null,
        smsSenderId: parsed.data.smsSenderId ?? null,
      },
    });
  } catch (e) {
    console.error("updateProductCategoryAction error:", e);
    return { error: "Failed to update category" };
  }

  revalidatePath("/inventory/stock");
  revalidatePath(`/inventory/stock/category/${id}`);
  redirect(`/inventory/stock/category/${id}`);
}

// ── Soft Deletes ──────────────────────────────────────────────────────────────

export async function deleteWarehouseAction(id: string): Promise<{ error?: string }> {
  await requireAuth();
  try {
    await prisma.warehouse.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (e) {
    return { error: "Failed to delete warehouse" };
  }
  revalidatePath("/inventory/stock");
  return {};
}

export async function deleteProductCategoryAction(id: string): Promise<{ error?: string }> {
  await requireAuth();
  try {
    await prisma.productCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (e) {
    return { error: "Failed to delete category" };
  }
  revalidatePath("/inventory/stock");
  return {};
}

export async function deleteProductAction(id: string): Promise<{ error?: string }> {
  await requireAuth();
  try {
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (e) {
    return { error: "Failed to delete product" };
  }
  revalidatePath("/inventory/stock");
  return {};
}

export async function deleteSupplierAction(id: string): Promise<{ error?: string }> {
  await requireAuth();
  try {
    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (e) {
    return { error: "Failed to delete supplier" };
  }
  revalidatePath("/inventory/stock");
  return {};
}

export async function deleteAgentAction(id: string): Promise<{ error?: string }> {
  await requireAuth();
  try {
    await prisma.agent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (e) {
    return { error: "Failed to delete agent" };
  }
  revalidatePath("/inventory/stock");
  return {};
}
