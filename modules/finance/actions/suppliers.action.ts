"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(1),
  phone1: z.string().min(1),
  phone2: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  payableBalance: z.coerce.number().min(0).optional(),
});

export async function createSupplierAction(input: z.infer<typeof supplierSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const supplier = await prisma.supplier.create({ data: parsed.data });
    revalidatePath("/accounting/expenses");
    return { id: supplier.id };
  } catch {
    return { error: "Supplier with this phone already exists" };
  }
}

export async function updateSupplierAction(id: string, input: z.infer<typeof supplierSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!id) return { error: "Supplier id required" };
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const supplier = await prisma.supplier.update({ where: { id }, data: parsed.data });
    revalidatePath("/accounting/expenses");
    return { id: supplier.id, name: supplier.name, phone1: supplier.phone1 };
  } catch {
    return { error: "Supplier with this phone already exists" };
  }
}

export async function deleteSupplierAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!id) return { error: "Supplier id required" };

  try {
    await prisma.supplier.delete({ where: { id } });
    revalidatePath("/accounting/expenses");
    return { id };
  } catch (e: unknown) {
    // P2003 = foreign key constraint: supplier is still referenced (e.g. by expenses).
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2003") {
      return { error: "Cannot delete: this supplier is used by existing expenses or purchase records." };
    }
    return { error: "Failed to delete supplier" };
  }
}
