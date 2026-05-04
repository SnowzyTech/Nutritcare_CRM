import { notFound } from "next/navigation";
import { getIncomingMovementById } from "@/modules/inventory/services/inventory.service";
import { IncomingDetailClient } from "./incoming-detail-client";

export default async function IncomingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getIncomingMovementById(id);
  if (!record) notFound();
  return <IncomingDetailClient record={record} />;
}
