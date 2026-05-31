import { prisma } from "@/lib/db/prisma";

export async function getActiveProducts() {
  return prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, name: true, sellingPrice: true, sku: true },
    orderBy: { name: "asc" },
  });
}

export async function getProductsWithPackages() {
  return prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      sellingPrice: true,
      unit: true,
      packages: {
        select: {
          id: true,
          name: true,
          quantity: true,
          price: true,
        },
        orderBy: { price: "asc" },
      },
      offers: {
        select: {
          id: true,
          offerName: true,
          offerQuantity: true,
          offerUnit: true,
          sellingPrice: true,
        },
        orderBy: { sellingPrice: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

/** @deprecated Use getProductsWithPackages instead */
export const getProductsWithOffers = getProductsWithPackages;
