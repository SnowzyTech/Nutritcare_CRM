import type { Metadata } from "next";
import { getMediaBuyerOverview } from "@/modules/media-buyer/services/media-buyer.service";
import { parseDateRangeParams, datePeriodLabel } from "@/lib/date-period";
import MediaBuyerOverviewClient from "./media-buyer-overview-client";

export const metadata: Metadata = { title: "Media Buyers — Overview" };

type Props = {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
};

export default async function MediaBuyerOverviewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const period = parseDateRangeParams(sp);
  const rows = await getMediaBuyerOverview(period);

  return (
    <MediaBuyerOverviewClient rows={rows} periodLabel={datePeriodLabel(period)} />
  );
}
