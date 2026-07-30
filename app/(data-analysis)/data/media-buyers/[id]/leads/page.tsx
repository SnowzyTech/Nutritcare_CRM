import { notFound } from "next/navigation";
import { datePeriodLabel, parseDateRangeParams } from "@/lib/date-period";
import {
  getMediaBuyerLeads,
  getMediaBuyerProfile,
} from "@/modules/data-analysis/services/media-buyer-analysis.service";
import { MediaBuyerPageHeader } from "../../../_components/media-buyer/MediaBuyerPageHeader";
import { MediaBuyerLeadsTable } from "../../../_components/media-buyer/MediaBuyerLeadsTable";
import { StockKpiCard } from "../../../_components/stock/StockKpiCard";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
};

export default async function MediaBuyerLeadsPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const period = parseDateRangeParams(sp, "month");

  const profile = await getMediaBuyerProfile(id);
  if (!profile) notFound();

  const leads = await getMediaBuyerLeads(id, period);
  const delivered = leads.filter((l) => l.status === "Delivered").length;
  const lost = leads.filter((l) => l.status === "Cancelled" || l.status === "Failed").length;
  const forms = new Set(leads.map((l) => l.formId).filter(Boolean)).size;

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <MediaBuyerPageHeader
        profile={profile}
        section="Leads"
        periodLabel={datePeriodLabel(period)}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StockKpiCard
          label="Leads"
          value={leads.length}
          sub={`from ${forms} form${forms === 1 ? "" : "s"}`}
        />
        <StockKpiCard label="Delivered" value={delivered} tone="good" />
        <StockKpiCard label="Cancelled / Failed" value={lost} tone="bad" />
        <StockKpiCard
          label="Conversion"
          value={`${leads.length > 0 ? Math.round((delivered / leads.length) * 100) : 0}%`}
          sub="Delivered ÷ Leads"
        />
      </div>

      <MediaBuyerLeadsTable leads={leads} />
    </div>
  );
}
