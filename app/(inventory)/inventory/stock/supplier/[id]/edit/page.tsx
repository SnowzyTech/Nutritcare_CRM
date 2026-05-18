import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import EditSupplierClient from "./edit-supplier-client";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await prisma.supplier.findFirst({
    where: { id, deletedAt: null },
  });
  if (!supplier) notFound();
  return <EditSupplierClient supplier={supplier} />;
}
