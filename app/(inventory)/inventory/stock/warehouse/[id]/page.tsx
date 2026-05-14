import { notFound } from "next/navigation";
import { getWarehouseById } from "@/modules/inventory/services/inventory.service";
import WarehouseDetailClient from "./warehouse-detail-client";

export default async function WarehouseDetailPage({ params }: { params: { id: string } }) {
  const warehouse = await getWarehouseById(params.id);
  if (!warehouse) notFound();
  return <WarehouseDetailClient warehouse={warehouse} />;
}
