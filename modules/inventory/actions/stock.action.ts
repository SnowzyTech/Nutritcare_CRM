"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// ── Shared ────────────────────────────────────────────────────────────────────

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
  return session.user;
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
  moreInformation: z.string().optional(),
  country: z.string().optional(),
  managerName: z.string().optional(),
  managerTelephone: z.string().optional(),
  managerEmail: z.string().email("Invalid manager email").or(z.literal("")).optional(),
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
    moreInformation: (formData.get("moreInformation") as string) || undefined,
    country: (formData.get("country") as string) || undefined,
    managerName: (formData.get("managerName") as string) || undefined,
    managerTelephone: (formData.get("managerTelephone") as string) || undefined,
    managerEmail: (formData.get("managerEmail") as string) || "",
  };

  const parsed = AddWarehouseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.warehouse.create({
    data: {
      name: parsed.data.warehouseName,
      address: parsed.data.warehouseAddress ?? null,
      phone: parsed.data.warehousePhone ?? null,
      email: parsed.data.warehouseEmail || null,
      additionalInfo: parsed.data.moreInformation ?? null,
      country: parsed.data.country ?? null,
      managerName: parsed.data.managerName ?? null,
      managerPhone: parsed.data.managerTelephone ?? null,
      managerEmail: parsed.data.managerEmail || null,
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
  };

  const parsed = AddProductSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const categoryExists = await prisma.productCategory.findUnique({ where: { id: parsed.data.categoryId } });
  if (!categoryExists) return { error: "Selected category does not exist" };

  const sku = generateSku(parsed.data.productName);

  await prisma.product.create({
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
      sku,
    },
  });

  revalidatePath("/inventory/stock");
  redirect("/inventory/stock");
}
