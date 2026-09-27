'use client';

import React, { useState } from 'react';
import { ChevronDown, ArrowUpRight, Download } from 'lucide-react';
import {
  TeamAnalyticsEntry,
  RepAnalyticsData,
} from '@/modules/data-analysis/services/data-analysis.service';
import { calculateBonus, KPI_TARGET, type BonusPeriod } from '@/lib/bonus';
import { StaffPeriodFilter } from '@/components/admin/staff-period-filter';

const METRIC_KEYS = [
  'totalProductsSold', 'totalOrderCustomer', 'bestSellingProduct',
  'generalPerformance', 'upsellingRate', 'reorderRate',
  'deliveryRate', 'cancellationRate', 'recoveryRate',
] as const;

const METRIC_LABELS: Record<string, string> = {
  totalProductsSold: 'Total Products Sold (Delivered)',
  totalOrderCustomer: 'Total Orders',
  bestSellingProduct: 'Best Selling Product',
  generalPerformance: 'General Performance',
  upsellingRate: 'Upselling Rate',
  reorderRate: 'Reorder Rate',
  deliveryRate: 'Delivery Rate',
  cancellationRate: 'Cancellation Rate',
  recoveryRate: 'Recovery Rate',
};

function buildMetricByKey(data: RepAnalyticsData | undefined) {
  const map: Record<string, { value: string | number; change: string }> = {};
  if (!data) return map;
  data.metrics.forEach((m) => {
    const key = Object.entries(METRIC_LABELS).find(([, label]) => label === m.label)?.[0];
    if (key) map[key] = { value: m.value, change: m.change };
  });
  return map;
}

function MetricCard({
  label,
  data,
  comparisonLabel,
}: {
  label: string;
  data: { value: string | number; change: string } | undefined;
  comparisonLabel: string;
}) {
  const isBestProduct = label === 'Best Selling Product';
  const value = data?.value ?? '—';
  const change = data?.change ?? '—';

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-800">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className={`font-black tracking-tight ${isBestProduct ? 'text-2xl text-gray-900' : 'text-3xl text-gray-600'}`}>
          {value}
        </span>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-green-500 font-bold text-xs">{change}</div>
          <span className="text-[10px] text-gray-400 font-medium">{comparisonLabel}</span>
        </div>
      </div>
    </div>
  );
}

/** The selected Day / Week / Month period, resolved on the server (lib/staff-period.ts). */
export type AnalyticsPeriodInfo = {
  /** e.g. "vs previous day" / "vs last week" / "vs last month". */
  comparisonLabel: string;
  /** e.g. "Today" / "This Week" / "July 2026" — table captions. */
  valueLabel: string;
  /** null on the Day view — bonuses are weekly/monthly only. */
  bonusPeriod: BonusPeriod | null;
};

interface AnalyticsClientProps {
  teamsData?: TeamAnalyticsEntry[];
  companyData: RepAnalyticsData;
  period: AnalyticsPeriodInfo;
}

export function AnalyticsClient({ teamsData = [], companyData, period }: AnalyticsClientProps) {
  // `selected` is either 'all' (company-wide rollup) or a team index into teamsData.
  // The period lives in the URL (StaffPeriodFilter), so switching it re-renders
  // this page with fresh data while the team selection is kept.
  const [selected, setSelected] = useState<'all' | number>('all');
  // Keep a team selection valid if the teams list shrinks between periods.
  const activeSelection: 'all' | number =
    selected === 'all' || selected < teamsData.length ? selected : 'all';

  // 'all' shows the company-wide rollup; otherwise the selected team's metrics.
  const activeMetrics: RepAnalyticsData | undefined =
    activeSelection === 'all'
      ? companyData
      : teamsData[activeSelection]?.currentMetrics;

  const metricByKey = buildMetricByKey(activeMetrics);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-700">
          {activeSelection === 'all'
            ? 'Sales Analytics'
            : `${teamsData[activeSelection]?.teamName ?? 'Team'}'s Analytics`}
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          {/* Team selector — "All Teams" (company-wide) or a specific team */}
          <div className="relative">
            <select
              value={activeSelection === 'all' ? 'all' : String(activeSelection)}
              onChange={(e) => setSelected(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="appearance-none bg-black text-white px-4 py-2 rounded-lg text-xs font-bold pr-8 focus:outline-none cursor-pointer"
            >
              <option value="all">All Teams</option>
              {teamsData.map((t, i) => (
                <option key={t.teamId} value={i}>{t.teamName}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white" />
          </div>

          {/* Day / Week (Mon–Sun) / Month — shared with every analytics screen */}
          <StaffPeriodFilter />
        </div>
      </div>

      <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {METRIC_KEYS.map((key) => (
              <MetricCard
                key={key}
                label={METRIC_LABELS[key]}
                data={metricByKey[key]}
                comparisonLabel={period.comparisonLabel}
              />
            ))}

            {/* KPI Box */}
            {(() => {
              const kpiValue = activeMetrics?.kpi.value ?? 0;
              const kpiMet = kpiValue >= KPI_TARGET;
              const salesRepCount = activeMetrics?.salesRepCount ?? 1;
              // Threshold scales with BOTH the period (180/wk vs 720/mo) and the
              // number of reps in the current selection (team, or all reps for
              // "All Teams"), matching the sales-rep portal and manager views.
              // Bonuses are weekly/monthly only — the Day view shows "not applicable".
              const bonus = period.bonusPeriod
                ? calculateBonus(kpiValue, activeMetrics?.kpi.totalOrders ?? 0, period.bonusPeriod, salesRepCount)
                : { amount: 0, eligible: false, reason: 'Bonuses apply to weekly/monthly periods' };
              const bonusTitle =
                period.bonusPeriod === 'week' ? 'Weekly Bonus' : period.bonusPeriod === 'month' ? 'Monthly Bonus' : 'Bonus';

              return (
                <>
                  <div className={`p-6 rounded-xl text-white flex flex-col justify-between relative overflow-hidden group shadow-lg ${
                    kpiMet
                      ? "bg-gradient-to-br from-[#532194] to-[#3D1A6E]"
                      : "bg-gradient-to-br from-red-500 to-red-600"
                  }`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start relative z-10">
                      <div className="space-y-1">
                        <span className={`text-[10px] font-bold uppercase tracking-widest opacity-80 ${kpiMet ? "text-[#D6BBFB]" : "text-red-100"}`}>
                          KPI — Target: {KPI_TARGET}%
                        </span>
                        <p className="text-3xl font-black">{kpiValue}%</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-medium opacity-60">Delivered / Handled:</span>
                        <p className="text-xs font-bold">
                          {activeMetrics?.kpi.ordersDelivered ?? 0} / {activeMetrics?.kpi.totalOrders ?? 0}
                        </p>
                      </div>
                    </div>
                    {!kpiMet && (
                      <div className="text-xs font-medium text-red-200 mt-2 relative z-10">
                        Need {KPI_TARGET - kpiValue}% more to reach target
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-4 relative z-10">
                      <span className="text-green-400 text-sm font-bold">{activeMetrics?.kpi.change ?? '—'}</span>
                      <span className="text-[10px] font-medium opacity-60">{period.comparisonLabel}</span>
                    </div>
                  </div>

                  {/* Bonus Card */}
                  <div className={`p-6 rounded-xl border shadow-sm flex flex-col justify-between ${
                    bonus.eligible
                      ? "bg-[#FAF8FF] border-[#F3E8FF]"
                      : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm font-bold text-gray-900">{bonusTitle}</span>
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
                            <p className="text-base font-bold text-green-500">{kpiValue}%</p>
                            <p className="text-[10px] font-bold text-gray-500">KPI</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold text-gray-400 tracking-tight">Not Eligible</span>
                            <span className="text-xs text-gray-500 mt-1">{bonus.reason}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold text-gray-400">{kpiValue}%</p>
                            <p className="text-[10px] font-bold text-gray-400">KPI</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Tables */}
          <div className="mt-12 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Best Selling */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-700">Best Selling Product</h3>
                  <span className="text-[10px] text-gray-400 font-medium">{period.valueLabel}</span>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase">Product</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Amount Sold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activeMetrics?.bestSellingProducts && activeMetrics.bestSellingProducts.length > 0 ? (
                        activeMetrics.bestSellingProducts.map((p, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 text-xs text-gray-600 font-medium">{p.product}</td>
                            <td className="px-5 py-3 text-xs text-gray-600 font-bold text-right">{p.amount}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={2} className="px-5 py-4 text-xs text-gray-400 text-center">No data for this period</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <button className="flex items-center justify-center gap-2 w-full py-3 bg-[#F4EBFF] text-[#A020F0] rounded-xl text-xs font-bold transition-transform active:scale-95 hover:bg-[#E9D5FF]">
                  <Download size={14} />
                  Generate Weekly Report
                  <ArrowUpRight size={14} />
                </button>
              </div>

              {/* Upselling Rate */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-700">Upselling Rate</h3>
                  <span className="text-[10px] text-gray-400 font-medium">{period.valueLabel}</span>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase">Product</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">No of Upsell</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activeMetrics?.upsellingRate && activeMetrics.upsellingRate.length > 0 ? (
                        activeMetrics.upsellingRate.map((p, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 text-xs text-gray-600 font-medium">{p.product}</td>
                            <td className="px-5 py-3 text-xs text-gray-600 font-bold text-right">{p.upsell}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={2} className="px-5 py-4 text-xs text-gray-400 text-center">No data for this period</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <button className="flex items-center justify-center gap-2 w-full py-3 bg-[#F4EBFF] text-[#A020F0] rounded-xl text-xs font-bold transition-transform active:scale-95 hover:bg-[#E9D5FF]">
                  <Download size={14} />
                  Generate Monthly Report
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </>
    </div>
  );
}
