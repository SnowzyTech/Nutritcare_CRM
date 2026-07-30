import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getSalesRepById, getSalesRepAnalytics } from "@/modules/users/services/users.service";
import { parseStaffPeriod } from "@/lib/staff-period";
import { StaffPeriodFilter } from "@/components/admin/staff-period-filter";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ g?: string; month?: string; w?: string; d?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const rep = await getSalesRepById(id);
  return { title: rep ? `${rep.name} — Analytics` : "Analytics" };
}

function StatCard({
  title,
  value,
  trend,
  comparison,
  isProduct = false,
  lastProductName,
}: {
  title: string;
  value: string | number;
  trend?: string;
  comparison?: string;
  isProduct?: boolean;
  lastProductName?: string;
}) {
  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
      <div className="flex justify-between items-center mb-10">
        <span className="text-[0.85rem] font-bold text-slate-700">{title}</span>
      </div>
      <div className="flex justify-between items-end">
        <span className={`${isProduct ? "text-[1.8rem]" : "text-[2.8rem]"} font-black leading-none`}>
          {value}
        </span>
        {trend && !isProduct && (
          <div className="text-right">
            <span className={`text-[0.85rem] font-bold ${trend.startsWith("+") ? "text-emerald-500" : trend === "—" ? "text-slate-400" : "text-rose-500"}`}>
              {trend}
            </span>
            <p className="text-[0.65rem] text-slate-400 font-medium whitespace-nowrap">{comparison}</p>
          </div>
        )}
        {isProduct && lastProductName && (
          <div className="text-right leading-tight">
            <p className="text-emerald-500 text-[0.75rem] font-bold">{lastProductName}</p>
            <p className="text-slate-300 text-[0.7rem] font-medium">last month</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function SalesRepAnalyticsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const period = parseStaffPeriod(await searchParams);
  const [rep, analytics] = await Promise.all([
    getSalesRepById(id),
    getSalesRepAnalytics(id, period.arg),
  ]);

  if (!rep) notFound();

  const { current, trends } = analytics;
  const bestProduct = current.bestProduct?.name ?? "—";
  const cmp = period.comparisonLabel;

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      <Link
        href={`/admin/staff/sales-rep/${id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 mb-6 transition-colors group no-underline"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">Back to Profile</span>
      </Link>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{rep.name}&apos;s Analytics</h1>
          <p className="text-[0.9rem] text-slate-400 mt-0.5">
            Sales Representatives · <span className="font-semibold text-slate-600">{period.valueLabel}</span>
          </p>
        </div>
        <StaffPeriodFilter />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="Total Products Sold (Delivered)" value={current.delivered} trend={trends.delivered} comparison={cmp} />
        <StatCard title="Total Orders" value={current.total} trend={trends.total} comparison={cmp} />
        <StatCard title="Best Selling Product" value={bestProduct} isProduct />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="General Performance" value={`${current.generalPerformance}%`} trend={trends.generalPerformance} comparison={cmp} />
        <StatCard title="Upselling Rate" value={`${current.upsellRate}%`} trend={trends.upsellRate} comparison={cmp} />
        <StatCard title="Confirmation Rate" value={`${current.confirmationRate}%`} trend={trends.confirmationRate} comparison={cmp} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Delivery Rate" value={`${current.deliveryRate}%`} trend={trends.deliveryRate} comparison={cmp} />
        <StatCard title="Cancellation Rate" value={`${current.cancellationRate}%`} trend={trends.cancellationRate} comparison={cmp} />
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
          <div className="flex justify-between items-center mb-10">
            <span className="text-[0.85rem] font-bold text-slate-700">Orders ({period.valueLabel})</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[2.8rem] font-black leading-none">{current.total}</span>
            <div className="text-right text-[0.75rem] text-slate-400">
              <p>{current.delivered} delivered</p>
              <p>{current.failed} failed</p>
              <p>{current.cancelled} cancelled</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Card */}
      <div className="max-w-[400px]">
        <div className="bg-gradient-to-br from-[#5b00a3] to-[#8B2FE8] rounded-[24px] p-8 text-white shadow-xl shadow-purple-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[0.85rem] font-black uppercase tracking-widest opacity-80">KPI</p>
              <h2 className="text-[3.5rem] font-black leading-none mt-2">{current.kpi}%</h2>
            </div>
            <div className="text-right">
              <p className="text-[0.75rem] font-bold opacity-60">{period.valueLabel}&apos;s score:</p>
              <p className="text-[1.1rem] font-black tracking-widest">{current.total} orders</p>
              <p className="text-[0.85rem] font-bold mt-2 text-emerald-400">
                {trends.kpi}{" "}
                <span className="text-white opacity-60 font-medium">{cmp}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
