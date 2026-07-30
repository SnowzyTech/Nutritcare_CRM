import { notFound } from "next/navigation";
import { datePeriodLabel, parseDateRangeParams } from "@/lib/date-period";
import {
  getMediaBuyerFormDetail,
  getMediaBuyerProfile,
} from "@/modules/data-analysis/services/media-buyer-analysis.service";
import { MediaBuyerPageHeader } from "../../../../_components/media-buyer/MediaBuyerPageHeader";
import { StockKpiCard } from "../../../../_components/stock/StockKpiCard";
// The read-only render of a form's saved config already exists in the media
// buyer's own module; cross-route-group component reuse is the idiom here.
import { FormConfigView } from "@/app/(media-buyer)/media-buyer/forms/[id]/form-config-view";

type Props = {
  params: Promise<{ id: string; formId: string }>;
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
};

export default async function MediaBuyerFormDetailPage({ params, searchParams }: Props) {
  const [{ id, formId }, sp] = await Promise.all([params, searchParams]);
  const period = parseDateRangeParams(sp, "month");

  const profile = await getMediaBuyerProfile(id);
  if (!profile) notFound();

  // Scoped to this buyer, so a formId belonging to someone else 404s.
  const form = await getMediaBuyerFormDetail(id, formId, period);
  if (!form) notFound();

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <MediaBuyerPageHeader
        profile={profile}
        section={form.name}
        periodLabel={datePeriodLabel(period)}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StockKpiCard label="Views" value={form.views.toLocaleString()} />
        <StockKpiCard label="Leads" value={form.leads.toLocaleString()} />
        <StockKpiCard label="Delivered" value={form.delivered.toLocaleString()} tone="good" />
        <StockKpiCard
          label="Conversion"
          value={`${form.conversionPct}%`}
          sub="Delivered ÷ Leads"
        />
        <StockKpiCard
          label="Status"
          value={form.disabled ? "Disabled" : "Active"}
          tone={form.disabled ? "bad" : "good"}
        />
      </div>

      <FormConfigView
        data={form.data}
        productName={form.productName}
        createdAt={form.createdAt}
      />
    </div>
  );
}
