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
  expenseNameId: z.string().optional(),
  supplierId: z.string().optional(),
  paidFromAccountId: z.string().min(1),
  date: z.coerce.date(),
  notes: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentUrls: z.array(z.string()).optional(),
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
      expenseNameId: data.expenseNameId || null,
      supplierId: data.supplierId || null,
      paidFromAccountId: data.paidFromAccountId,
      date: data.date,
      amount: totalAmount,
      tax: totalTax,
      notes: data.notes,
      attachmentUrl: data.attachmentUrl,
      attachmentUrls: data.attachmentUrls ?? [],
      createdById: session.user.id,
      lineItems: {
        createMany: {
          data: data.lineItems.map(i => ({
            product: i.product || null,
            description: i.description || null,
            quantity: i.quantity || 1,
            amount: i.amount,
            tax: i.tax || 0,
          })),
        },
      },
    },
  });

  revalidatePath("/accounting/expenses");
  revalidatePath("/accounting");
  return { id: expense.id, referenceNumber };
}

// An account the accountant is adding to the chart: a display name plus an
// optional account code (e.g. "6201"). The class (1-8) is derived from the code.
export interface AccountInput {
  name: string;
  code?: string;
}

/** Derive the account class (1-8) from the leading digit of a code. */
function classFromCode(code?: string | null): number | null {
  if (!code) return null;
  const d = parseInt(code.trim().charAt(0), 10);
  return d >= 1 && d <= 8 ? d : null;
}

/** Returns codes that are already used by another account, so we can reject them. */
async function findCodeConflicts(codes: string[]): Promise<string[]> {
  if (codes.length === 0) return [];
  const existing = await prisma.expenseName.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  });
  return existing.map(e => e.code!).filter(Boolean);
}

/** Validates codes: no blanks-mixed-with-dupes within the batch, none already taken. */
async function validateCodes(accounts: AccountInput[]): Promise<string | null> {
  const codes = accounts.map(a => a.code?.trim()).filter((c): c is string => !!c);
  const dupesInBatch = codes.filter((c, i) => codes.indexOf(c) !== i);
  if (dupesInBatch.length) return `Duplicate code(s) in this entry: ${[...new Set(dupesInBatch)].join(", ")}`;
  const taken = await findCodeConflicts(codes);
  if (taken.length) return `Code(s) already in use: ${[...new Set(taken)].join(", ")}`;
  return null;
}

export async function createExpenseCategoryAction(
  name: string,
  financialStatement?: string,
  accounts?: AccountInput[]
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name required" };

  const valid = (accounts ?? []).filter(a => a.name.trim());
  const codeError = await validateCodes(valid);
  if (codeError) return { error: codeError };

  const fs = financialStatement?.trim() || null;
  // The category's class is inferred from the first coded account in it.
  const catClass = valid.map(a => classFromCode(a.code)).find(c => c != null) ?? null;

  try {
    const result = await prisma.$transaction(async tx => {
      const cat = await tx.expenseCategory.create({
        data: { name: trimmed, financialStatement: fs, accountClass: catClass },
      });
      const createdNames: { id: string; name: string; code: string | null }[] = [];
      for (const a of valid) {
        const code = a.code?.trim() || null;
        const r = await tx.expenseName.create({
          data: {
            name: a.name.trim(),
            expenseCategoryId: cat.id,
            code,
            accountClass: classFromCode(code) ?? catClass,
            financialStatement: fs,
          },
        });
        createdNames.push({ id: r.id, name: r.name, code: r.code });
      }
      return { cat, createdNames };
    });

    revalidatePath("/accounting/expenses");
    revalidatePath("/accounting/accounting-ledger");
    return {
      id: result.cat.id,
      name: result.cat.name,
      financialStatement: result.cat.financialStatement,
      accountClass: result.cat.accountClass,
      expenseNames: result.createdNames,
    };
  } catch {
    return { error: "Category already exists" };
  }
}

export async function addExpenseNamesToCategoryAction(categoryId: string, accounts: AccountInput[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const valid = accounts.filter(a => a.name.trim());
  if (!valid.length) return { error: "At least one name required" };

  const codeError = await validateCodes(valid);
  if (codeError) return { error: codeError };

  const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });
  if (!category) return { error: "Category not found" };

  try {
    const results = await prisma.$transaction(
      valid.map(a => {
        const code = a.code?.trim() || null;
        return prisma.expenseName.upsert({
          where: { name_expenseCategoryId: { name: a.name.trim(), expenseCategoryId: categoryId } },
          update: { code, accountClass: classFromCode(code) ?? category.accountClass },
          create: {
            name: a.name.trim(),
            expenseCategoryId: categoryId,
            code,
            accountClass: classFromCode(code) ?? category.accountClass,
            financialStatement: category.financialStatement,
          },
        });
      })
    );
    revalidatePath("/accounting/expenses");
    revalidatePath("/accounting/accounting-ledger");
    return { names: results.map(r => ({ id: r.id, name: r.name, code: r.code })) };
  } catch {
    return { error: "Failed to add accounts (a code may already be in use)" };
  }
}

export async function createPaymentAccountAction(name: string, type: string = "BANK", logoUrl?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!name.trim()) return { error: "Name required" };

  const acc = await prisma.paymentAccount.create({
    data: { name: name.trim(), type, isActive: true, ...(logoUrl ? { logoUrl } : {}) },
  });
  revalidatePath("/accounting/expenses");
  return { id: acc.id, name: acc.name, logoUrl: acc.logoUrl ?? undefined };
}
