import { notFound } from "next/navigation";
import { getStockMovementDetail } from "@/modules/data-analysis/services/stock-analysis.service";
import { StockMovementDetailClient } from "../../../_components/stock/StockMovementDetailClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getStockMovementDetail("transfer", id);
  if (!detail) notFound();
  return <StockMovementDetailClient detail={detail} />;
}
