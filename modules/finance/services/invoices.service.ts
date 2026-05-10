import { prisma } from "@/lib/db/prisma";

export async function listInvoices(filters: { status?: string; search?: string } = {}) {
  return prisma.invoice.findMany({
    where: {
      ...(filters.status && filters.status !== "All" ? { status: filters.status as any } : {}),
      ...(filters.search
        ? { invoiceNumber: { contains: filters.search, mode: "insensitive" } }
        : {}),
    },
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getInvoiceById(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } }, order: true },
  });
}

export async function listCustomers() {
  return prisma.customer.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, phone: true, deliveryAddress: true, state: true },
    orderBy: { name: "asc" },
  });
}

export async function listProductsForInvoice() {
  return prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, name: true, sellingPrice: true },
    orderBy: { name: "asc" },
  });
}

export async function nextInvoiceNumber() {
  const last = await prisma.invoice.findFirst({
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });
  const n = last ? parseInt(last.invoiceNumber.replace(/\D/g, ""), 10) : 1000;
  return `INV-${String((isNaN(n) ? 1000 : n) + 1).padStart(9, "0")}`;
}
