import { notFound } from "next/navigation";
import { getReturnedMovementById } from "@/modules/inventory/services/inventory.service";
import { LogisticsReturnDetailClient } from "./return-detail-client";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Return ${id}` };
}

export default async function LogisticsReturnDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await getReturnedMovementById(id);
  if (!detail) notFound();

  return <LogisticsReturnDetailClient detail={detail} />;
}
