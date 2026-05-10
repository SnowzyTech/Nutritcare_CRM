"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const remittanceSchema = z.object({
  agentId: z.string().min(1),
  date: z.coerce.date(),
  orderIds: z.array(z.string()).min(1),
  amountRemitted: z.coerce.number().min(0),
  note: z.string().optional(),
});

async function nextRemittanceRef() {
  const last = await prisma.agentLedgerEntry.findFirst({
    where: { referenceType: "REMITTANCE" },
    orderBy: { createdAt: "desc" },
    select: { referenceId: true },
  });
  const n = last ? parseInt(last.referenceId.replace(/\D/g, ""), 10) : 1000;
  return `REM-${(isNaN(n) ? 1000 : n) + 1}`;
}

async function nextAdjustmentRef() {
  const last = await prisma.agentLedgerEntry.findFirst({
    where: { referenceType: "ADJUSTMENT" },
    orderBy: { createdAt: "desc" },
    select: { referenceId: true },
  });
  const n = last ? parseInt(last.referenceId.replace(/\D/g, ""), 10) : 0;
  return `ADJ-${String((isNaN(n) ? 0 : n) + 1).padStart(4, "0")}`;
}

async function getRunningBalance(agentId: string): Promise<number> {
  const last = await prisma.agentLedgerEntry.findFirst({
    where: { agentId },
    orderBy: { createdAt: "desc" },
    select: { runningBalance: true },
  });
  return Number(last?.runningBalance ?? 0);
}

export async function createRemittanceAction(input: z.infer<typeof remittanceSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = remittanceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const data = parsed.data;
  const orders = await prisma.order.findMany({
    where: { id: { in: data.orderIds }, agentId: data.agentId },
    select: { netAmount: true, deliveryFee: true },
  });
  if (orders.length !== data.orderIds.length) return { error: "Some orders not found for agent" };

  const expected = orders.reduce((s, o) => s + Number(o.netAmount), 0);
  const deliveryFees = orders.reduce((s, o) => s + Number(o.deliveryFee), 0);
  const balance = expected - data.amountRemitted;
  const overpayment = data.amountRemitted > expected ? data.amountRemitted - expected : 0;
  const underpayment = data.amountRemitted < expected ? expected - data.amountRemitted : 0;

  const referenceId = await nextRemittanceRef();
  const prevBalance = await getRunningBalance(data.agentId);
  const newRunningBalance = prevBalance - data.amountRemitted;

  const result = await prisma.$transaction(async tx => {
    const settlement = await tx.agentSettlement.create({
      data: {
        agentId: data.agentId,
        date: data.date,
        totalSalesValue: expected,
        deliveryFeesEarned: deliveryFees,
        totalRemitted: data.amountRemitted,
        balance,
        overpayment,
        underpayment,
      },
    });
    await tx.agentLedgerEntry.create({
      data: {
        agentId: data.agentId,
        settlementId: settlement.id,
        date: data.date,
        referenceType: "REMITTANCE",
        referenceId,
        debit: 0,
        credit: data.amountRemitted,
        runningBalance: newRunningBalance,
      },
    });
    return { settlementId: settlement.id, referenceId };
  });

  revalidatePath("/accounting/agent-settlement");
  revalidatePath("/accounting");
  return result;
}

const adjustmentSchema = z.object({
  agentId: z.string().min(1),
  date: z.coerce.date(),
  adjustmentType: z.enum(["PAYMENT", "OVERPAYMENT", "CORRECTION"]),
  paymentType: z.string().optional(),
  linkedReferenceId: z.string().min(1),
  amount: z.coerce.number().min(0),
  note: z.string().optional(),
  ordersJson: z.any().optional(),
});

export async function createSettlementAdjustmentAction(input: z.infer<typeof adjustmentSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = adjustmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const data = parsed.data;
  const referenceId = await nextAdjustmentRef();
  const prevBalance = await getRunningBalance(data.agentId);

  const debit = data.adjustmentType === "OVERPAYMENT" ? data.amount : 0;
  const credit = data.adjustmentType !== "OVERPAYMENT" ? data.amount : 0;
  const newRunningBalance = prevBalance + debit - credit;

  await prisma.$transaction([
    prisma.settlementAdjustment.create({
      data: {
        agentId: data.agentId,
        date: data.date,
        adjustmentType: data.adjustmentType,
        linkedReferenceId: data.linkedReferenceId,
        paymentType: data.paymentType ?? "GENERAL",
        amount: data.amount,
        note: data.note,
        ordersJson: data.ordersJson ?? undefined,
        amountRemitted: credit,
        autoRunningBalance: newRunningBalance,
        createdById: session.user.id,
      },
    }),
    prisma.agentLedgerEntry.create({
      data: {
        agentId: data.agentId,
        date: data.date,
        referenceType: "ADJUSTMENT",
        referenceId,
        debit,
        credit,
        runningBalance: newRunningBalance,
      },
    }),
  ]);

  revalidatePath("/accounting/agent-settlement");
  return { referenceId };
}
