import type { Metadata } from "next";
import { SalesReportPage } from "../_components/report-page";

export const metadata: Metadata = { title: "Quarterly Sales Report" };
export const dynamic = "force-dynamic";

export default function QuarterlySalesReport({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <SalesReportPage type="QUARTER" searchParams={searchParams} />;
}
