'use client';

import React, { useState, useTransition } from 'react';
import { ChevronDown, MessageCircle, ArrowUpRight, Share2 } from 'lucide-react';
import { RepAnalyticsData, SalesRepProfile } from '@/modules/data-analysis/services/data-analysis.service';
import { fetchAnalyticsForMonth } from '@/modules/data-analysis/actions/data-analysis.action';
import Image from 'next/image';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function monthIndexFromName(name: string): { month: number; year: number } {
  const now = new Date();
  if (name === 'This Month') {
    return { month: now.getMonth(), year: now.getFullYear() };
  }
  const idx = MONTHS.indexOf(name);
  // If the month hasn't happened yet this year, use previous year
  const year = idx <= now.getMonth() ? now.getFullYear() : now.getFullYear() - 1;
  return { month: idx, year };
}

function MonthDropdown({ value, onChange, disabled }: { value: string; onChange: (val: string) => void; disabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
      >
        <span className="text-[10px] font-bold text-gray-500">{value}</span>
        <ChevronDown size={10} className="text-gray-400" />
      </div>
      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1 min-w-[120px] max-h-[200px] overflow-y-auto">
            {['This Month', ...MONTHS].map((month) => (
              <button
                key={month}
                onClick={() => { onChange(month); setIsOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-[10px] font-bold hover:bg-purple-50 transition-colors ${value === month ? 'text-[#A020F0] bg-purple-50' : 'text-gray-600'}`}
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

interface AnalyticsDashboardClientProps {
  analytics: RepAnalyticsData;
  repProfile: SalesRepProfile;
}

export function AnalyticsDashboardClient({ analytics, repProfile }: AnalyticsDashboardClientProps) {
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  const [currentAnalytics, setCurrentAnalytics] = useState(analytics);
  const [isPending, startTransition] = useTransition();

  function handleMonthChange(month: string) {
    setSelectedMonth(month);
    const { month: m, year: y } = monthIndexFromName(month);
    startTransition(async () => {
      const data = await fetchAnalyticsForMonth(repProfile.id, m, y);
      setCurrentAnalytics(data);
    });
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
            <Image src={repProfile.avatarUrl} alt={repProfile.name} fill className="object-cover" sizes="48px" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{repProfile.name}&apos;s</h1>
            <p className="text-sm text-gray-400 font-medium">Dashboard</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 cursor-pointer shadow-sm hover:bg-purple-200 transition-colors">
          <MessageCircle size={20} fill="currentColor" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-700">Analytics</h2>
        <MonthDropdown value={selectedMonth} onChange={handleMonthChange} disabled={isPending} />
      </div>

      {/* Metrics Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        {currentAnalytics.metrics.map((metric, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">{metric.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black text-gray-900 tracking-tight">{metric.value}</span>
              <div className="flex flex-col items-end">
                <div className={`flex items-center gap-1 text-[11px] font-bold ${metric.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {metric.change}
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{metric.subText || 'vs last month'}</span>
              </div>
            </div>
          </div>
        ))}

        {/* KPI Box */}
        <div className="bg-[#532194] p-8 rounded-2xl text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest opacity-80 text-[#D6BBFB]">KPI</span>
              <p className="text-4xl font-black">{currentAnalytics.kpi.value}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-medium opacity-60">Target for the month:</span>
              <p className="text-xs font-bold">{currentAnalytics.kpi.target}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-green-400 text-sm font-bold">{currentAnalytics.kpi.change}</span>
            <span className="text-[10px] font-medium opacity-60">vs last month</span>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        {/* Best Selling Products */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">Best Selling Product</h3>
          </div>
          <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase">Product</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase text-right">Amount Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentAnalytics.bestSellingProducts.length > 0 ? currentAnalytics.bestSellingProducts.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-600 font-medium">{p.product}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 font-bold text-right">{p.amount}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={2} className="px-6 py-4 text-sm text-gray-400 text-center">No data for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4">
            <button className="flex items-center justify-center gap-2 w-full py-3 bg-[#F4EBFF] text-[#A020F0] rounded-xl text-sm font-bold transition-transform active:scale-95">
              <Share2 size={16} />
              Generate Weekly Report
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>

        {/* Upselling Rate */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">Upselling Rate</h3>
          </div>
          <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase">Product</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase text-right">No of Upsell</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentAnalytics.upsellingRate.length > 0 ? currentAnalytics.upsellingRate.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-600 font-medium">{p.product}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 font-bold text-right">{p.upsell}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={2} className="px-6 py-4 text-sm text-gray-400 text-center">No data for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4">
            <button className="flex items-center justify-center gap-2 w-full py-3 bg-[#F4EBFF] text-[#A020F0] rounded-xl text-sm font-bold transition-transform active:scale-95">
              <Share2 size={16} />
              Generate Monthly Report
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
