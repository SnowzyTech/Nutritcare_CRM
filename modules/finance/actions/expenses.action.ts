"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const lineItemSchema = z.object({
  product: z.string().optional(),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0).default(1),
  amount: z.coerce.number().min(0),
  tax: z.coerce.number().min(0).default(0),
});

const createExpenseSchema = z.object({
  expenseCategoryId: z.string().min(1),
  paidFromAccountId: z.string().min(1),
  date: z.coerce.date(),
  notes: z.string().optional(),
  attachmentUrl: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
});

async function nextExpenseRef() {
  const last = await prisma.expense.findFirst({
    orderBy: { createdAt: "desc" },
    select: { referenceNumber: true },
  });
  const n = last ? parseInt(last.referenceNumber.replace(/\D/g, ""), 10) : 1000;
  return `EXP ${(isNaN(n) ? 1000 : n) + 1}`;
}

export async function createExpenseAction(input: z.infer<typeof createExpenseSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = createExpenseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const data = parsed.data;
  const totalAmount = data.lineItems.reduce((s, i) => s + i.amount * (i.quantity || 1), 0);
  const totalTax = data.lineItems.reduce((s, i) => s + i.tax, 0);
  const referenceNumber = await nextExpenseRef();

  const expense = await prisma.expense.create({
    data: {
      referenceNumber,
      expenseCategoryId: data.expenseCategoryId,
      paidFromAccountId: data.paidFromAccountId,
      date: data.date,
      amount: totalAmount,
      tax: totalTax,
      notes: data.notes,
      attachmentUrl: data.attachmentUrl,
      createdById: session.user.id,
    },
  });

  revalidatePath("/accounting/expenses");
  revalidatePath("/accounting");
  return { id: expense.id, referenceNumber };
}

export async function createExpenseCategoryAction(name: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name required" };

  try {
    const cat = await prisma.expenseCategory.create({ data: { name: trimmed } });
    revalidatePath("/accounting/expenses");
    return { id: cat.id, name: cat.name };
  } catch {
    return { error: "Category already exists" };
  }
}

export async function createPaymentAccountAction(name: string, type: string = "BANK") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!name.trim()) return { error: "Name required" };

  const acc = await prisma.paymentAccount.create({
    data: { name: name.trim(), type, isActive: true },
  });
  revalidatePath("/accounting/expenses");
  return { id: acc.id, name: acc.name };
}
