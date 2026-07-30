import { notFound } from "next/navigation";
import { datePeriodLabel, parseDateRangeParams } from "@/lib/date-period";
import {
  getMediaBuyerAnalytics,
  getMediaBuyerProfile,
} from "@/modules/data-analysis/services/media-buyer-analysis.service";
import { MediaBuyerSummaryView } from "../../_components/media-buyer/MediaBuyerSummaryView";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
};

export default async function MediaBuyerSummaryPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const period = parseDateRangeParams(sp, "month");

  const profile = await getMediaBuyerProfile(id);
  if (!profile) notFound();

  const analytics = await getMediaBuyerAnalytics(id, period);

  return (
    <MediaBuyerSummaryView
      profile={profile}
      analytics={analytics}
      periodLabel={datePeriodLabel(period)}
    />
  );
}
