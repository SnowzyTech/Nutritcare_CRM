import { notFound } from "next/navigation";
import { getReturnedMovementById } from "@/modules/inventory/services/inventory.service";
import { ReturnedDetailClient } from "./returned-detail-client";

export default async function ReturnedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getReturnedMovementById(id);
  if (!record) notFound();
  return <ReturnedDetailClient record={record} />;
}
