import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import EditCategoryClient from "./edit-category-client";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await prisma.productCategory.findFirst({
    where: { id, deletedAt: null },
  });
  if (!category) notFound();
  return <EditCategoryClient category={category} />;
}
