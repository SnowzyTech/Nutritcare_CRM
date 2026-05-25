import { prisma } from "@/lib/db/prisma";

export async function getActiveProducts() {
  return prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, name: true, sellingPrice: true, sku: true },
    orderBy: { name: "asc" },
  });
}

export async function getProductsWithOffers() {
  return prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      sellingPrice: true,
      offers: {
        select: {
          id: true,
          offerName: true,
          offerQuantity: true,
          offerUnit: true,
          sellingPrice: true,
          showQuantityAndUnit: true,
        },
        orderBy: { sellingPrice: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}
