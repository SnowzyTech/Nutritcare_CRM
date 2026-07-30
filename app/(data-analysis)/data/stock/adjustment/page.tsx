import type { Metadata } from "next";
import {
  getAdjustmentsFiltered,
  getStockFilterOptions,
  parseStockFilters,
} from "@/modules/data-analysis/services/stock-analysis.service";
import { StockAdjustmentClient } from "./adjustment-client";

export const metadata: Metadata = { title: "Stock Adjustments" };

export default async function StockAdjustmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = parseStockFilters(await searchParams);

  const [data, options] = await Promise.all([
    getAdjustmentsFiltered(f),
    getStockFilterOptions(),
  ]);

  return <StockAdjustmentClient data={data} options={options} />;
}
