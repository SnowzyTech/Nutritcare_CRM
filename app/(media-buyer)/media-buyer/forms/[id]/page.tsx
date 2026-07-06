import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getMyFormDetail } from "@/modules/media-buyer/services/media-buyer.service";
import { MediaBuyerTopbar } from "../../_components/topbar";
import { PeriodSelect } from "../../_components/period-select";
import { FormDetailActions } from "./form-detail-actions";
import { FormConfigView } from "./form-config-view";

export const metadata: Metadata = { title: "Form Details" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
};

function MetricCard({
  label,
  value,
  footer,
  highlight,
  period,
  basePath,
}: {
  label: string;
  value: string;
  footer: React.ReactNode;
  highlight?: boolean;
  period: string;
  basePath: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-3 min-h-[118px] ${
        highlight
          ? "bg-gradient-to-br from-[#4c1178] via-[#3b0d63] to-[#2a0847] border-transparent text-white shadow-lg shadow-purple-200/50"
          : "bg-white border-slate-200 text-slate-800"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[11px] font-bold ${highlight ? "text-purple-100" : "text-slate-600"}`}>
          {label}
        </span>
        <PeriodSelect period={period} basePath={basePath} dark={highlight} />
      </div>
      <p className="text-3xl font-black leading-none">{value}</p>
      <div className={`text-[10px] ${highlight ? "text-purple-200" : "text-slate-400"}`}>{footer}</div>
    </div>
  );
}

export default async function FormDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const period = (await searchParams).period ?? "this-month";
  const session = await auth();
  const form = session?.user?.id ? await getMyFormDetail(session.user.id, id, period) : null;
  if (!form) notFound();

  const basePath = `/media-buyer/forms/${id}`;

  return (
    <div className="max-w-[1320px] mx-auto pb-16">
      <MediaBuyerTopbar
        title={form.name}
        right={<FormDetailActions id={form.id} disabled={form.disabled} />}
      />

      {form.disabled && (
        <div className="-mt-4 mb-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-100 text-rose-600 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Disabled — not accepting orders
          </span>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <MetricCard
          label="Total Delivered Orders"
          value={form.delivered.toLocaleString()}
          highlight
          period={period}
          basePath={basePath}
          footer={<span className="text-emerald-300 font-bold">delivered orders</span>}
        />
        <MetricCard
          label="Total Leads"
          value={form.leads.toLocaleString()}
          period={period}
          basePath={basePath}
          footer={<span className="text-emerald-500 font-bold">orders placed</span>}
        />
        <MetricCard
          label="Total Views"
          value={form.views.toLocaleString()}
          period={period}
          basePath={basePath}
          footer={<span className="text-emerald-500 font-bold">landing-page views</span>}
        />
        <MetricCard
          label="Conversion Rate"
          value={`${form.conversionPct}%`}
          period={period}
          basePath={basePath}
          footer={<span>(Delivered ÷ Leads, as %)</span>}
        />
      </div>

      {/* Form configuration details */}
      <FormConfigView data={form.data} productName={form.productName} createdAt={form.createdAt} />
    </div>
  );
}
