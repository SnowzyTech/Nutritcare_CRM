"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordReturn, reverseReturn } from "@/modules/inventory/services/stock-level.service";

function generateReferenceNumber(): string {
  const suffix = Date.now().toString(36).toUpperCase().slice(-6);
  return `RS-${suffix}`;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

// ── Create Return ─────────────────────────────────────────────────────────────

const ProductItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive("Quantity must be a positive number"),
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
});

export async function createReturnMovementAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await requireAuth();

  let items: Array<{ productId: string; quantity: number }> = [];
  try {
    items = JSON.parse(formData.get("items") as string);
  } catch {
    return { error: "Invalid product data" };
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
  };

  const parsed = CreateReturnSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const agent = await prisma.agent.findUnique({ where: { id: parsed.data.agentId } });
  if (!agent) return { error: "Selected agent not found" };

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
        type: "RETURN",
        status: "RECORDED",
        agentId: parsed.data.agentId,
        state: parsed.data.state,
        country: parsed.data.country,
        date: new Date(parsed.data.date),
        damaged: parsed.data.damaged,
        remarks: parsed.data.remarks ?? null,
        notes: parsed.data.notes ?? null,
        quantity: totalQty,
        createdById: user.id,
        items: {
          create: parsed.data.items.map((item) => ({
            productId: item.productId,
            productCode: skuMap.get(item.productId) ?? "",
            quantity: item.quantity,
          })),
        },
      },
    });

    // Returns are credited at create — they take stock from the agent and put
    // it back into circulation (UNASSIGNED bucket since no warehouseId here).
    await recordReturn(tx, parsed.data.agentId, parsed.data.items);
  });

  revalidatePath("/warehouse/returns");
  redirect("/warehouse/returns");
}

// ── Delete Return ─────────────────────────────────────────────────────────────

export async function deleteReturnMovementAction(
  id: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

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

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.update({
      where: { id },
      data: { status: "REVERSED", remarks: reason.trim() || null },
    });
    if (movement.agentId) {
      await reverseReturn(tx, movement.agentId, movement.items, movement.warehouseId);
    }
  });

  revalidatePath(`/warehouse/returns/${id}`);
  revalidatePath("/warehouse/returns");
  return {};
}
