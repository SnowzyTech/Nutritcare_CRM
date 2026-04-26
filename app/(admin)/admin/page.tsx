import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import {
  DashboardLineChart,
  DashboardBarChart,
} from "@/components/dashboard/dashboard-charts";
import { getAdminDashboardData } from "@/modules/orders/services/admin-dashboard.service";
import { PeriodSelector } from "./period-selector-client";

export const metadata: Metadata = { title: "Admin Dashboard" };

/* ── Helpers ── */
function delta(current: number, last: number): string {
  if (last === 0) return current > 0 ? "+100%" : "0%";
  const pct = Math.round(((current - last) / last) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

function compactCurrency(amount: number): string {
  if (amount >= 1_000_000_000)
    return `₦${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString("en-NG")}`;
}

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-NG");
}

/* ── Delta badge ── */
function Delta({ value, showVs = true }: { value: string; showVs?: boolean }) {
  const positive = !value.startsWith("-");
  return (
    <div className="flex items-center gap-1 mt-1">
      <span
        className={`text-[0.75rem] font-bold ${positive ? "text-emerald-500" : "text-rose-500"}`}
      >
        {value}
      </span>
      {showVs && (
        <span className="text-[0.7rem] text-muted-foreground">
          vs last month
        </span>
      )}
    </div>
  );
}

/* ── Account Stat Card ── */
function AccountStatCard({
  label,
  value,
  deltaValue,
}: {
  label: string;
  value: string;
  deltaValue: string;
}) {
  return (
    <Card className="border-gray-200 shadow-none">
      <CardHeader className="p-5 pb-2 flex-row items-center justify-between space-y-0">
        <span className="text-sm font-bold text-gray-700">{label}</span>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="text-3xl font-bold tracking-tight text-gray-900">
          {value}
        </div>
        <Delta value={deltaValue} />
      </CardContent>
    </Card>
  );
}

/* ── Insight Tile ── */
function InsightTile({
  label,
  value,
  deltaValue,
}: {
  label: string;
  value: string;
  deltaValue: string;
}) {
  return (
    <Card className="border-gray-200 shadow-none">
      <CardHeader className="p-4 pb-0 flex-row items-center justify-between space-y-0">
        <span className="text-[0.8rem] font-bold text-gray-600">{label}</span>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <Delta value={deltaValue} />
      </CardContent>
    </Card>
  );
}

/* ── Product Tile ── */
function ProductTile({
  label,
  value,
  sub,
  subLabel,
  className,
  labelClassName,
  valueClassName,
}: {
  label: string;
  value: string;
  sub?: string;
  subLabel?: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={`p-6 rounded-2xl flex flex-col justify-between h-[150px] ${className ?? "border border-gray-100 bg-white shadow-sm"}`}
    >
      <span
        className={`text-[0.85rem] font-bold ${labelClassName ?? "text-gray-600"}`}
      >
        {label}
      </span>
      <div className="flex justify-between items-end">
        <span
          className={`text-2xl font-bold truncate max-w-[60%] ${valueClassName ?? "text-gray-900"}`}
        >
          {value}
        </span>
        {sub && (
          <div className="text-right">
            <p
              className={`text-[0.65rem] font-bold truncate max-w-[100px] ${valueClassName ?? "text-gray-600"}`}
            >
              {sub}
            </p>
            {subLabel && (
              <p className="text-[0.6rem] text-gray-400">{subLabel}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()), 10);
  const month = parseInt(params.month ?? String(now.getMonth() + 1), 10);

  const data = await getAdminDashboardData(year, month);
  const { current: c, last: l } = data;

  const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const totalSalesThisYear = data.monthlyRevenue.reduce(
    (s, d) => s + d.value,
    0
  );

  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto p-4">

      {/* ── Period Selector ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Showing data for the selected period
          </p>
        </div>
        <PeriodSelector currentMonth={month} currentYear={year} />
      </div>

      {/* ── 1. Financial Overview ─────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-tight mb-4">
          Account
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <AccountStatCard
            label="Total Revenue"
            value={compactCurrency(c.totalRevenue)}
            deltaValue={delta(c.totalRevenue, l.totalRevenue)}
          />
          <AccountStatCard
            label="Net Profit"
            value={compactCurrency(c.netProfit)}
            deltaValue={delta(c.netProfit, l.netProfit)}
          />
          <AccountStatCard
            label="Total Expenses"
            value={compactCurrency(c.totalExpenses)}
            deltaValue={delta(c.totalExpenses, l.totalExpenses)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="border-gray-200 shadow-none p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[0.65rem] text-gray-400 font-bold uppercase">
                  Revenue {year}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {compactCurrency(totalSalesThisYear)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[0.65rem] font-bold text-emerald-500 uppercase">
                    Monthly Revenue Trend
                  </span>
                </div>
              </div>
            </div>
            <DashboardLineChart color="#8B2FE8" data={data.monthlyRevenue} />
          </Card>

          <Card className="border-gray-200 shadow-none p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[0.65rem] text-gray-400 font-bold uppercase">
                  Profit {year}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {compactCurrency(c.netProfit)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="text-[0.65rem] font-bold text-blue-500 uppercase">
                    {delta(c.netProfit, l.netProfit)} vs last month
                  </span>
                </div>
              </div>
            </div>
            <DashboardLineChart color="#3b82f6" data={data.monthlyRevenue} />
          </Card>
        </div>
      </section>

      {/* ── 2. Product Overview + Growth ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-tight">
            Product Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ProductTile
              label="Total Products Sold"
              value={compactNumber(c.totalProductsSold)}
              sub={delta(c.totalProductsSold, l.totalProductsSold)}
              subLabel="vs last month"
              valueClassName={
                c.totalProductsSold > l.totalProductsSold
                  ? "text-emerald-600"
                  : "text-gray-900"
              }
            />

            <ProductTile
              label="Total Orders / Customers"
              value={`${compactNumber(c.totalOrders)} / ${compactNumber(c.uniqueCustomers)}`}
              sub={delta(c.totalOrders, l.totalOrders)}
              subLabel="vs last month"
            />

            <ProductTile
              label="Best Selling Product"
              value={c.bestSellingProduct}
              sub={l.bestSellingProduct !== "N/A" ? l.bestSellingProduct : undefined}
              subLabel={l.bestSellingProduct !== "N/A" ? "last month" : undefined}
              className="p-6 rounded-2xl bg-[#E0E7FF]/40 border border-[#E0E7FF] flex flex-col justify-between h-[150px]"
            />

            <ProductTile
              label="Least Selling Product"
              value={c.leastSellingProduct}
              sub={l.leastSellingProduct !== "N/A" ? l.leastSellingProduct : undefined}
              subLabel={l.leastSellingProduct !== "N/A" ? "last month" : undefined}
              className="p-6 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] flex flex-col justify-between h-[150px]"
              labelClassName="text-[#7C3AED]"
              valueClassName="text-[#7C3AED]"
            />

            <ProductTile
              label="Delivered Orders"
              value={compactNumber(c.deliveredOrders)}
              sub={delta(c.deliveredOrders, l.deliveredOrders)}
              subLabel="vs last month"
              className="p-6 rounded-2xl bg-[#FFEDD5] border border-[#FED7AA] flex flex-col justify-between h-[150px]"
              labelClassName="text-[#EA580C]"
              valueClassName="text-[#EA580C]"
            />

            <ProductTile
              label="Remaining Stock"
              value={compactNumber(data.remainingStock)}
              className="p-6 rounded-2xl bg-[#8B2FE8] border border-transparent flex flex-col justify-between h-[150px] shadow-lg shadow-purple-500/20"
              labelClassName="text-white"
              valueClassName="text-white"
            />
          </div>
        </div>

        <Card className="border-gray-200 shadow-none p-6 flex flex-col h-full">
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-sm font-bold text-gray-700">Growth Chart</h2>
            <MoreHorizontal size={18} className="text-gray-400" />
          </div>
          <div className="flex flex-col flex-1">
            <div className="mb-6">
              <p className="text-[0.9rem] font-bold text-gray-900">
                Orders This Month
              </p>
              <p className="text-[0.65rem] text-gray-400">
                Daily distribution by weekday
              </p>
            </div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-5 h-5 rounded bg-[#8B2FE8]" />
              <span className="text-3xl font-bold text-gray-900 tracking-tight">
                {compactNumber(c.totalOrders)}
              </span>
              <span className="text-[0.7rem] text-gray-400 mt-2 font-medium">
                Orders
              </span>
            </div>
            <DashboardBarChart data={data.weeklyOrders} />
          </div>
        </Card>
      </div>

      {/* ── 3. Operational Insights ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="flex flex-col gap-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-tight">
            Sales Overview
          </h2>
          <div className="grid grid-cols-2 gap-5">
            <InsightTile
              label="Avg Orders / Day"
              value={`${c.avgOrdersPerDay}`}
              deltaValue={delta(c.avgOrdersPerDay, l.avgOrdersPerDay)}
            />
            <InsightTile
              label="Failed Order Rate"
              value={`${c.failedOrderRate}%`}
              deltaValue={delta(c.failedOrderRate, l.failedOrderRate)}
            />
            <InsightTile
              label="Confirmation Rate"
              value={`${c.confirmationRate}%`}
              deltaValue={delta(c.confirmationRate, l.confirmationRate)}
            />
            <InsightTile
              label="Delivery Rate"
              value={`${c.deliveryRate}%`}
              deltaValue={delta(c.deliveryRate, l.deliveryRate)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-tight">
            Inventory Insight
          </h2>
          <div className="grid grid-cols-2 gap-5">
            <InsightTile
              label="Stock Received"
              value={compactNumber(c.totalStockIn)}
              deltaValue={delta(c.totalStockIn, l.totalStockIn)}
            />
            <InsightTile
              label="Stock Dispatched"
              value={compactNumber(c.totalStockOut)}
              deltaValue={delta(c.totalStockOut, l.totalStockOut)}
            />
            <InsightTile
              label="Cancelled Orders"
              value={compactNumber(c.cancelledOrders)}
              deltaValue={delta(c.cancelledOrders, l.cancelledOrders)}
            />
            <InsightTile
              label="Total Remaining Stock"
              value={compactNumber(data.remainingStock)}
              deltaValue="0%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
