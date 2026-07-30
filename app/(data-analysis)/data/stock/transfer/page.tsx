import type { Metadata } from "next";
import {
  getStockTransfersFiltered,
  getStockFilterOptions,
  parseStockFilters,
} from "@/modules/data-analysis/services/stock-analysis.service";
import { StockTransferClient } from "./transfer-client";

export const metadata: Metadata = { title: "Stock Transfers" };

export default async function StockTransferPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = parseStockFilters(await searchParams);

  const [data, options] = await Promise.all([
    getStockTransfersFiltered(f),
    getStockFilterOptions(),
  ]);

  return <StockTransferClient data={data} options={options} />;
}
