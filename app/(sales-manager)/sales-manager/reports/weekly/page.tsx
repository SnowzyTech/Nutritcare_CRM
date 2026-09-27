import type { Metadata } from "next";
import { SalesReportPage } from "../_components/report-page";

export const metadata: Metadata = { title: "Weekly Sales Report" };
export const dynamic = "force-dynamic";

export default function WeeklySalesReport({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <SalesReportPage type="WEEK" searchParams={searchParams} />;
}
