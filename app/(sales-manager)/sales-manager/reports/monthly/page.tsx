import type { Metadata } from "next";
import { SalesReportPage } from "../_components/report-page";

export const metadata: Metadata = { title: "Monthly Sales Report" };
export const dynamic = "force-dynamic";

export default function MonthlySalesReport({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <SalesReportPage type="MONTH" searchParams={searchParams} />;
}
