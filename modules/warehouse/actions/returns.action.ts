"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  recordReturn,
  reverseReturn,
  creditShelfProducts,
  debitShelfProducts,
} from "@/modules/inventory/services/stock-level.service";
import {
  getAgentProductStocks,
  type AgentProductStock,
} from "@/modules/warehouse/services/warehouse.service";

function generateReferenceNumber(): string {
  const suffix = Date.now().toString(36).toUpperCase().slice(-6);
  return `RS-${suffix}`;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

async function requireWarehouseManager() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!session.user.warehouseId) throw new Error("No warehouse assigned to your account");
  return { userId: session.user.id, warehouseId: session.user.warehouseId as string };
}

// ── Agent stock lookup (called by client when agent changes) ──────────────────

export async function getAgentStocksAction(agentId: string): Promise<AgentProductStock[]> {
  try {
    await requireAuth();
    return getAgentProductStocks(agentId);
  } catch {
    return [];
  }
}

// ── Create Return ─────────────────────────────────────────────────────────────

const ProductItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive("Quantity must be a positive number"),
});

const ShelfAssignmentSchema = z.object({
  productId: z.string().min(1),
  locationId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

const CreateReturnSchema = z.object({
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  date: z.string().min(1, "Date is required"),
  agentId: z.string().min(1, "Agent is required"),
  damaged: z.boolean().default(false),
  remarks: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(ProductItemSchema).min(1, "At least one product is required"),
  shelfAssignments: z.array(ShelfAssignmentSchema).min(1, "Shelf assignments are required"),
});

export async function createReturnMovementAction(
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
  let shelfAssignments: Array<{ productId: string; locationId: string; quantity: number }> = [];
  try {
    items = JSON.parse(formData.get("items") as string);
    shelfAssignments = JSON.parse(formData.get("shelfAssignments") as string);
  } catch {
    return { error: "Invalid submission data" };
  }

  const raw = {
    state: formData.get("state") as string,
    country: formData.get("country") as string,
    date: formData.get("date") as string,
    agentId: formData.get("agentId") as string,
    damaged: formData.get("damaged") === "true",
    remarks: (formData.get("remarks") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
    items,
    shelfAssignments,
  };

  const parsed = CreateReturnSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const agent = await prisma.agent.findUnique({ where: { id: parsed.data.agentId } });
  if (!agent) return { error: "Selected agent not found" };

  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
    select: { id: true, sku: true, name: true },
  });
  if (products.length !== productIds.length) return { error: "One or more products not found" };

  // Validate shelf locations belong to this warehouse
  const locationIds = [...new Set(parsed.data.shelfAssignments.map((e) => e.locationId))];
  const locations = await prisma.warehouseLocation.findMany({
    where: { id: { in: locationIds } },
    select: { id: true, warehouseId: true },
  });
  if (locations.length !== locationIds.length) return { error: "One or more shelf locations not found" };
  if (locations.some((l) => l.warehouseId !== warehouseId)) {
    return { error: "One or more shelf locations belong to a different warehouse" };
  }

  // Validate shelf assignment quantities exactly match item quantities
  const requiredMap = new Map(parsed.data.items.map((i) => [i.productId, i.quantity]));
  const assignedMap = new Map<string, number>();
  for (const a of parsed.data.shelfAssignments) {
    assignedMap.set(a.productId, (assignedMap.get(a.productId) ?? 0) + a.quantity);
  }
  for (const [productId, required] of requiredMap) {
    const assigned = assignedMap.get(productId) ?? 0;
    if (assigned !== required) {
      const p = products.find((x) => x.id === productId);
      return {
        error: `Shelf assignment for "${p?.name ?? productId}" covers ${assigned} but item quantity is ${required}`,
      };
    }
  }

  const skuMap = new Map(products.map((p) => [p.id, p.sku]));
  const totalQty = parsed.data.items.reduce((sum, i) => sum + i.quantity, 0);

  try {
    await prisma.$transaction(async (tx) => {
      // Validate agent has sufficient stock for each item
      for (const item of parsed.data.items) {
        const stockRow = await tx.stockLevel.findUnique({
          where: {
            productId_locationKind_locationId: {
              productId: item.productId,
              locationKind: "AGENT",
              locationId: parsed.data.agentId,
            },
          },
          select: { quantity: true },
        });
        const available = Math.max(0, stockRow?.quantity ?? 0);
        if (available < item.quantity) {
          const p = products.find((x) => x.id === item.productId);
          throw new Error(
            `Agent only has ${available} unit(s) of "${p?.name ?? item.productId}" in stock, but ${item.quantity} requested`
          );
        }
      }

      await tx.stockMovement.create({
        data: {
          referenceNumber: generateReferenceNumber(),
          type: "RETURN",
          status: "RECORDED",
          agentId: parsed.data.agentId,
          warehouseId,
          state: parsed.data.state,
          country: parsed.data.country,
          date: new Date(parsed.data.date),
          damaged: parsed.data.damaged,
          remarks: parsed.data.remarks ?? null,
          notes: parsed.data.notes ?? null,
          quantity: totalQty,
          shelfLocationId: parsed.data.shelfAssignments[0]?.locationId ?? null,
          shelfAssignments: parsed.data.shelfAssignments as object[],
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

      // Credit each shelf bin: update currentStock and occupancyStatus
      const qtyByLocation = new Map<string, number>();
      for (const e of parsed.data.shelfAssignments) {
        qtyByLocation.set(e.locationId, (qtyByLocation.get(e.locationId) ?? 0) + e.quantity);
      }
      for (const [locationId, qty] of qtyByLocation) {
        const loc = await tx.warehouseLocation.findUnique({
          where: { id: locationId },
          select: { currentStock: true, maxCapacity: true },
        });
        const newStock = (loc?.currentStock ?? 0) + qty;
        const isFull = loc?.maxCapacity != null && newStock >= loc.maxCapacity;
        await tx.warehouseLocation.update({
          where: { id: locationId },
          data: {
            currentStock: { increment: qty },
            occupancyStatus: isFull ? "FULL" : "PARTIAL",
          },
        });
      }

      // Credit per-product per-shelf stock
      await creditShelfProducts(
        tx,
        parsed.data.shelfAssignments.map((e) => ({
          locationId: e.locationId,
          productId: e.productId,
          quantity: e.quantity,
        }))
      );

      // Debit agent stock, credit warehouse stock level
      await recordReturn(tx, parsed.data.agentId, parsed.data.items, warehouseId);
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath("/warehouse/returns");
  redirect("/warehouse/returns");
}

// ── Delete Return ─────────────────────────────────────────────────────────────

type StoredShelfAssignment = { productId: string; locationId: string; quantity: number };

export async function deleteReturnMovementAction(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!movement || movement.type !== "RETURN") return { error: "Movement not found" };

  let storedAssignments: StoredShelfAssignment[] = [];
  if (movement.shelfAssignments) {
    try {
      storedAssignments = movement.shelfAssignments as StoredShelfAssignment[];
    } catch {}
  }

  await prisma.$transaction(async (tx) => {
    if (movement.status !== "REVERSED") {
      if (storedAssignments.length > 0) {
        const qtyByLocation = new Map<string, number>();
        for (const e of storedAssignments) {
          qtyByLocation.set(e.locationId, (qtyByLocation.get(e.locationId) ?? 0) + e.quantity);
        }
        for (const [locationId, qty] of qtyByLocation) {
          const loc = await tx.warehouseLocation.findUnique({
            where: { id: locationId },
            select: { currentStock: true },
          });
          const newStock = Math.max(0, (loc?.currentStock ?? 0) - qty);
          await tx.warehouseLocation.update({
            where: { id: locationId },
            data: { currentStock: newStock, ...(newStock === 0 ? { occupancyStatus: "EMPTY" } : {}) },
          });
        }
        await debitShelfProducts(
          tx,
          storedAssignments.map((e) => ({
            locationId: e.locationId,
            productId: e.productId,
            quantity: e.quantity,
          }))
        );
      }
      if (movement.agentId) {
        await reverseReturn(tx, movement.agentId, movement.items, movement.warehouseId);
      }
    }
    await tx.stockMovement.delete({ where: { id } });
  });

  revalidatePath("/warehouse/returns");
  redirect("/warehouse/returns");
}

// ── Reverse Return ────────────────────────────────────────────────────────────

export async function reverseReturnMovementAction(
  id: string,
  reason: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!movement || movement.type !== "RETURN") return { error: "Movement not found" };
  if (movement.status === "REVERSED") return { error: "Movement is already reversed" };

  let storedAssignments: StoredShelfAssignment[] = [];
  if (movement.shelfAssignments) {
    try {
      storedAssignments = movement.shelfAssignments as StoredShelfAssignment[];
    } catch {}
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.update({
      where: { id },
      data: { status: "REVERSED", remarks: reason.trim() || null },
    });

    if (storedAssignments.length > 0) {
      const qtyByLocation = new Map<string, number>();
      for (const e of storedAssignments) {
        qtyByLocation.set(e.locationId, (qtyByLocation.get(e.locationId) ?? 0) + e.quantity);
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
      await debitShelfProducts(
        tx,
        storedAssignments.map((e) => ({
          locationId: e.locationId,
          productId: e.productId,
          quantity: e.quantity,
        }))
      );
    }

    if (movement.agentId) {
      await reverseReturn(tx, movement.agentId, movement.items, movement.warehouseId);
    }
  });

  revalidatePath(`/warehouse/returns/${id}`);
  revalidatePath("/warehouse/returns");
  return {};
}
