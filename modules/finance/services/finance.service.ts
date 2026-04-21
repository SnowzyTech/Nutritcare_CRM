import { prisma } from "@/lib/db/prisma";
import type { TransactionType, TransactionStatus } from "@prisma/client";

/**
 * Finance service — business logic for financial transaction management.
 */

export async function getAllTransactions() {
  return prisma.transaction.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createTransaction(data: {
  type: TransactionType;
  amount: number;
  status?: TransactionStatus;
}) {
  return prisma.transaction.create({
    data: {
      type: data.type,
      amount: data.amount,
      status: data.status ?? "PENDING",
    },
  });
}

export async function getTransactionSummary() {
  const [credits, debits] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: "CREDIT", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "DEBIT", status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalCredits: credits._sum.amount ?? 0,
    totalDebits: debits._sum.amount ?? 0,
  };
}
