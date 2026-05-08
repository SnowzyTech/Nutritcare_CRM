import type { Metadata } from "next";
import { incomingGoods } from "@/lib/mock-data/warehouse";
import { notFound } from "next/navigation";
import IncomingGoodDetailClient from "./client";

export const metadata: Metadata = { title: "Incoming Good Details" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IncomingGoodDetailPage({ params }: PageProps) {
  const { id } = await params;
  const good = incomingGoods.find((g) => g.id === id);

  if (!good) notFound();

  return <IncomingGoodDetailClient good={good} />;
}
