'use client';

import React, { useState } from 'react';
import { ChevronDown, ArrowUpRight, Download } from 'lucide-react';
import { TeamAnalyticsEntry } from '@/modules/data-analysis/services/data-analysis.service';

const METRIC_KEYS = [
  'totalProductsSold', 'totalOrderCustomer', 'bestSellingProduct',
  'generalPerformance', 'upsellingRate', 'confirmationRate',
  'deliveryRate', 'cancellationRate', 'recoveryRate',
] as const;

const METRIC_LABELS: Record<string, string> = {
  totalProductsSold: 'Total Products Sold',
  totalOrderCustomer: 'Total Order/Customer',
  bestSellingProduct: 'Best Selling Product',
  generalPerformance: 'General Performance',
  upsellingRate: 'Upselling Rate',
  confirmationRate: 'Comfirmation Rate',
  deliveryRate: 'Delivery Rate',
  cancellationRate: 'Cancellation Rate',
  recoveryRate: 'Recovery Rate',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function MonthDropdown({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <span className="text-[10px] font-bold text-gray-500">{value}</span>
        <ChevronDown size={10} className="text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
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
      )}
    </div>
  );
}

function MetricCard({ label, data }: { label: string; data: { value: string | number; change: string } | undefined }) {
  const [month, setMonth] = useState('This Month');
  const isBestProduct = label === 'Best Selling Product';
  const value = data?.value ?? '—';
  const change = data?.change ?? '—';

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-800">{label}</span>
        <MonthDropdown value={month} onChange={setMonth} />
      </div>
      <div className="flex items-end justify-between">
        <span className={`font-black tracking-tight ${isBestProduct ? 'text-2xl text-gray-900' : 'text-3xl text-gray-600'}`}>
          {value}
        </span>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-green-500 font-bold text-xs">{change}</div>
          <span className="text-[10px] text-gray-400 font-medium">vs last month</span>
        </div>
      </div>
    </div>
  );
}

interface AnalyticsClientProps {
  teamsData?: TeamAnalyticsEntry[];
}

export function AnalyticsClient({ teamsData = [] }: AnalyticsClientProps) {
  const [activeView, setActiveView] = useState<'team' | 'sales'>('team');
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0);
  const [tableMonth, setTableMonth] = useState('This Month');

  const selectedTeam = teamsData[selectedTeamIndex];
  const metrics = selectedTeam?.currentMetrics;

  // Map service metric labels to the metric key shape the UI expects
  const metricByKey: Record<string, { value: string | number; change: string }> = {};
  if (metrics) {
    metrics.metrics.forEach((m) => {
      const key = Object.entries(METRIC_LABELS).find(([, label]) => label === m.label)?.[0];
      if (key) metricByKey[key] = { value: m.value, change: m.change };
    });
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-700">Team's Analytics</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('team')}
              className={`px-6 py-2 rounded-md text-xs font-bold transition-all ${activeView === 'team' ? 'bg-[#A020F0] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Team Analytics
            </button>
            <button
              onClick={() => setActiveView('sales')}
              className={`px-6 py-2 rounded-md text-xs font-bold transition-all ${activeView === 'sales' ? 'bg-[#A020F0] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sales Analytics
            </button>
          </div>

          {teamsData.length > 0 && (
            <div className="relative">
              <select
                value={selectedTeamIndex}
                onChange={(e) => setSelectedTeamIndex(Number(e.target.value))}
                className="appearance-none bg-black text-white px-4 py-2 rounded-lg text-xs font-bold pr-8 focus:outline-none cursor-pointer"
              >
                {teamsData.map((t, i) => (
                  <option key={t.teamId} value={i}>{t.teamName}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white" />
            </div>
          )}
        </div>
      </div>

      {teamsData.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No teams found. Create sales teams to see analytics.</div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {METRIC_KEYS.map((key) => (
              <MetricCard key={key} label={METRIC_LABELS[key]} data={metricByKey[key]} />
            ))}

            {/* KPI Box */}
            <div className="bg-gradient-to-br from-[#532194] to-[#3D1A6E] p-6 rounded-xl text-white flex flex-col justify-between relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 text-[#D6BBFB]">KPI</span>
                  <p className="text-3xl font-black">{metrics?.kpi.value ?? '—'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-medium opacity-60">Target for the month:</span>
                  <p className="text-xs font-bold">{metrics?.kpi.target ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 relative z-10">
                <span className="text-green-400 text-sm font-bold">{metrics?.kpi.change ?? '—'}</span>
                <span className="text-[10px] font-medium opacity-60">vs last month</span>
              </div>
            </div>
          </div>

          {/* Tables — Team Analytics view only */}
          {activeView === 'team' && (
            <div className="mt-12 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Best Selling */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-700">Best Selling Product</h3>
                    <MonthDropdown value={tableMonth} onChange={setTableMonth} />
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
                        {metrics?.bestSellingProducts && metrics.bestSellingProducts.length > 0 ? (
                          metrics.bestSellingProducts.map((p, i) => (
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
                    <MonthDropdown value={tableMonth} onChange={setTableMonth} />
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
                        {metrics?.upsellingRate && metrics.upsellingRate.length > 0 ? (
                          metrics.upsellingRate.map((p, i) => (
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
          )}
        </>
      )}
    </div>
  );
}
