import type { Metadata } from "next";
import { getMediaBuyerOverview } from "@/modules/media-buyer/services/media-buyer.service";
import { datePeriodLabel, parseDateRangeParams } from "@/lib/date-period";
import { MediaBuyerListClient } from "../_components/media-buyer/MediaBuyerListClient";

export const metadata: Metadata = { title: "Media Buyers" };

type Props = {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
};

export default async function MediaBuyersPage({ searchParams }: Props) {
  const sp = await searchParams;
  // Analyst screens land on This Month; the admin boards keep their Today default.
  const period = parseDateRangeParams(sp, "month");
  const buyers = await getMediaBuyerOverview(period);

  return <MediaBuyerListClient buyers={buyers} periodLabel={datePeriodLabel(period)} />;
}
