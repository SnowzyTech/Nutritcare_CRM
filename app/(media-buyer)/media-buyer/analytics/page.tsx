import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { getMediaBuyerDashboard } from "@/modules/media-buyer/services/media-buyer.service";
import { MediaBuyerTopbar } from "../_components/topbar";

export const metadata: Metadata = { title: "Analytics" };

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-black text-slate-800 mt-2 leading-none">{value}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-2">{hint}</p>}
    </div>
  );
}

function FunnelRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-bold text-slate-700">{value.toLocaleString()}</span>
      </div>
      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const data = userId
    ? await getMediaBuyerDashboard(userId)
    : { metrics: { totalDeliveredOrders: 0, totalLeads: 0, conversionRate: 0, totalForms: 0, productLines: [], bestPerformingProduct: null }, funnel: { views: 0, leads: 0, conversion: 0 }, forms: [] };

  const { metrics, funnel, forms } = data;
  const funnelMax = Math.max(funnel.views, funnel.leads, funnel.conversion, 1);

  return (
    <div className="max-w-[1320px] mx-auto pb-16">
      <MediaBuyerTopbar
        title="Analytics"
        subtitle="Performance across every form you've created."
        showCreate={false}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Views" value={funnel.views.toLocaleString()} hint="Landing-page visits" />
        <StatCard label="Total Leads" value={metrics.totalLeads.toLocaleString()} hint="Orders placed from your forms" />
        <StatCard label="Delivered" value={metrics.totalDeliveredOrders.toLocaleString()} hint="Orders marked delivered" />
        <StatCard label="Conversion Rate" value={`${metrics.conversionRate}%`} hint="Delivered ÷ Leads" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-black text-slate-800 mb-4">Conversion Funnel</p>
          <div className="space-y-4">
            <FunnelRow label="Views" value={funnel.views} max={funnelMax} color="#cbd5e1" />
            <FunnelRow label="Leads" value={funnel.leads} max={funnelMax} color="#f59e0b" />
            <FunnelRow label="Conversion" value={funnel.conversion} max={funnelMax} color="#22c55e" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-black text-slate-800 mb-4">Product Lines</p>
          {metrics.productLines.length === 0 ? (
            <p className="text-sm text-slate-400">No products yet — create a form to get started.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {metrics.productLines.map((p) => (
                <span key={p.id} className="text-xs font-semibold bg-purple-50 text-purple-700 rounded-lg px-3 py-1.5">
                  {p.name}
                </span>
              ))}
            </div>
          )}
          {metrics.bestPerformingProduct && (
            <p className="text-xs text-slate-500 mt-4">
              Best performing:{" "}
              <span className="font-bold text-emerald-600">{metrics.bestPerformingProduct}</span>
            </p>
          )}
        </div>
      </div>

      {/* Per-form performance */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1.2fr_0.8fr_0.8fr_0.8fr] gap-3 px-5 py-3.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          <span>Form</span>
          <span>Product</span>
          <span>Views</span>
          <span>Leads</span>
          <span>Conv.</span>
        </div>
        {forms.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-slate-400">
            No forms yet. Create a form to start seeing analytics.
          </div>
        ) : (
          forms.map((f) => (
            <div
              key={f.id}
              className="grid grid-cols-[1.6fr_1.2fr_0.8fr_0.8fr_0.8fr] gap-3 px-5 py-4 border-t border-slate-100 items-center text-sm"
            >
              <div>
                <p className="font-bold text-slate-800 leading-tight">{f.name}</p>
                <p className="text-[11px] text-slate-400">{f.createdAt.slice(0, 10)}</p>
              </div>
              <span className="text-slate-600">{f.productName}</span>
              <span className="font-semibold text-slate-700">{f.views.toLocaleString()}</span>
              <span className="font-semibold text-slate-700">{f.leads.toLocaleString()}</span>
              <span className="font-semibold text-slate-700">{f.conversionPct}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
