import { notFound } from "next/navigation";
import { datePeriodLabel, parseDateRangeParams } from "@/lib/date-period";
import {
  getMediaBuyerAnalytics,
  getMediaBuyerProfile,
} from "@/modules/data-analysis/services/media-buyer-analysis.service";
import { MediaBuyerPageHeader } from "../../../_components/media-buyer/MediaBuyerPageHeader";
import {
  FunnelBar,
  MediaBuyerKpiCard,
} from "../../../_components/media-buyer/MediaBuyerKpiCard";
import {
  MediaBuyerProductChart,
  MediaBuyerTrendChart,
} from "../../../_components/media-buyer/MediaBuyerCharts";
import { MediaBuyerFormsTable } from "../../../_components/media-buyer/MediaBuyerFormsTable";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
};

export default async function MediaBuyerAnalyticsPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const period = parseDateRangeParams(sp, "month");

  const profile = await getMediaBuyerProfile(id);
  if (!profile) notFound();

  const analytics = await getMediaBuyerAnalytics(id, period);
  const { metrics, funnel, trend, productLines, bestPerformingProduct, leadStatuses, forms } =
    analytics;
  const periodLabel = datePeriodLabel(period);
  const funnelMax = Math.max(funnel.views, funnel.leads, funnel.delivered, 1);
  const totalLeads = leadStatuses.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <MediaBuyerPageHeader profile={profile} section="Analytics" periodLabel={periodLabel} />

      <div className="space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <MediaBuyerKpiCard
            label="Conversion"
            value={`${metrics.conversion.value}%`}
            metric={metrics.conversion}
            hint="Delivered ÷ Leads"
            highlight
          />
          <MediaBuyerKpiCard label="Views" value={metrics.views.value} metric={metrics.views} />
          <MediaBuyerKpiCard label="Leads" value={metrics.leads.value} metric={metrics.leads} />
          <MediaBuyerKpiCard
            label="Delivered"
            value={metrics.delivered.value}
            metric={metrics.delivered}
          />
          <MediaBuyerKpiCard
            label="New Forms"
            value={metrics.newForms.value}
            metric={metrics.newForms}
          />
          <MediaBuyerKpiCard
            label="Total Forms"
            value={metrics.totalForms}
            hint="All-time, not window-scoped"
          />
        </div>

        {/* Funnel + charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-5">
            <p className="text-sm font-black text-gray-800">Conversion Funnel</p>
            <p className="text-[11px] text-gray-400 mt-0.5 mb-4">{periodLabel}</p>
            <div className="space-y-4">
              <FunnelBar label="Views" value={funnel.views} max={funnelMax} color="#cbd5e1" />
              <FunnelBar label="Leads" value={funnel.leads} max={funnelMax} color="#f59e0b" />
              <FunnelBar
                label="Delivered"
                value={funnel.delivered}
                max={funnelMax}
                color="#22c55e"
              />
            </div>
            {bestPerformingProduct && (
              <p className="text-[11px] text-gray-400 mt-5 pt-4 border-t border-gray-50">
                Best performing:{" "}
                <span className="font-bold text-emerald-600">{bestPerformingProduct}</span>
              </p>
            )}
          </div>

          <MediaBuyerTrendChart points={trend.points} rangeLabel={periodLabel} />
          <MediaBuyerProductChart productLines={productLines} />
        </div>

        {/* Lead status mix */}
        <section>
          <h2 className="text-lg font-black text-gray-800 mb-4">Lead Status Mix</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {leadStatuses.map((status) => (
              <div
                key={status.status}
                className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4"
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {status.label}
                </p>
                <p className="text-2xl font-black text-gray-800 mt-2 leading-none">
                  {status.count.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {totalLeads > 0 ? Math.round((status.count / totalLeads) * 100) : 0}% of leads
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Per-form performance */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-800">Form Performance</h2>
            <span className="text-xs text-gray-400">
              {forms.length} form{forms.length === 1 ? "" : "s"}
            </span>
          </div>
          <MediaBuyerFormsTable forms={forms} hrefBase={`/data/media-buyers/${id}/forms`} />
        </section>
      </div>
    </div>
  );
}
