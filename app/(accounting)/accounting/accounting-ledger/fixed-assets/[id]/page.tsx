import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFixedAssetDetail } from "@/modules/finance/services/fixed-assets.service";
import { FixedAssetDetailClient } from "../../../_components/FixedAssetDetailClient";

export const metadata: Metadata = {
  title: "Fixed Asset",
  description: "Fixed asset details, account mappings and depreciation schedule.",
};

export default async function FixedAssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = await getFixedAssetDetail(id);

  if (!asset) {
    notFound();
  }

  return <FixedAssetDetailClient asset={asset} />;
}
