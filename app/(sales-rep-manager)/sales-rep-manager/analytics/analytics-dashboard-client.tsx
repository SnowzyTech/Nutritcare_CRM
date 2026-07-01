"use client";

import React from "react";

export interface AnalyticsData {
  /** e.g. "this month" or "in July 2026" — used in period-specific labels. */
  monthLabel: string;
  totalProductsSold: { value: string; trend: string };
  totalOrderCustomer: { value: string; trend: string };
  bestSellingProduct: { name: string; subtitle: string };
  generalPerformance: { value: string; trend: string };
  upsellingRate: { value: string; trend: string };
  confirmationRate: { value: string; trend: string };
  deliveryRate: { value: string; trend: string };
  cancellationRate: { value: string; trend: string };
  recoveryRate: { value: string; trend: string };
  reorderRate: { value: string; trend: string };
  kpi: {
    value: string;
    trend: string;
    target: string;
    /** KPI = delivered / handled — shown as substantiating context. */
    delivered: number;
    handled: number;
  };
  /** Monthly bonus derived from the KPI (see lib/bonus.ts). */
  bonus: {
    amount: number;
    eligible: boolean;
    reason?: string;
    /** KPI % the bonus is based on. */
    kpi: number;
    /** "Monthly" / "Weekly" label. */
    periodLabel: string;
  };
  bestSellingTable: Array<{ product: string; amountSold: number }>;
  upsellingTable: Array<{ product: string; noOfUpsell: number }>;
}

export interface AnalyticsHeaderProps {
  type: "team" | "rep";
  repName?: string;
  repTeam?: string;
}

interface AnalyticsDashboardClientProps {
  header: AnalyticsHeaderProps;
  data: AnalyticsData;
  /** Optional working month selector rendered in the header. */
  monthSelector?: React.ReactNode;
  /** Optional report buttons rendered under the tables. */
  reportButtons?: React.ReactNode;
}

function trendTone(trend: string): "up" | "down" | "flat" {
  if (trend.startsWith("-")) return "down";
  if (trend === "—" || trend === "+0%" || trend === "0%") return "flat";
  return "up";
}

function StatCard({ label, value, trend }: { label: string; value: string; trend?: string }) {
  const tone = trend ? trendTone(trend) : "flat";
  return (
    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[150px]">
      <p className="text-sm font-bold text-gray-900">{label}</p>
      <div className="flex items-end justify-between mt-auto">
        <p className="text-[52px] font-bold text-gray-800 leading-none">{value}</p>
        {trend && (
          <p
            className={`text-[11px] font-semibold mb-2 ${
              tone === "up" ? "text-green-500" : tone === "down" ? "text-red-500" : "text-gray-400"
            }`}
          >
            {trend} <span className="text-gray-400 font-medium">vs last month</span>
          </p>
        )}
      </div>
    </div>
  );
}

function BestSellingCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[150px]">
      <p className="text-sm font-bold text-gray-900">{label}</p>
      <div className="flex items-end justify-between mt-auto">
        <p className="text-[32px] font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-[10px] text-gray-400 font-medium text-right mb-2">{subtitle}</p>
      </div>
    </div>
  );
}

function KpiCard({
  value,
  trend,
  target,
  delivered,
  handled,
  monthLabel,
}: {
  value: string;
  trend: string;
  target: string;
  delivered: number;
  handled: number;
  monthLabel: string;
}) {
  const tone = trendTone(trend);
  const kpiNum = parseInt(value, 10) || 0;
  const targetNum = parseInt(target, 10) || 0;
  const met = kpiNum >= targetNum;
  return (
    <div
      className={`rounded-[24px] p-6 text-white flex flex-col justify-between min-h-[150px] ${
        met ? "bg-[#3B0069]" : "bg-gradient-to-br from-red-500 to-red-600"
      }`}
    >
      <div className="flex justify-between items-start">
        <p className="text-sm font-bold">KPI</p>
        <div className="text-right">
          <p className={`text-[11px] ${met ? "text-purple-200" : "text-red-100"}`}>Target for the month:</p>
          <p className="text-lg font-bold">{target}</p>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-end">
          <p className="text-[52px] font-bold leading-none">{value}</p>
          <p className="text-[11px] font-bold mb-2">
            <span className={tone === "down" ? "text-red-300" : "text-white"}>{trend}</span>{" "}
            <span className={`font-medium ${met ? "text-purple-200" : "text-red-100"}`}>vs last month</span>
          </p>
        </div>
        <p className={`text-[11px] font-medium mt-2 ${met ? "text-purple-200" : "text-red-100"}`}>
          {handled > 0
            ? `${delivered} delivered of ${handled} handled ${monthLabel}${met ? "" : ` · need ${targetNum - kpiNum}% more`}`
            : `No orders handled ${monthLabel}`}
        </p>
      </div>
    </div>
  );
}

function BonusCard({
  amount,
  eligible,
  reason,
  kpi,
  periodLabel,
}: {
  amount: number;
  eligible: boolean;
  reason?: string;
  kpi: number;
  periodLabel: string;
}) {
  return (
    <div
      className={`rounded-[24px] p-6 border flex flex-col justify-between min-h-[150px] ${
        eligible ? "bg-[#FAF5FF] border-[#E9D5FF]" : "bg-gray-50 border-gray-200"
      }`}
    >
      <div className="flex justify-between items-start">
        <p className="text-sm font-bold text-gray-900">{periodLabel} Bonus</p>
        {eligible && (
          <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
            Eligible
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        {eligible ? (
          <>
            <p className="text-[32px] font-bold text-gray-800 leading-none tracking-tight">
              ₦{amount.toLocaleString()}
            </p>
            <div className="text-right">
              <p className="text-base font-bold text-green-500">{kpi}%</p>
              <p className="text-[10px] font-bold text-gray-400">KPI</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-gray-400 tracking-tight">Not Eligible</span>
              {reason && <span className="text-[11px] text-gray-500 mt-1">{reason}</span>}
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

export function AnalyticsDashboardClient({ header, data, monthSelector, reportButtons }: AnalyticsDashboardClientProps) {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10 pb-20 md:pt-14">

      {/* Header */}
      {header.type === "rep" ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden shrink-0">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(header.repName || "")}&background=f3f4f6&color=6b7280`}
                alt={header.repName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1">
                <h1 className="text-2xl md:text-[28px] font-bold text-gray-800 leading-tight">{header.repName}’s</h1>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-semibold text-sm">Manager Mode</span>
                  <span className="bg-[#F3E8FF] text-[#A020F0] text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
                    {header.repTeam}
                  </span>
                </div>
              </div>
              <p className="text-gray-500 font-medium">Dashboard</p>
            </div>
          </div>
          {monthSelector}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Team&apos;s Analytics</h1>
          {monthSelector}
        </div>
      )}

      {header.type === "rep" && (
        <h2 className="text-2xl font-bold text-gray-600 -mb-4">Analytics</h2>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Row 1 */}
        <StatCard label="Total Products Sold" value={data.totalProductsSold.value} trend={data.totalProductsSold.trend} />
        <StatCard label="Total Order/Customer" value={data.totalOrderCustomer.value} trend={data.totalOrderCustomer.trend} />
        <BestSellingCard label="Best Selling Product" value={data.bestSellingProduct.name} subtitle={data.bestSellingProduct.subtitle} />

        {/* Row 2 */}
        <StatCard label="General Performance" value={data.generalPerformance.value} trend={data.generalPerformance.trend} />
        <StatCard label="Upselling Rate" value={data.upsellingRate.value} trend={data.upsellingRate.trend} />
        <StatCard label="Confirmation Rate" value={data.confirmationRate.value} trend={data.confirmationRate.trend} />

        {/* Row 3 */}
        <StatCard label="Delivery Rate" value={data.deliveryRate.value} trend={data.deliveryRate.trend} />
        <StatCard label="Cancellation Rate" value={data.cancellationRate.value} trend={data.cancellationRate.trend} />
        <StatCard label="Recovery Rate" value={data.recoveryRate.value} trend={data.recoveryRate.trend} />

        {/* Row 4 */}
        <StatCard label="Reorder Rate" value={data.reorderRate.value} trend={data.reorderRate.trend} />
        <KpiCard
          value={data.kpi.value}
          trend={data.kpi.trend}
          target={data.kpi.target}
          delivered={data.kpi.delivered}
          handled={data.kpi.handled}
          monthLabel={data.monthLabel}
        />
        <BonusCard
          amount={data.bonus.amount}
          eligible={data.bonus.eligible}
          reason={data.bonus.reason}
          kpi={data.bonus.kpi}
          periodLabel={data.bonus.periodLabel}
        />
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-gray-200 my-4"></div>

      {/* Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* Left Table */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Best Selling Product</h3>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#F8F7FB]">
                <th className="px-6 py-4 font-bold text-gray-500 rounded-l-xl w-1/2">Product</th>
                <th className="px-6 py-4 font-bold text-gray-500 rounded-r-xl text-center">Amount Sold</th>
              </tr>
            </thead>
            <tbody>
              {data.bestSellingTable.length === 0 ? (
                <tr><td colSpan={2} className="px-6 py-5 text-center text-gray-400">No data for this month</td></tr>
              ) : data.bestSellingTable.map((row, idx) => (
                <tr key={idx} className={idx % 2 !== 0 ? "bg-[#F8F7FB]" : "bg-white"}>
                  <td className="px-6 py-5 font-medium text-gray-500 rounded-l-xl">{row.product}</td>
                  <td className="px-6 py-5 font-medium text-gray-500 text-center rounded-r-xl">{row.amountSold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Table */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Upselling Rate</h3>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#F8F7FB]">
                <th className="px-6 py-4 font-bold text-gray-500 rounded-l-xl w-1/2">Product</th>
                <th className="px-6 py-4 font-bold text-gray-500 rounded-r-xl text-center">No of Upsell</th>
              </tr>
            </thead>
            <tbody>
              {data.upsellingTable.length === 0 ? (
                <tr><td colSpan={2} className="px-6 py-5 text-center text-gray-400">No data for this month</td></tr>
              ) : data.upsellingTable.map((row, idx) => (
                <tr key={idx} className={idx % 2 !== 0 ? "bg-[#F8F7FB]" : "bg-white"}>
                  <td className="px-6 py-5 font-medium text-gray-500 rounded-l-xl">{row.product}</td>
                  <td className="px-6 py-5 font-medium text-gray-500 text-center rounded-r-xl">{row.noOfUpsell}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reportButtons}
    </div>
  );
}
