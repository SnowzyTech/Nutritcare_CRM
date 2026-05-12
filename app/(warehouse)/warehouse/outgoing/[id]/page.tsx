import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOutgoingMovementById } from "@/modules/inventory/services/inventory.service";
import OutgoingDetailClient from "./client";

export const metadata: Metadata = { title: "Outgoing Details" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OutgoingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getOutgoingMovementById(id);

  if (!item) notFound();

  return <OutgoingDetailClient item={item} />;
}
