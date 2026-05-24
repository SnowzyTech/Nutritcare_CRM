import { notFound } from "next/navigation";
import { getSupplierById } from "@/modules/inventory/services/inventory.service";
import SupplierDetailClient from "./supplier-detail-client";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await getSupplierById(id);
  if (!supplier) notFound();
  return <SupplierDetailClient supplier={supplier} />;
}
