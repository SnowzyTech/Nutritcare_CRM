import { prisma } from "@/lib/db/prisma";

export async function getActiveProducts() {
  return prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, name: true, sellingPrice: true, sku: true },
    orderBy: { name: "asc" },
  });
}
