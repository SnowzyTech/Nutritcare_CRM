import type { Metadata } from "next";
import { returnItems } from "@/lib/mock-data/warehouse";
import { notFound } from "next/navigation";
import ReturnDetailClient from "./client";

export const metadata: Metadata = { title: "Return Details" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReturnDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = returnItems.find((r) => r.id === id);

  if (!item) notFound();

  return <ReturnDetailClient item={item} />;
}
