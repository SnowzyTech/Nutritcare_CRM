import { notFound } from "next/navigation";
import { getStockTransferById } from "@/modules/inventory/services/inventory.service";
import { TransferDetailClient } from "./transfer-detail-client";

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getStockTransferById(id);
  if (!record) notFound();
  return <TransferDetailClient record={record} />;
}
