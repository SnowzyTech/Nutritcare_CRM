import { prisma } from "@/lib/db/prisma";

// Finance service — placeholder until Transaction model is added to schema.

export async function getAllTransactions() {
  return prisma.expense.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getTransactionSummary() {
  const total = await prisma.expense.aggregate({ _sum: { amount: true } });
  return { totalExpenses: total._sum.amount ?? 0 };
}
