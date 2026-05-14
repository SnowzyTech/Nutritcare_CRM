"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

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

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  try {
    await prisma.$transaction(async (tx) => {
      if (!isAgentToAgentTransfer && shelfLocationId) {
        const shelf = await tx.warehouseLocation.findUnique({ where: { id: shelfLocationId } });
        if (!shelf) throw new Error("Shelf location not found");
        if (shelf.currentStock < totalQty) {
          throw new Error(
            `Insufficient stock on shelf "${shelf.locationCode}" (${shelf.currentStock} available, ${totalQty} required)`
          );
        }
        await tx.warehouseLocation.update({
          where: { id: shelfLocationId },
          data: { currentStock: { decrement: totalQty } },
        });
      }

      await tx.stockMovement.create({
        data: {
          referenceNumber: generateRefNumber("SO"),
          type: "OUTGOING",
          status: "RECORDED",
          agentId: isAgentToAgentTransfer ? (fromAgentId || null) : null,
          toAgentId: agentId,
          warehouseId: (!isAgentToAgentTransfer && warehouseId) ? warehouseId : null,
          shelfLocationId: (!isAgentToAgentTransfer && shelfLocationId) ? shelfLocationId : null,
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
  sourceType: z.enum(["WAREHOUSE", "AGENT"]),
  sourceId: z.string().min(1, "Source is required"),
  targetType: z.enum(["WAREHOUSE", "AGENT"]),
  targetId: z.string().min(1, "Target is required"),
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

  if (sourceType === targetType && sourceId === targetId) {
    return { error: "Source and target cannot be the same" };
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

      if (status === "SUBMITTED") {
        const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

        if (sourceType === "WAREHOUSE") {
          const locations = await tx.warehouseLocation.findMany({
            where: { warehouseId: sourceId },
            orderBy: { currentStock: "desc" },
          });
          const totalAvailable = locations.reduce((sum, loc) => sum + loc.currentStock, 0);
          if (totalAvailable < totalQty) {
            throw new Error(
              `Insufficient stock at source warehouse (${totalAvailable} available, ${totalQty} required)`
            );
          }
          let remaining = totalQty;
          for (const loc of locations) {
            if (remaining <= 0) break;
            const deduct = Math.min(loc.currentStock, remaining);
            await tx.warehouseLocation.update({
              where: { id: loc.id },
              data: { currentStock: { decrement: deduct } },
            });
            remaining -= deduct;
          }
        }

        if (targetType === "WAREHOUSE") {
          const targetLoc = await tx.warehouseLocation.findFirst({
            where: { warehouseId: targetId },
            orderBy: { currentStock: "desc" },
          });
          if (targetLoc) {
            await tx.warehouseLocation.update({
              where: { id: targetLoc.id },
              data: { currentStock: { increment: totalQty } },
            });
          }
        }
      }
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
        quantityBefore: z.number().int().min(0, "Expected quantity must be 0 or more"),
        quantityAfter: z.number().int().min(0, "Actual quantity must be 0 or more"),
      })
    )
    .min(1, "At least one product is required"),
});

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

  try {
    await prisma.stockAdjustment.create({
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
            quantityBefore: item.quantityBefore,
            quantityAfter: item.quantityAfter,
          })),
        },
      },
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

  const adj = await prisma.stockAdjustment.findUnique({ where: { id } });
  if (!adj) return { error: "Adjustment not found" };
  if (adj.status === "REVERSED") return { error: "Adjustment is already reversed" };

  await prisma.stockAdjustment.update({
    where: { id },
    data: { status: "REVERSED", notes: reason.trim() || null },
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

  const adj = await prisma.stockAdjustment.findUnique({ where: { id } });
  if (!adj) return { error: "Adjustment not found" };

  await prisma.stockAdjustment.delete({ where: { id } });

  revalidatePath("/inventory/adjustment");
  return {};
}

// ── Reverse Incoming Movement ─────────────────────────────────────────────────

export async function reverseIncomingMovementAction(
  id: string,
  reason: string
): Promise<{ error?: string }> {
  await requireAuth();

  const movement = await prisma.stockMovement.findUnique({ where: { id } });
  if (!movement || movement.type !== "INCOMING") return { error: "Movement not found" };
  if (movement.status === "REVERSED") return { error: "Movement is already reversed" };

  await prisma.stockMovement.update({
    where: { id },
    data: { status: "REVERSED", remarks: reason.trim() || null },
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

  const movement = await prisma.stockMovement.findUnique({ where: { id } });
  if (!movement || movement.type !== "INCOMING") return { error: "Movement not found" };

  await prisma.stockMovement.delete({ where: { id } });

  revalidatePath("/inventory/incoming");
  return {};
}

// ── Reverse Outgoing Movement ─────────────────────────────────────────────────

export async function reverseOutgoingMovementAction(
  id: string,
  reason: string
): Promise<{ error?: string }> {
  await requireAuth();

  const movement = await prisma.stockMovement.findUnique({ where: { id } });
  if (!movement || movement.type !== "OUTGOING") return { error: "Movement not found" };
  if (movement.status === "REVERSED") return { error: "Movement is already reversed" };

  await prisma.stockMovement.update({
    where: { id },
    data: { status: "REVERSED", remarks: reason.trim() || null },
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

  const movement = await prisma.stockMovement.findUnique({ where: { id } });
  if (!movement || movement.type !== "OUTGOING") return { error: "Movement not found" };

  await prisma.stockMovement.delete({ where: { id } });

  revalidatePath("/inventory/outgoing");
  return {};
}

// ── Reverse Stock Transfer ────────────────────────────────────────────────────

export async function reverseStockTransferAction(
  id: string,
  reason: string
): Promise<{ error?: string }> {
  await requireAuth();

  const transfer = await prisma.stockTransfer.findUnique({ where: { id } });
  if (!transfer) return { error: "Transfer not found" };
  if (transfer.status === "REVERSED") return { error: "Transfer is already reversed" };

  await prisma.stockTransfer.update({
    where: { id },
    data: { status: "REVERSED", notes: reason.trim() || null },
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

  const transfer = await prisma.stockTransfer.findUnique({ where: { id } });
  if (!transfer) return { error: "Transfer not found" };

  await prisma.stockTransfer.delete({ where: { id } });

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

  const movement = await prisma.stockMovement.findUnique({ where: { id } });
  if (!movement || movement.type !== "RETURN") return { error: "Movement not found" };

  await prisma.stockMovement.delete({ where: { id } });

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

  await prisma.warehouse.create({
    data: {
      name: parsed.data.warehouseName,
      address: parsed.data.warehouseAddress ?? null,
      phone: parsed.data.warehousePhone ?? null,
      email: parsed.data.warehouseEmail || null,
      referenceCode: parsed.data.referenceCode ?? null,
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
      imageUrl: parsed.data.imageUrl ?? null,
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
          imageUrl: parsed.data.imageUrl ?? null,
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
          await tx.productOffer.update({
            where: { id: existingOffer.id },
            data: offerData,
          });
        } else {
          await tx.productOffer.create({
            data: {
              ...offerData,
              productId: id,
            },
          });
        }
      } else {
        // If hasOffer is No, delete any existing offer
        await tx.productOffer.deleteMany({ where: { productId: id } });
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
