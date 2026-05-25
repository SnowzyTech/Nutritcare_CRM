import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  getStockCategories,
  getProductsForDropdown,
} from "@/modules/inventory/services/inventory.service";
import { AddProductClient } from "../../../add-product/add-product-client";
// huy
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories, products] = await Promise.all([
    prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: { packages: true, offers: true },
    }),
    getStockCategories(),
    getProductsForDropdown(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <AddProductClient
        categories={categories}
        products={products}
        product={product}
      />
    </div>
  );
}
