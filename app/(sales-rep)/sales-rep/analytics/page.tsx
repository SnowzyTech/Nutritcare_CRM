import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getSalesRepAnalytics } from "@/modules/orders/services/analytics.service";
import type { MonthMetrics, Period } from "@/modules/orders/services/analytics.service";
import { calculateBonus, KPI_TARGET } from "@/lib/bonus";
import { PeriodFilter } from "./period-filter";
import { AnalyticsReportButtons } from "./report-buttons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

function pctDelta(current: number, last: number | null): string {
  if (last === null) return current > 0 ? "+100%" : "0%";
  if (last === 0) return current > 0 ? "+100%" : "0%";
  const pct = Math.round(((current - last) / last) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

function KPICard({
  label,
  value,
  delta,
  vsLabel,
}: {
  label: string;
  value: string;
  delta: string;
  vsLabel: string;
}) {
  const positive = delta.startsWith("+");
  return (
    <div className="bg-[#FAF8FF] rounded-xl p-5 border border-[#F3E8FF] shadow-[0_2px_10px_rgb(0,0,0,0.01)] flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-bold text-gray-900">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-gray-600 tracking-tight">{value}</span>
        <div className="text-right">
          <p className={`text-base font-bold ${positive ? "text-green-500" : "text-red-500"}`}>
            {delta}
          </p>
          <p className="text-xs text-gray-500">{vsLabel}</p>
        </div>
      </div>
    </div>
  );
}

function WeeklyBonusCard({
  bonus,
  kpi,
  lastKpi,
  period,
}: {
  bonus: { amount: number; eligible: boolean; reason?: string };
  kpi: number;
  lastKpi: number | null;
  period: Period;
}) {
  const delta = lastKpi !== null ? kpi - lastKpi : 0;
  const deltaStr = delta >= 0 ? `+${delta}%` : `${delta}%`;
  const periodWord = period === "week" ? "week" : "month";

  return (
    <div className={`rounded-xl p-5 border shadow-[0_2px_10px_rgb(0,0,0,0.01)] flex flex-col justify-between h-full ${
      bonus.eligible
        ? "bg-[#FAF8FF] border-[#F3E8FF]"
        : "bg-gray-50 border-gray-200"
    }`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-bold text-gray-900">
          {period === "week" ? "Weekly" : "Monthly"} Bonus
        </span>
        {bonus.eligible && (
          <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
            Eligible
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        {bonus.eligible ? (
          <>
            <span className="text-3xl font-bold text-gray-600 tracking-tight">
              ₦{bonus.amount.toLocaleString()}
            </span>
            <div className="text-right">
              <p className="text-base font-bold text-green-500">{kpi}%</p>
              <p className="text-[10px] font-bold text-gray-500">
                <span className={delta >= 0 ? "text-green-500" : "text-red-500"}>{deltaStr}</span> vs last {periodWord}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-gray-400 tracking-tight">Not Eligible</span>
              <span className="text-xs text-gray-500 mt-1">{bonus.reason}</span>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-gray-400">{kpi}%</p>
              <p className="text-[10px] font-bold text-gray-400">KPI</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default async function AnalyticsPage(props: {
  searchParams: Promise<{ month?: string; period?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const period: Period = searchParams.period === "week" ? "week" : "month";

  const now = new Date();
  const currentMonthParam =
    searchParams.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const targetMonth =
    period === "month" && searchParams.month
      ? new Date(`${searchParams.month}-01T00:00:00`)
      : undefined;

  const { current: cur, last } = await getSalesRepAnalytics(
    session.user.id,
    period,
    targetMonth,
  );

  const l = last as MonthMetrics | null;
  const noLast = l === null;

  const periodWord = period === "week" ? "week" : "month";
  const vsLabel = `vs last ${periodWord}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <PeriodFilter />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label="Total Products Sold (Delivered)"
          value={cur.ordersDelivered.toString()}
          delta={pctDelta(cur.ordersDelivered, l?.ordersDelivered ?? null)}
          vsLabel={vsLabel}
        />
        <KPICard
          label="Total Orders"
          value={cur.totalOrders.toString()}
          delta={pctDelta(cur.totalOrders, l?.totalOrders ?? null)}
          vsLabel={vsLabel}
        />
        <KPICard
          label="Best Selling Product"
          value={cur.bestSellingProduct}
          delta={noLast ? "N/A" : cur.bestSellingProduct === l!.bestSellingProduct ? "Same" : "Changed"}
          vsLabel={`since last ${periodWord}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label="General Performance"
          value={`${cur.generalPerformance}%`}
          delta={pctDelta(cur.generalPerformance, l?.generalPerformance ?? null)}
          vsLabel={vsLabel}
        />
        <KPICard
          label="Upselling Rate"
          value={`${cur.upsellRate}%`}
          delta={pctDelta(cur.upsellRate, l?.upsellRate ?? null)}
          vsLabel={vsLabel}
        />
        <KPICard
          label="Reorder Rating"
          value={`${cur.reorderRate}%`}
          delta={pctDelta(cur.reorderRate, l?.reorderRate ?? null)}
          vsLabel={vsLabel}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label="Delivery Rate"
          value={`${cur.deliveryRate}%`}
          delta={pctDelta(cur.deliveryRate, l?.deliveryRate ?? null)}
          vsLabel={vsLabel}
        />
        <KPICard
          label="Cancellation Rate"
          value={`${cur.cancellationRate}%`}
          delta={pctDelta(cur.cancellationRate, l?.cancellationRate ?? null)}
          vsLabel={vsLabel}
        />
        <KPICard
          label="Recovery Rate"
          value={`${cur.recoveryRate}%`}
          delta={pctDelta(cur.recoveryRate, l?.recoveryRate ?? null)}
          vsLabel={vsLabel}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch">
        {(() => {
          const kpiMet = cur.kpi >= KPI_TARGET;
          const bonus = calculateBonus(cur.kpi, cur.totalOrders, period);
          return (
            <>
              <div className={`rounded-xl p-6 text-white w-full sm:max-w-xs flex flex-col justify-between ${
                kpiMet
                  ? "bg-gradient-to-br from-purple-600 to-purple-700"
                  : "bg-gradient-to-br from-red-500 to-red-600"
              }`}>
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                    kpiMet ? "text-purple-100" : "text-red-100"
                  }`}>
                    KPI — Target: {KPI_TARGET}%
                  </div>
                  <p className="text-4xl font-extrabold tracking-tight mb-2">{cur.kpi}%</p>
                  <div className="text-sm font-medium mb-1">
                    {cur.totalOrders > 0
                      ? `${cur.ordersDelivered} delivered of ${cur.totalOrders} handled this ${periodWord}`
                      : `No orders handled this ${periodWord}`}
                  </div>
                  {!kpiMet && (
                    <div className="text-xs font-medium text-red-200 mt-1">
                      Need {KPI_TARGET - cur.kpi}% more to reach target
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold mt-2">
                  <span className="font-extrabold">{pctDelta(cur.kpi, l?.kpi ?? null)}</span> {vsLabel}
                </p>
              </div>

              <div className="w-full sm:max-w-xs flex">
                <div className="w-full h-full">
                  <WeeklyBonusCard
                    bonus={bonus}
                    kpi={cur.kpi}
                    lastKpi={l?.kpi ?? null}
                    period={period}
                  />
                </div>
              </div>
            </>
          );
        })()}
      </div>

      <AnalyticsReportButtons
        monthlyData={cur}
        month={currentMonthParam}
        salesRepName={session.user.name ?? "Sales Rep"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">
              Best Selling Products
            </h3>
          </div>
          {cur.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No delivered orders yet this {periodWord}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 font-semibold text-gray-500">Product</th>
                  <th className="text-right py-3 font-semibold text-gray-500">Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {cur.topProducts.map((p) => (
                  <tr key={p.name} className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">{p.name}</td>
                    <td className="py-3 text-right text-gray-900 font-medium">{p.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">
              Upselling — Multi-Item Orders
            </h3>
          </div>
          {cur.upsoldProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No multi-item orders this {periodWord}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 font-semibold text-gray-500">Product</th>
                  <th className="text-right py-3 font-semibold text-gray-500">No. of Upsells</th>
                </tr>
              </thead>
              <tbody>
                {cur.upsoldProducts.map((p) => (
                  <tr key={p.name} className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">{p.name}</td>
                    <td className="py-3 text-right text-gray-900 font-medium">{p.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
