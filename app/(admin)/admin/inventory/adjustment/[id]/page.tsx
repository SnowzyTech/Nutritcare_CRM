import { notFound } from "next/navigation";
import { getAdjustmentById } from "@/modules/inventory/services/inventory.service";
import { AdjustmentApprovalClient } from "./adjustment-approval-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminAdjustmentApprovalPage({ params }: Props) {
  const { id } = await params;
  const record = await getAdjustmentById(id);
  if (!record) notFound();

  return <AdjustmentApprovalClient record={record} />;
}
