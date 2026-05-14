import { notFound } from "next/navigation";
import { getSupplierById } from "@/modules/inventory/services/inventory.service";
import SupplierDetailClient from "./supplier-detail-client";

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  const supplier = await getSupplierById(params.id);
  if (!supplier) notFound();
  return <SupplierDetailClient supplier={supplier} />;
}
