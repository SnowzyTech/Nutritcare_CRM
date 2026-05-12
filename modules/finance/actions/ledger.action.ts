"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const rowSchema = z.object({
  account: z.string().min(1, "Account is required"),
  debits: z.coerce.number().min(0).default(0),
  credits: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
  name: z.string().optional(),
  tax: z.coerce.number().min(0).default(0),
});

const createJournalEntrySchema = z.object({
  date: z.coerce.date(),
  rows: z.array(rowSchema).min(1, "At least one row is required"),
});

async function nextJournalNo() {
  const db = prisma as any;
  const last = await db.journalEntry.findFirst({
    orderBy: { createdAt: "desc" },
    select: { journalNo: true },
  });
  const n = last ? parseInt(last.journalNo as string, 10) : 1000;
  return String((isNaN(n) ? 1000 : n) + 1);
}

export async function createJournalEntryAction(
  input: z.infer<typeof createJournalEntrySchema>
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = createJournalEntrySchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const data = parsed.data;
  const nonEmptyRows = data.rows.filter((r) => r.account);
  if (nonEmptyRows.length === 0) return { error: "No valid rows" };

  const totalDebit = nonEmptyRows.reduce((s, r) => s + r.debits, 0);
  const totalCredit = nonEmptyRows.reduce((s, r) => s + r.credits, 0);
  const journalNo = await nextJournalNo();

  const db = prisma as any;
  const entry = await db.journalEntry.create({
    data: {
      journalNo,
      date: data.date,
      totalDebit,
      totalCredit,
      createdById: session.user.id,
      rows: {
        create: nonEmptyRows.map((r) => ({
          account: r.account,
          debits: r.debits,
          credits: r.credits,
          description: r.description ?? null,
          name: r.name ?? null,
          tax: r.tax,
        })),
      },
    },
  });

  revalidatePath("/accounting/accounting-ledger");
  return { id: entry.id, journalNo };
}
