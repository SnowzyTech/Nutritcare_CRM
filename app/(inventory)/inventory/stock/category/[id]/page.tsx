import { notFound } from "next/navigation";
import { getCategoryById } from "@/modules/inventory/services/inventory.service";
import CategoryDetailClient from "./category-detail-client";

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getCategoryById(id);
  if (!category) notFound();
  return <CategoryDetailClient category={category} />;
}
