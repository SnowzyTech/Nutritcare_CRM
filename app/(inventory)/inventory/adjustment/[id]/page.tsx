import { notFound } from "next/navigation";
import { getAdjustmentById } from "@/modules/inventory/services/inventory.service";
import { AdjustmentDetailClient } from "./adjustment-detail-client";

export default async function AdjustmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getAdjustmentById(id);
  if (!record) notFound();

  return <AdjustmentDetailClient record={record} />;
}
