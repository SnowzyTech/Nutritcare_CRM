import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { notFound, redirect } from "next/navigation";
import { getIncomingGoodDetail } from "@/modules/warehouse/services/warehouse.service";
import IncomingGoodDetailClient from "./client";

export const metadata: Metadata = { title: "Incoming Good Details" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IncomingGoodDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const warehouseId = session?.user?.warehouseId ?? null;

  if (!warehouseId) redirect("/warehouse/incoming-goods");

  const good = await getIncomingGoodDetail(id, warehouseId);
  if (!good) notFound();

  return <IncomingGoodDetailClient good={good} />;
}
