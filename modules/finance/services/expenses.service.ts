import { prisma } from "@/lib/db/prisma";

export async function listExpenses(filters: {
  categoryId?: string;
  from?: Date;
  to?: Date;
  search?: string;
} = {}) {
  return prisma.expense.findMany({
    where: {
      ...(filters.categoryId && filters.categoryId !== "All" ? { expenseCategoryId: filters.categoryId } : {}),
      ...(filters.from || filters.to
        ? { date: { ...(filters.from && { gte: filters.from }), ...(filters.to && { lte: filters.to }) } }
        : {}),
      ...(filters.search
        ? { referenceNumber: { contains: filters.search, mode: "insensitive" } }
        : {}),
    },
    include: {
      expenseCategory: true,
      expenseName: true,
      supplier: true,
      paidFromAccount: true,
      createdBy: { select: { name: true, role: true, avatarUrl: true } },
      lineItems: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });
}

export async function getExpenseById(id: string) {
  return prisma.expense.findUnique({
    where: { id },
    include: {
      expenseCategory: true,
      paidFromAccount: true,
      createdBy: { select: { name: true, role: true, avatarUrl: true } },
    },
  });
}

export async function listExpenseCategories() {
  return prisma.expenseCategory.findMany({
    orderBy: { name: "asc" },
    include: { expenseNames: { orderBy: { name: "asc" } } },
  });
}

export async function listPaymentAccounts() {
  return prisma.paymentAccount.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function nextExpenseReference() {
  const last = await prisma.expense.findFirst({
    orderBy: { createdAt: "desc" },
    select: { referenceNumber: true },
  });
  const lastNum = last ? parseInt(last.referenceNumber.replace(/\D/g, ""), 10) : 1000;
  return `EXP ${(isNaN(lastNum) ? 1000 : lastNum) + 1}`;
}
