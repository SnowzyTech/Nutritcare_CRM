"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createFixedAssetSchema = z
  .object({
    assetName: z.string().trim().min(1, "Asset name is required"),
    description: z.string().trim().optional(),
    nonDepreciable: z.boolean().default(false),
    purchasePrice: z.coerce.number().min(0, "Purchase price cannot be negative").default(0),
    purchaseDate: z.coerce.date(),
    depreciationStartDate: z.coerce.date().optional(),
    depreciationMethod: z
      .enum(["Straight Line", "Declining Balance", "Sum of Years"])
      .optional(),
    usefulLifeYears: z.coerce.number().int().min(1).optional(),
    salvageValue: z.coerce.number().min(0).default(0),
    assetAccount: z.string().trim().min(1, "Asset account is required"),
    assetAccountCode: z.string().trim().optional(),
    accumDepreciationAccount: z.string().trim().optional(),
    accumDepreciationCode: z.string().trim().optional(),
    depExpenseAccount: z.string().trim().optional(),
    depExpenseCode: z.string().trim().optional(),
  })
  .refine(
    (d) =>
      d.nonDepreciable ||
      (d.usefulLifeYears != null && d.depreciationMethod != null),
    {
      message: "Useful life and depreciation method are required for a depreciable asset",
      path: ["usefulLifeYears"],
    },
  )
  .refine((d) => d.nonDepreciable || d.salvageValue <= d.purchasePrice, {
    message: "Salvage value cannot exceed the purchase price",
    path: ["salvageValue"],
  });

export type CreateFixedAssetInput = z.input<typeof createFixedAssetSchema>;

export async function createFixedAssetAction(input: CreateFixedAssetInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = createFixedAssetSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const d = parsed.data;

  const asset = await prisma.fixedAsset.create({
    data: {
      assetName: d.assetName,
      description: d.description || null,
      nonDepreciable: d.nonDepreciable,
      purchasePrice: d.purchasePrice,
      purchaseDate: d.purchaseDate,
      depreciationStartDate: d.nonDepreciable
        ? null
        : d.depreciationStartDate ?? d.purchaseDate,
      depreciationMethod: d.nonDepreciable ? null : d.depreciationMethod ?? null,
      usefulLifeYears: d.nonDepreciable ? null : d.usefulLifeYears ?? null,
      salvageValue: d.nonDepreciable ? 0 : d.salvageValue,
      assetAccount: d.assetAccount,
      assetAccountCode: d.assetAccountCode || null,
      accumDepreciationAccount: d.accumDepreciationAccount || null,
      accumDepreciationCode: d.accumDepreciationCode || null,
      depExpenseAccount: d.depExpenseAccount || null,
      depExpenseCode: d.depExpenseCode || null,
      status: "Active",
      createdById: session.user.id,
    },
  });

  revalidatePath("/accounting/accounting-ledger");
  return { id: asset.id };
}

export async function disposeFixedAssetAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!id) return { error: "Asset id is required" };

  const existing = await prisma.fixedAsset.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return { error: "Fixed asset not found" };

  await prisma.fixedAsset.update({
    where: { id },
    data: { status: "Disposed", disposedAt: new Date() },
  });

  revalidatePath("/accounting/accounting-ledger");
  revalidatePath(`/accounting/accounting-ledger/fixed-assets/${id}`);
  return { id };
}

export async function deleteFixedAssetAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!id) return { error: "Asset id is required" };

  const existing = await prisma.fixedAsset.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return { error: "Fixed asset not found" };

  await prisma.fixedAsset.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/accounting/accounting-ledger");
  return { id };
}
