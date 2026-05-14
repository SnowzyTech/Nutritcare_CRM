import { notFound } from "next/navigation";
import { getCategoryById } from "@/modules/inventory/services/inventory.service";
import CategoryDetailClient from "./category-detail-client";

export default async function CategoryDetailPage({ params }: { params: { id: string } }) {
  const category = await getCategoryById(params.id);
  if (!category) notFound();
  return <CategoryDetailClient category={category} />;
}
