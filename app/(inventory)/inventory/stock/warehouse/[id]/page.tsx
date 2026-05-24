import { notFound } from "next/navigation";
import { getWarehouseById } from "@/modules/inventory/services/inventory.service";
import WarehouseDetailClient from "./warehouse-detail-client";

export default async function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const warehouse = await getWarehouseById(id);
  if (!warehouse) notFound();
  return <WarehouseDetailClient warehouse={warehouse} />;
}
