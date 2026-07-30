import type { Metadata } from "next";
import {
  getReturnedMovementsFiltered,
  getStockFilterOptions,
  parseStockFilters,
} from "@/modules/data-analysis/services/stock-analysis.service";
import { StockReturnedClient } from "./returned-client";

export const metadata: Metadata = { title: "Returned Stock" };

export default async function StockReturnedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = parseStockFilters(await searchParams);

  const [data, options] = await Promise.all([
    getReturnedMovementsFiltered(f),
    getStockFilterOptions(),
  ]);

  return <StockReturnedClient data={data} options={options} />;
}
