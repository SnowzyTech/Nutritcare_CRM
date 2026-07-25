import type { Metadata } from "next";
import { getSalesRepOverview } from "@/modules/users/services/users.service";
import { parseDateRangeParams, datePeriodLabel } from "@/lib/date-period";
import SalesRepOverviewClient from "./sales-rep-overview-client";

export const metadata: Metadata = { title: "Sales Reps — Overview" };

type Props = {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
};

export default async function SalesRepOverviewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const period = parseDateRangeParams(sp);
  const rows = await getSalesRepOverview(period);

  return (
    <SalesRepOverviewClient rows={rows} periodLabel={datePeriodLabel(period)} />
  );
}
