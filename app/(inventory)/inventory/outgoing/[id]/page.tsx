import { notFound } from "next/navigation";
import { getOutgoingMovementById } from "@/modules/inventory/services/inventory.service";
import { OutgoingDetailClient } from "./outgoing-detail-client";

export default async function OutgoingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getOutgoingMovementById(id);
  if (!record) notFound();
  return <OutgoingDetailClient record={record} />;
}
