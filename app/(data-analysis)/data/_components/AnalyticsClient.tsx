'use client';

import React, { useState, useTransition } from 'react';
import { ChevronDown, ArrowUpRight, Download } from 'lucide-react';
import {
  TeamAnalyticsEntry,
  RepAnalyticsData,
} from '@/modules/data-analysis/services/data-analysis.service';
import {
  fetchTeamsAnalyticsForMonth,
  fetchCompanyAnalyticsForMonth,
  fetchTeamsAnalyticsForPeriod,
  fetchCompanyAnalyticsForPeriod,
} from '@/modules/data-analysis/actions/data-analysis.action';
import type { Period } from '@/modules/data-analysis/services/data-analysis.service';

const KPI_TARGET = 65; // 65% KPI target
const MIN_ORDERS_PER_REP_WEEK = 180; // 30 orders/day * 6 days

// Weekly bonus tiers based on KPI (delivered/total)
// Minimum orders scale by number of sales reps: 180 orders/week per rep
function calculateWeeklyBonus(
  kpi: number,
  totalOrders: number,
  salesRepCount: number
): { amount: number; eligible: boolean; reason?: string } {
  // Scale minimum orders by number of sales reps
  const minRequired = MIN_ORDERS_PER_REP_WEEK * Math.max(salesRepCount, 1);

  if (totalOrders < minRequired) {
    return {
      amount: 0,
      eligible: false,
      reason: `Need ${minRequired} orders (${totalOrders} handled)`
    };
  }

  if (kpi < 70) {
    return {
      amount: 0,
      eligible: false,
      reason: "KPI below 70%"
    };
  }

  if (kpi >= 90) {
    return { amount: 50000, eligible: true };
  } else if (kpi >= 80) {
    return { amount: 35000, eligible: true };
  } else { // 70-79%
    return { amount: 20000, eligible: true };
  }
}

const METRIC_KEYS = [
  'totalProductsSold', 'totalOrderCustomer', 'bestSellingProduct',
  'generalPerformance', 'upsellingRate', 'reorderRate',
  'deliveryRate', 'cancellationRate', 'recoveryRate',
] as const;

const METRIC_LABELS: Record<string, string> = {
  totalProductsSold: 'Total Products Sold',
  totalOrderCustomer: 'Total Order/Customer',
  bestSellingProduct: 'Best Selling Product',
  generalPerformance: 'General Performance',
  upsellingRate: 'Upselling Rate',
  reorderRate: 'Reorder Rate',
  deliveryRate: 'Delivery Rate',
  cancellationRate: 'Cancellation Rate',
  recoveryRate: 'Recovery Rate',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function monthIndexFromName(name: string): { month: number; year: number } {
  const now = new Date();
  if (name === 'This Month') return { month: now.getMonth(), year: now.getFullYear() };
  const idx = MONTHS.indexOf(name);
  const year = idx <= now.getMonth() ? now.getFullYear() : now.getFullYear() - 1;
  return { month: idx, year };
}

function buildMetricByKey(data: RepAnalyticsData | undefined) {
  const map: Record<string, { value: string | number; change: string }> = {};
  if (!data) return map;
  data.metrics.forEach((m) => {
    const key = Object.entries(METRIC_LABELS).find(([, label]) => label === m.label)?.[0];
    if (key) map[key] = { value: m.value, change: m.change };
  });
  return map;
}

function MonthDropdown({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
      >
        <span className="text-[10px] font-bold text-gray-500">{value}</span>
        <ChevronDown size={10} className="text-gray-400" />
      </button>
      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1 min-w-[120px] max-h-[200px] overflow-y-auto">
            {['This Month', ...MONTHS].map((month) => (
              <button
                key={month}
                onClick={() => { onChange(month); setIsOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-purple-50 transition-colors ${value === month ? 'text-[#A020F0] font-bold bg-purple-50' : 'text-gray-600'}`}
              >
                {month}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  data,
  isPending,
  periodLabel = 'month',
}: {
  label: string;
  data: { value: string | number; change: string } | undefined;
  isPending: boolean;
  periodLabel?: string;
}) {
  const isBestProduct = label === 'Best Selling Product';
  const value = data?.value ?? '—';
  const change = data?.change ?? '—';

  return (
    <div className={`bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-800">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className={`font-black tracking-tight ${isBestProduct ? 'text-2xl text-gray-900' : 'text-3xl text-gray-600'}`}>
          {value}
        </span>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-green-500 font-bold text-xs">{change}</div>
          <span className="text-[10px] text-gray-400 font-medium">vs last {periodLabel}</span>
        </div>
      </div>
    </div>
  );
}

interface AnalyticsClientProps {
  teamsData?: TeamAnalyticsEntry[];
  companyData: RepAnalyticsData;
}

export function AnalyticsClient({ teamsData = [], companyData }: AnalyticsClientProps) {
  // `selected` is either 'all' (company-wide rollup) or a team index into currentTeamsData.
  const [selected, setSelected] = useState<'all' | number>('all');
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [currentTeamsData, setCurrentTeamsData] = useState(teamsData);
  const [currentCompanyData, setCurrentCompanyData] = useState(companyData);
  const [isPending, startTransition] = useTransition();

  // 'all' shows the company-wide rollup; otherwise the selected team's metrics.
  const activeMetrics: RepAnalyticsData | undefined =
    selected === 'all'
      ? currentCompanyData
      : currentTeamsData[selected]?.currentMetrics;

  const metricByKey = buildMetricByKey(activeMetrics);

  // Keep a team selection valid if the teams list shrinks after a refetch.
  const clampSelection = (teamsLen: number) =>
    setSelected((prev) => (prev === 'all' ? 'all' : Math.min(prev, Math.max(teamsLen - 1, 0))));

  // Refetch both the per-team and company rollups together, so toggling the
  // selector between "All Teams" and a specific team needs no extra fetch.
  function handlePeriodChange(period: Period) {
    // No-op only if already where this button points (already week, or already
    // showing the current month) — otherwise snap back to the current period.
    if (period === selectedPeriod && (period === 'week' || selectedMonth === 'This Month')) return;
    setSelectedPeriod(period);
    setSelectedMonth('This Month'); // anchor back to the current month/week
    startTransition(async () => {
      const [teams, company] = await Promise.all([
        fetchTeamsAnalyticsForPeriod(period),
        fetchCompanyAnalyticsForPeriod(period),
      ]);
      setCurrentTeamsData(teams);
      setCurrentCompanyData(company);
      clampSelection(teams.length);
    });
  }

  function handleMonthChange(month: string) {
    setSelectedMonth(month);
    const { month: m, year: y } = monthIndexFromName(month);
    startTransition(async () => {
      const [teams, company] = await Promise.all([
        fetchTeamsAnalyticsForMonth(m, y),
        fetchCompanyAnalyticsForMonth(m, y),
      ]);
      setCurrentTeamsData(teams);
      setCurrentCompanyData(company);
      clampSelection(teams.length);
    });
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-700">
          {selected === 'all'
            ? 'Sales Analytics'
            : `${currentTeamsData[selected]?.teamName ?? 'Team'}'s Analytics`}
        </h1>
        <div className="flex items-center gap-4">
          {/* Team selector — "All Teams" (company-wide) or a specific team */}
          <div className="relative">
            <select
              value={selected === 'all' ? 'all' : String(selected)}
              onChange={(e) => setSelected(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="appearance-none bg-black text-white px-4 py-2 rounded-lg text-xs font-bold pr-8 focus:outline-none cursor-pointer"
            >
              <option value="all">All Teams</option>
              {currentTeamsData.map((t, i) => (
                <option key={t.teamId} value={i}>{t.teamName}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white" />
          </div>

          {/* Period toggle (Week/Month) */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handlePeriodChange('month')}
              disabled={isPending}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedPeriod === 'month'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePeriodChange('week')}
              disabled={isPending}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedPeriod === 'week'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              This Week
            </button>
          </div>

          {/* Month dropdown — only show when period is month */}
          {selectedPeriod === 'month' && (
            <MonthDropdown value={selectedMonth} onChange={handleMonthChange} disabled={isPending} />
          )}
        </div>
      </div>

      <>
          {/* Metrics Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
            {METRIC_KEYS.map((key) => (
              <MetricCard
                key={key}
                label={METRIC_LABELS[key]}
                data={metricByKey[key]}
                isPending={isPending}
                periodLabel={selectedPeriod === 'week' ? 'week' : 'month'}
              />
            ))}

            {/* KPI Box */}
            {(() => {
              const kpiValue = activeMetrics?.kpi.value ?? 0;
              const kpiMet = kpiValue >= KPI_TARGET;
              const salesRepCount = activeMetrics?.salesRepCount ?? 1;
              const bonus = calculateWeeklyBonus(kpiValue, activeMetrics?.kpi.totalOrders ?? 0, salesRepCount);
              const periodLabel = selectedPeriod === 'week' ? 'week' : 'month';

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
                      <span className="text-[10px] font-medium opacity-60">vs last {periodLabel}</span>
                    </div>
                  </div>

                  {/* Bonus Card */}
                  <div className={`p-6 rounded-xl border shadow-sm flex flex-col justify-between ${
                    bonus.eligible
                      ? "bg-[#FAF8FF] border-[#F3E8FF]"
                      : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm font-bold text-gray-900">
                        {selectedPeriod === 'week' ? 'Weekly' : 'Monthly'} Bonus
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
          <div className={`mt-12 space-y-8 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Best Selling */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-700">Best Selling Product</h3>
                  <span className="text-[10px] text-gray-400 font-medium">{selectedMonth}</span>
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
                  <span className="text-[10px] text-gray-400 font-medium">{selectedMonth}</span>
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
