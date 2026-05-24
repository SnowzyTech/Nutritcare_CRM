import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import EditWarehouseClient from "./edit-warehouse-client";

export default async function EditWarehousePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const warehouse = await prisma.warehouse.findFirst({
    where: { id, deletedAt: null },
  });
  if (!warehouse) notFound();
  return <EditWarehouseClient warehouse={warehouse} />;
}
