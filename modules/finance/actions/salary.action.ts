"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const money = z.coerce.number().min(0).default(0);

const rowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  department: z.string().optional(),
  designation: z.string().optional(),
  level: z.string().optional(),
  amount: money,
  basic: money,
  housingAllowance: money,
  grossPay: money,
  transportation: money,
  wardrobe: money,
  utilityAllowance: money,
  grossPayTotal: money,
  paye: money,
  pension: money,
  hmo: money,
  otherDeduction: money,
  netPay: money,
  bank: money,
  cash: money,
  zenithAccountNumber: z.string().optional(),
  remark: z.string().optional(),
});

const createSalarySchema = z.object({
  company: z.string().optional(),
  date: z.coerce.date().optional(),
  rows: z.array(rowSchema).min(1, "Add at least one salary row"),
});

export async function createSalaryRecordsAction(input: z.infer<typeof createSalarySchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!dbUser) return { error: "Your session is stale. Please sign out and sign back in." };

  const parsed = createSalarySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const data = parsed.data;
  const company = data.company && data.company !== "All" ? data.company : null;
  const date = data.date ?? new Date();

  const created = await prisma.salaryRecord.createMany({
    data: data.rows.map(r => ({
      company,
      name: r.name.trim(),
      department: r.department?.trim() || null,
      designation: r.designation?.trim() || null,
      level: r.level?.trim() || null,
      amount: r.amount,
      basic: r.basic,
      housingAllowance: r.housingAllowance,
      grossPay: r.grossPay,
      transportation: r.transportation,
      wardrobe: r.wardrobe,
      utilityAllowance: r.utilityAllowance,
      grossPayTotal: r.grossPayTotal,
      paye: r.paye,
      pension: r.pension,
      hmo: r.hmo,
      otherDeduction: r.otherDeduction,
      netPay: r.netPay,
      bank: r.bank,
      cash: r.cash,
      zenithAccountNumber: r.zenithAccountNumber?.trim() || null,
      remark: r.remark?.trim() || null,
      date,
      createdById: dbUser.id,
    })),
  });

  revalidatePath("/accounting/salary");
  return { count: created.count };
}
