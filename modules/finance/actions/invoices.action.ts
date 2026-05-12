"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const itemSchema = z.object({
  serviceDate: z.coerce.date().optional(),
  productId: z.string().optional(),
  description: z.string().min(1),
  quantity: z.coerce.number().min(0),
  rate: z.coerce.number().min(0),
  vatRate: z.coerce.number().min(0).optional(),
});

const createInvoiceSchema = z.object({
  customerId: z.string().min(1),
  orderId: z.string().optional(),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  terms: z.string().optional(),
  shipping: z.coerce.number().min(0).default(0),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  type: z.enum(["INVOICE", "SALES_RECEIPT", "REFUND_RECEIPT"]).default("INVOICE"),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).default("DRAFT"),
  showLogo: z.boolean().optional(),
  showShipTo: z.boolean().optional(),
  showInvoiceNo: z.boolean().optional(),
  showInvoiceDate: z.boolean().optional(),
  showDueDate: z.boolean().optional(),
  showDiscount: z.boolean().optional(),
  showTerms: z.boolean().optional(),
  items: z.array(itemSchema).min(1),
});

async function nextInvoiceNumber() {
  const last = await prisma.invoice.findFirst({
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });
  const n = last ? parseInt(last.invoiceNumber.replace(/\D/g, ""), 10) : 1000;
  return `INV-${String((isNaN(n) ? 1000 : n) + 1).padStart(9, "0")}`;
}

export async function createInvoiceAction(input: z.infer<typeof createInvoiceSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const data = parsed.data;
  const subtotal = data.items.reduce((s, it) => s + it.quantity * it.rate, 0);
  const discountAmount = (subtotal * data.discountPercent) / 100;
  const invoiceTotal = subtotal - discountAmount + data.shipping;
  const invoiceNumber = await nextInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId: data.customerId,
      orderId: data.orderId,
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate,
      terms: data.terms,
      subtotal,
      discountPercent: data.discountPercent,
      discountAmount,
      shipping: data.shipping,
      invoiceTotal,
      status: data.status,
      type: data.type,
      showLogo: data.showLogo ?? true,
      showShipTo: data.showShipTo ?? true,
      showInvoiceNo: data.showInvoiceNo ?? true,
      showInvoiceDate: data.showInvoiceDate ?? true,
      showDueDate: data.showDueDate ?? true,
      showDiscount: data.showDiscount ?? true,
      showTerms: data.showTerms ?? true,
      createdById: session.user.id,
      items: {
        create: data.items.map(it => ({
          serviceDate: it.serviceDate,
          productId: it.productId,
          description: it.description,
          quantity: it.quantity,
          rate: it.rate,
          amount: it.quantity * it.rate,
          vatRate: it.vatRate,
        })),
      },
    },
  });

  revalidatePath("/accounting");
  revalidatePath("/accounting/create-invoice");
  return { id: invoice.id, invoiceNumber };
}
