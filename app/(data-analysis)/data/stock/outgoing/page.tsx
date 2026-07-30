import type { Metadata } from "next";
import {
  getOutgoingMovementsFiltered,
  getStockFilterOptions,
  parseStockFilters,
} from "@/modules/data-analysis/services/stock-analysis.service";
import { StockOutgoingClient } from "./outgoing-client";

export const metadata: Metadata = { title: "Outgoing Stock" };

export default async function StockOutgoingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = parseStockFilters(await searchParams);

  const [data, options] = await Promise.all([
    getOutgoingMovementsFiltered(f),
    getStockFilterOptions(),
  ]);

  return <StockOutgoingClient data={data} options={options} />;
}
