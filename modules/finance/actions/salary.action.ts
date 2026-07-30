"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { suppressCameraForRequest } from "@/lib/audit/context";

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
  // Payroll month as "YYYY-MM". When provided, the batch is saved into (and
  // replaces) that month's payroll for the given company.
  month: z.string().regex(/^\d{4}-\d{2}$/, "Pick a valid payroll month").optional(),
  rows: z.array(rowSchema).min(1, "Add at least one salary row"),
});

export async function createSalaryRecordsAction(input: z.infer<typeof createSalarySchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  suppressCameraForRequest();

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!dbUser) return { error: "Your session is stale. Please sign out and sign back in." };

  const parsed = createSalarySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const data = parsed.data;
  const company = data.company && data.company !== "All" ? data.company : null;
  // A month anchors the payroll to the first day of that month; otherwise use
  // the explicit date, else now.
  const date = data.month
    ? new Date(Date.UTC(Number(data.month.slice(0, 4)), Number(data.month.slice(5, 7)) - 1, 1))
    : data.date ?? new Date();

  const rowData = data.rows.map(r => ({
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
  }));

  // Saving a month is idempotent per (month, company): replace any existing
  // rows for that month/company so re-saving edits the payroll instead of
  // duplicating it. Without a month, fall back to a plain insert.
  const count = await prisma.$transaction(async (tx) => {
    if (data.month) {
      const y = Number(data.month.slice(0, 4));
      const m = Number(data.month.slice(5, 7));
      await tx.salaryRecord.deleteMany({
        where: {
          date: { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) },
          company,
        },
      });
    }
    const created = await tx.salaryRecord.createMany({ data: rowData });
    return created.count;
  });

  await logActivity({
    userId: session.user.id,
    action: "Created",
    entityType: "SalaryRecord",
    entityId: data.month ?? "payroll",
    description: `Payroll ${data.month ? `for ${data.month} ` : ""}saved (${count} staff)`,
  });

  revalidatePath("/accounting/salary");
  return { count };
}
