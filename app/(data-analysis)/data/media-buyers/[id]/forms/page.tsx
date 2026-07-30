import { notFound } from "next/navigation";
import { datePeriodLabel, parseDateRangeParams } from "@/lib/date-period";
import {
  getMediaBuyerForms,
  getMediaBuyerProfile,
} from "@/modules/data-analysis/services/media-buyer-analysis.service";
import { MediaBuyerPageHeader } from "../../../_components/media-buyer/MediaBuyerPageHeader";
import { MediaBuyerFormsTable } from "../../../_components/media-buyer/MediaBuyerFormsTable";
import { StockKpiCard } from "../../../_components/stock/StockKpiCard";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
};

export default async function MediaBuyerFormsPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const period = parseDateRangeParams(sp, "month");

  const profile = await getMediaBuyerProfile(id);
  if (!profile) notFound();

  const forms = await getMediaBuyerForms(id, period);
  const active = forms.filter((f) => !f.disabled).length;
  const views = forms.reduce((sum, f) => sum + f.views, 0);
  const leads = forms.reduce((sum, f) => sum + f.leads, 0);
  const delivered = forms.reduce((sum, f) => sum + f.delivered, 0);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <MediaBuyerPageHeader
        profile={profile}
        section="Forms"
        periodLabel={datePeriodLabel(period)}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StockKpiCard label="Forms" value={forms.length} sub={`${active} active`} />
        <StockKpiCard label="Views" value={views.toLocaleString()} />
        <StockKpiCard label="Leads" value={leads.toLocaleString()} />
        <StockKpiCard label="Delivered" value={delivered.toLocaleString()} tone="good" />
        <StockKpiCard
          label="Conversion"
          value={`${leads > 0 ? Math.round((delivered / leads) * 100) : 0}%`}
          sub="Delivered ÷ Leads"
        />
      </div>

      <MediaBuyerFormsTable forms={forms} hrefBase={`/data/media-buyers/${id}/forms`} />
    </div>
  );
}
