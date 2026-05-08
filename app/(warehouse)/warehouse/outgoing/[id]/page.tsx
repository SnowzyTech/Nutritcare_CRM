import type { Metadata } from "next";
import { outgoingOrders } from "@/lib/mock-data/warehouse";
import { notFound } from "next/navigation";
import OutgoingDetailClient from "./client";

export const metadata: Metadata = { title: "Outgoing Details" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OutgoingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = outgoingOrders.find((o) => o.id === id);

  if (!item) notFound();

  return <OutgoingDetailClient item={item} />;
}
