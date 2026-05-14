"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

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

  await prisma.stockMovement.create({
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

  const movement = await prisma.stockMovement.findUnique({ where: { id } });
  if (!movement || movement.type !== "INCOMING") return { error: "Movement not found" };
  if (movement.warehouseId !== warehouseId) return { error: "Access denied" };

  await prisma.stockMovement.delete({ where: { id } });

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

  const movement = await prisma.stockMovement.findUnique({ where: { id } });
  if (!movement || movement.type !== "INCOMING") return { error: "Movement not found" };
  if (movement.warehouseId !== warehouseId) return { error: "Access denied" };
  if (movement.status === "REVERSED") return { error: "Movement is already reversed" };

  await prisma.stockMovement.update({
    where: { id },
    data: { status: "REVERSED", remarks: reason.trim() || null },
  });

  revalidatePath(`/warehouse/incoming-goods/${id}`);
  revalidatePath("/warehouse/incoming-goods");
  return {};
}
