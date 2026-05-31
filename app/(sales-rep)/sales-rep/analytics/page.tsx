import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getSalesRepAnalytics } from "@/modules/orders/services/analytics.service";
import type { MonthMetrics, Period } from "@/modules/orders/services/analytics.service";
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
    <div className="bg-white rounded-lg p-4 border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 m-0">{value}</p>
      <p className="text-xs mt-1">
        <span className={`font-semibold ${positive ? "text-green-600" : "text-red-500"}`}>
          {delta}
        </span>{" "}
        <span className="text-gray-400">{vsLabel}</span>
      </p>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <PeriodFilter />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPICard
          label="Total Products Sold (Delivered)"
          value={cur.totalProductsSold.toString()}
          delta={pctDelta(cur.totalProductsSold, l?.totalProductsSold ?? null)}
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

      <div className="grid grid-cols-3 gap-4">
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

      <div className="grid grid-cols-3 gap-4">
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

      <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white max-w-xs">
        <div className="text-xs font-semibold text-purple-100 uppercase tracking-wide mb-3">
          KPI — Delivered / Handled
        </div>
        <p className="text-4xl font-bold mb-2">{cur.kpi}%</p>
        <div className="text-sm mb-2">
          {cur.totalOrders > 0
            ? `${cur.ordersDelivered} delivered of ${cur.totalOrders} handled this ${periodWord}`
            : `No orders handled this ${periodWord}`}
        </div>
        <p className="text-xs">
          <span className="font-semibold">{pctDelta(cur.kpi, l?.kpi ?? null)}</span> {vsLabel}
        </p>
      </div>

      <AnalyticsReportButtons
        monthlyData={cur}
        month={currentMonthParam}
        salesRepName={session.user.name ?? "Sales Rep"}
      />

      <div className="grid grid-cols-2 gap-6">
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
