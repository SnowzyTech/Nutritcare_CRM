import type { Metadata } from "next";
import {
  getStockOverview,
  getStockFilterOptions,
  parseStockFilters,
} from "@/modules/data-analysis/services/stock-analysis.service";
import { StockOverviewClient } from "./stock-overview-client";

export const metadata: Metadata = { title: "Stock Analysis" };

export default async function StockOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const f = parseStockFilters(sp);

  const [overview, options] = await Promise.all([
    getStockOverview({ from: f.from, to: f.to, warehouseId: f.warehouseId, productId: f.productId }),
    getStockFilterOptions(),
  ]);

  return <StockOverviewClient overview={overview} options={options} />;
}
