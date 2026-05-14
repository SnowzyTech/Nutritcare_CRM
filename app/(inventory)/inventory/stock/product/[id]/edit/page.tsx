import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getStockCategories } from "@/modules/inventory/services/inventory.service";
import { AddProductClient } from "../../add-product/add-product-client";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        offers: true,
      },
    }),
    getStockCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <AddProductClient categories={categories} product={product} />
    </div>
  );
}
