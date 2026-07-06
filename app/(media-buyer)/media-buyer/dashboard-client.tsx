"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Plus, ArrowRight } from "lucide-react";
import type { MediaBuyerDashboard } from "@/modules/media-buyer/services/media-buyer.service";
import { MediaBuyerTopbar } from "./_components/topbar";
import { PeriodSelect } from "./_components/period-select";
import { buildFormEmbedCodes } from "@/lib/forms/embed-codes";

/* ── Metric card ─────────────────────────────────────────────────────────── */
function MetricCard({
  label,
  value,
  footer,
  highlight,
  period,
  children,
}: {
  label: string;
  value: string;
  footer?: React.ReactNode;
  highlight?: boolean;
  period: string;
  children?: React.ReactNode;
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
        <span
          className={`text-[11px] font-bold ${highlight ? "text-purple-100" : "text-slate-600"}`}
        >
          {label}
        </span>
        <PeriodSelect period={period} basePath="/media-buyer" dark={highlight} />
      </div>
      <p className="text-3xl font-black leading-none">{value}</p>
      {footer && (
        <div className={`text-[10px] ${highlight ? "text-purple-200" : "text-slate-400"}`}>
          {footer}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Horizontal funnel bar ───────────────────────────────────────────────── */
function FunnelBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-bold text-slate-700">{value.toLocaleString()}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ── Small chart panel wrapper ───────────────────────────────────────────── */
function ChartPanel({
  title,
  legend,
  children,
}: {
  title: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Statistics
          </p>
          <p className="text-sm font-black text-slate-800">{title}</p>
        </div>
        <div className="flex items-center gap-3">{legend}</div>
      </div>
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

/* ── Copy helper for the embed action buttons ────────────────────────────── */
function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => alert(`${label} copied to clipboard!`));
}

/* ── Main component ──────────────────────────────────────────────────────── */
export function MediaBuyerDashboardClient({
  data,
  firstName,
  period,
}: {
  data: MediaBuyerDashboard;
  firstName: string;
  period: string;
}) {
  const router = useRouter();
  const { metrics, funnel, forms } = data;
  const isEmpty = metrics.totalForms === 0;

  const funnelMax = Math.max(funnel.views, funnel.leads, funnel.conversion, 1);

  // Product Overview — real leads per product; views/converted are stubbed to 0
  // until landing-page view tracking and the Order.formId link land.
  const productOverview = useMemo(() => {
    const byProduct = new Map<string, { name: string; leads: number; views: number; converted: number }>();
    for (const f of forms) {
      const key = f.productName || "—";
      const cur = byProduct.get(key) ?? { name: key, leads: 0, views: 0, converted: 0 };
      cur.leads += f.leads;
      cur.views += f.views;
      cur.converted += f.delivered;
      byProduct.set(key, cur);
    }
    return [...byProduct.values()].slice(0, 6);
  }, [forms]);

  // Conversion trend — placeholder monthly scaffold until Order.formId provides dates.
  const trend = useMemo(
    () =>
      ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((name) => ({
        name,
        leads: 0,
        conversion: 0,
      })),
    []
  );

  const metricCards = (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <MetricCard
        label="Total Delivered Orders"
        value={metrics.totalDeliveredOrders.toLocaleString()}
        highlight
        period={period}
        footer={<span>0% of Total Orders</span>}
      />
      <MetricCard
        label="Total Leads"
        value={metrics.totalLeads.toLocaleString()}
        period={period}
        footer={<span>0% of Total Orders</span>}
      />
      <MetricCard
        label="Conversion Rate"
        value={`${metrics.conversionRate}%`}
        period={period}
        footer={<span>(Orders ÷ Leads, as %)</span>}
      />
      <MetricCard
        label="Total Forms"
        value={metrics.totalForms.toLocaleString()}
        period={period}
        footer={<span className="text-emerald-500 font-bold">forms created</span>}
      />
      <MetricCard
        label="Product Lines"
        value={metrics.productLines.length.toLocaleString()}
        period={period}
      >
        <div className="flex flex-wrap gap-1">
          {metrics.productLines.slice(0, 4).map((p) => (
            <span
              key={p.id}
              className="text-[9px] font-semibold bg-purple-100 text-purple-700 rounded px-1.5 py-0.5"
            >
              {p.name}
            </span>
          ))}
        </div>
        {metrics.bestPerformingProduct && (
          <p className="text-[10px] text-slate-400">
            <span className="text-emerald-600 font-bold">
              {metrics.bestPerformingProduct}
            </span>{" "}
            (Best Performing)
          </p>
        )}
      </MetricCard>
    </div>
  );

  return (
    <div className="max-w-[1320px] mx-auto pb-16">
      <MediaBuyerTopbar title={`Welcome Back, ${firstName}`} />

      <div className="space-y-8">
        {metricCards}

        {isEmpty ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center text-center py-28 gap-6">
            <p className="text-xl font-semibold text-slate-500">
              Create your first form to start collecting leads
            </p>
            <Link
              href="/media-buyer/forms/add"
              className="inline-flex items-center gap-2 bg-[#8B2FE8] hover:bg-[#7a26cf] text-white text-sm font-bold rounded-xl px-6 py-3.5 transition-colors shadow-md shadow-purple-200/70"
            >
              <Plus size={16} />
              Create Form
            </Link>
          </div>
        ) : (
          <>
            {/* ── Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <ChartPanel title="Conversion Funnel">
                <div className="space-y-4 pt-2">
                  <FunnelBar label="Views" value={funnel.views} max={funnelMax} color="#cbd5e1" />
                  <FunnelBar label="Leads" value={funnel.leads} max={funnelMax} color="#f59e0b" />
                  <FunnelBar
                    label="Conversion"
                    value={funnel.conversion}
                    max={funnelMax}
                    color="#22c55e"
                  />
                </div>
              </ChartPanel>

              <ChartPanel
                title="Conversion Trend"
                legend={
                  <>
                    <LegendDot color="#ef4444" label="Leads" />
                    <LegendDot color="#6366f1" label="Conversion" />
                  </>
                }
              >
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} width={30} />
                    <Tooltip />
                    <Line type="monotone" dataKey="leads" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="conversion" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel
                title="Product Overview"
                legend={
                  <>
                    <LegendDot color="#a855f7" label="View" />
                    <LegendDot color="#c4b5fd" label="Leads" />
                    <LegendDot color="#7c3aed" label="Converted" />
                  </>
                }
              >
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={productOverview}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#94a3b8" }} interval={0} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} width={30} />
                    <Tooltip />
                    <Legend wrapperStyle={{ display: "none" }} />
                    <Bar dataKey="views" stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} barSize={18} />
                    <Bar dataKey="leads" stackId="a" fill="#c4b5fd" barSize={18} />
                    <Bar dataKey="converted" stackId="a" fill="#7c3aed" radius={[3, 3, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>
            </div>

            {/* ── Top performing forms ── */}
            <div>
              <h2 className="text-lg font-black text-slate-800 mb-4">Top performing forms</h2>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-[1.4fr_0.8fr_1.2fr_0.7fr_0.7fr_0.8fr_2fr] gap-3 px-5 py-3.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  <span>Form</span>
                  <span>Status</span>
                  <span>Product</span>
                  <span>Views</span>
                  <span>Leads</span>
                  <span>Conv.</span>
                  <span>Action</span>
                </div>
                {forms.slice(0, 6).map((f) => {
                  const origin = typeof window !== "undefined" ? window.location.origin : "";
                  const { orderIframe: iframeCode, formCode } = buildFormEmbedCodes(f.id, origin);
                  return (
                    <div
                      key={f.id}
                      className="grid grid-cols-[1.4fr_0.8fr_1.2fr_0.7fr_0.7fr_0.8fr_2fr] gap-3 px-5 py-4 border-t border-slate-100 items-center text-sm"
                    >
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">{f.name}</p>
                        <p className="text-[11px] text-slate-400">{f.createdAt.slice(0, 10)}</p>
                      </div>
                      <div>
                        <span className="inline-flex items-center bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {f.delivered > 0 ? "Delivered" : "Active"}
                        </span>
                      </div>
                      <span className="text-slate-600">{f.productName}</span>
                      <span className="font-semibold text-slate-700">{f.views.toLocaleString()}</span>
                      <span className="font-semibold text-slate-700">{f.leads.toLocaleString()}</span>
                      <div>
                        <p className="font-semibold text-slate-700">{f.delivered.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">{f.conversionPct}%</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => window.open(`/order-form/${f.id}?tab=order`, "_blank")}
                          className="text-[10px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded px-2 py-1 transition-colors cursor-pointer"
                        >
                          Prev. Order Form
                        </button>
                        <button
                          onClick={() => copy(iframeCode, "iFrame code")}
                          className="text-[10px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded px-2 py-1 transition-colors cursor-pointer"
                        >
                          iFrame Code
                        </button>
                        <button
                          onClick={() => copy(formCode, "Form code")}
                          className="text-[10px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded px-2 py-1 transition-colors cursor-pointer"
                        >
                          Form Code
                        </button>
                        <button
                          onClick={() => copy(f.id, "Form ID")}
                          className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded px-2 py-1 transition-colors cursor-pointer"
                        >
                          Form ID
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => router.push("/media-buyer/forms")}
                  className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl px-5 py-2.5 transition-colors cursor-pointer"
                >
                  See all <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
