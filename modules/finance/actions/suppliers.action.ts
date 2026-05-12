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
