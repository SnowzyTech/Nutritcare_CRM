import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getSalesRepAnalytics } from "@/modules/orders/services/analytics.service";
import type { MonthMetrics } from "@/modules/orders/services/analytics.service";
import { MonthSelect } from "./month-select";
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
  period = "This Month",
}: {
  label: string;
  value: string;
  delta: string;
  period?: string;
}) {
  const positive = delta.startsWith("+");
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <MonthSelect />
      </div>
      <p className="text-2xl font-bold text-gray-900 m-0">{value}</p>
      <p className="text-xs mt-1">
        <span className={`font-semibold ${positive ? "text-green-600" : "text-red-500"}`}>
          {delta}
        </span>{" "}
        <span className="text-gray-400">vs last month</span>
      </p>
    </div>
  );
}

export default async function AnalyticsPage(props: { searchParams: Promise<{ month?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const targetMonth = searchParams.month ? new Date(`${searchParams.month}-01T00:00:00`) : undefined;

  const { current: cur, last } = await getSalesRepAnalytics(session.user.id, targetMonth);

  const l = last as MonthMetrics | null;

  const noLastMonth = l === null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      <div className="grid grid-cols-3 gap-4">
        <KPICard
          label="Total Products Sold"
          value={cur.totalProductsSold.toString()}
          delta={pctDelta(cur.totalProductsSold, l?.totalProductsSold ?? null)}
        />
        <KPICard
          label="Total Orders"
          value={cur.totalOrders.toString()}
          delta={pctDelta(cur.totalOrders, l?.totalOrders ?? null)}
        />
        <KPICard
          label="Best Selling Product"
          value={cur.bestSellingProduct}
          delta={noLastMonth ? "N/A" : cur.bestSellingProduct === l!.bestSellingProduct ? "Same as last month" : "Changed"}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPICard
          label="General Performance"
          value={`${cur.generalPerformance}%`}
          delta={pctDelta(cur.generalPerformance, l?.generalPerformance ?? null)}
        />
        <KPICard
          label="Upselling Rate"
          value={`${cur.upsellRate}%`}
          delta={pctDelta(cur.upsellRate, l?.upsellRate ?? null)}
        />
        <KPICard
          label="Confirmation Rate"
          value={`${cur.confirmationRate}%`}
          delta={pctDelta(cur.confirmationRate, l?.confirmationRate ?? null)}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPICard
          label="Delivery Rate"
          value={`${cur.deliveryRate}%`}
          delta={pctDelta(cur.deliveryRate, l?.deliveryRate ?? null)}
        />
        <KPICard
          label="Cancellation Rate"
          value={`${cur.cancellationRate}%`}
          delta={pctDelta(cur.cancellationRate, l?.cancellationRate ?? null)}
        />
        <KPICard
          label="Recovery Rate"
          value={`${cur.recoveryRate}%`}
          delta={pctDelta(cur.recoveryRate, l?.recoveryRate ?? null)}
        />
      </div>

      <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white max-w-xs">
        <div className="text-xs font-semibold text-purple-100 uppercase tracking-wide mb-3">
          KPI — Overall Performance
        </div>
        <p className="text-4xl font-bold mb-2">{cur.generalPerformance}%</p>
        <div className="text-sm mb-2">
          Unique customers this month: {cur.uniqueCustomers}
        </div>
        <p className="text-xs">
          <span className="font-semibold">
            {pctDelta(cur.generalPerformance, l?.generalPerformance ?? null)}
          </span>{" "}
          vs last month
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="bg-purple-100 border border-purple-200 px-5 py-3 rounded-lg font-semibold text-purple-600 text-sm flex items-center justify-center gap-2 hover:bg-purple-50 transition">
          Generate Weekly Report →
        </button>
        <button className="bg-purple-100 border border-purple-200 px-5 py-3 rounded-lg font-semibold text-purple-600 text-sm flex items-center justify-center gap-2 hover:bg-purple-50 transition">
          Generate Monthly Report →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">
              Best Selling Products
            </h3>
            <MonthSelect />
          </div>
          {cur.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No delivered orders yet this month</p>
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
            <MonthSelect />
          </div>
          {cur.upsoldProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No multi-item orders this month</p>
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
