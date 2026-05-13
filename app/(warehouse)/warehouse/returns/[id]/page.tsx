import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReturnMovementDetail } from "@/modules/warehouse/services/warehouse.service";
import ReturnDetailClient from "./client";

export const metadata: Metadata = { title: "Return Details" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReturnDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getReturnMovementDetail(id);

  if (!item) notFound();

  return <ReturnDetailClient item={item} />;
}
