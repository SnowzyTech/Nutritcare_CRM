import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getDeliveryAgentById, getDeliveryAgentAnalytics, getDeliveryAgentOrderSummary } from "@/modules/delivery/services/agents.service";
import { parseStaffPeriod } from "@/lib/staff-period";
import { StaffPeriodFilter } from "@/components/admin/staff-period-filter";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ g?: string; month?: string; w?: string; d?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const agent = await getDeliveryAgentById(id);
  return { title: agent ? `${agent.companyName} — Analytics` : "Analytics" };
}

function StatCard({
  title,
  value,
  trend,
  comparison,
  isProduct = false,
}: {
  title: string;
  value: string | number;
  trend?: string;
  comparison?: string;
  isProduct?: boolean;
}) {
  return (
    <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-50">
      <div className="flex justify-between items-center mb-10">
        <span className="text-[1rem] font-bold text-slate-700">{title}</span>
      </div>
      <div className="flex justify-between items-end">
        <span className={`${isProduct ? "text-[2rem]" : "text-[3.5rem]"} font-black leading-none`}>
          {value}
        </span>
        {trend && !isProduct && (
          <div className="text-right">
            <span className={`text-[1rem] font-bold ${trend.startsWith("+") ? "text-emerald-500" : trend === "—" ? "text-slate-400" : "text-rose-500"}`}>
              {trend}
            </span>
            <p className="text-[0.75rem] text-slate-400 font-medium whitespace-nowrap">{comparison}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function DeliveryAgentAnalyticsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const period = parseStaffPeriod(await searchParams);
  const [agent, analytics, summary] = await Promise.all([
    getDeliveryAgentById(id),
    getDeliveryAgentAnalytics(id, period.arg),
    getDeliveryAgentOrderSummary(id),
  ]);

  if (!agent) notFound();

  const { current, trends } = analytics;
  const bestProduct = current.bestProduct?.name ?? "—";
  const cmp = period.comparisonLabel;

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      <Link
        href={`/admin/staff/delivery-agent/${id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 mb-6 transition-colors group no-underline"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">Back to Profile</span>
      </Link>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-12">
        <div>
          <h1 className="text-2xl font-bold">{agent.companyName}&apos;s Analytics</h1>
          <p className="text-[0.9rem] text-slate-400 mt-0.5">
            Delivery Agent · <span className="font-semibold text-slate-600">{period.valueLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <StaffPeriodFilter />
          <button className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-110 transition-transform">
            <MessageSquare size={20} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <StatCard
          title="Total Products Delivered"
          value={current.totalProductsDelivered}
          trend={trends.totalProductsDelivered}
          comparison={cmp}
        />
        <StatCard
          title="Best Delivered Product"
          value={bestProduct}
          isProduct
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <StatCard
          title="General Performance"
          value={`${current.generalPerformance}%`}
          trend={trends.generalPerformance}
          comparison={cmp}
        />
        <StatCard
          title="Delivery Rate"
          value={`${current.deliveryRate}%`}
          trend={trends.deliveryRate}
          comparison={cmp}
        />
      </div>

      {/* KPI / Summary Card */}
      <div className="max-w-[500px]">
        <div className="bg-gradient-to-br from-[#5b00a3] to-[#8B2FE8] rounded-[24px] p-8 text-white shadow-xl shadow-purple-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[0.85rem] font-black uppercase tracking-widest opacity-80">KPI</p>
              <h2 className="text-[3.5rem] font-black leading-none mt-2">{current.deliveryRate}%</h2>
              <p className="text-[0.8rem] font-bold opacity-60 mt-1">Delivery Rate</p>
            </div>
            <div className="text-right">
              <p className="text-[0.75rem] font-bold opacity-60">{period.valueLabel}:</p>
              <p className="text-[1.1rem] font-black">{current.delivered} delivered</p>
              <p className="text-[0.9rem] font-bold opacity-60">{current.failed} failed</p>
              <p className="text-[0.85rem] font-bold mt-2 text-emerald-400">
                {trends.deliveryRate}{" "}
                <span className="text-white opacity-60 font-medium">{cmp}</span>
              </p>
            </div>
          </div>

          {/* All-time summary */}
          <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[1.4rem] font-black">{summary.total}</p>
              <p className="text-[0.7rem] font-bold opacity-60 uppercase tracking-wider">Total</p>
            </div>
            <div>
              <p className="text-[1.4rem] font-black">{summary.delivered}</p>
              <p className="text-[0.7rem] font-bold opacity-60 uppercase tracking-wider">Delivered</p>
            </div>
            <div>
              <p className="text-[1.4rem] font-black">{summary.failed}</p>
              <p className="text-[0.7rem] font-bold opacity-60 uppercase tracking-wider">Failed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
