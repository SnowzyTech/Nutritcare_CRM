import { notFound } from "next/navigation";
import { getProductById } from "@/modules/inventory/services/inventory.service";
import ProductDetailClient from "./product-detail-client";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
