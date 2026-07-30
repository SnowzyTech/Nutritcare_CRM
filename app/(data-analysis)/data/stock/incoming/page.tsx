import type { Metadata } from "next";
import {
  getIncomingMovementsFiltered,
  getStockFilterOptions,
  parseStockFilters,
} from "@/modules/data-analysis/services/stock-analysis.service";
import { StockIncomingClient } from "./incoming-client";

export const metadata: Metadata = { title: "Incoming Stock" };

export default async function StockIncomingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = parseStockFilters(await searchParams);

  const [data, options] = await Promise.all([
    getIncomingMovementsFiltered(f),
    getStockFilterOptions(),
  ]);

  return <StockIncomingClient data={data} options={options} />;
}
