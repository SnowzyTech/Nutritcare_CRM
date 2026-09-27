import type { Metadata } from "next";
import { SalesReportPage } from "../_components/report-page";

export const metadata: Metadata = { title: "Daily Sales Report" };
export const dynamic = "force-dynamic";

export default function DailySalesReport({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <SalesReportPage type="DAY" searchParams={searchParams} />;
}
