'use client';

import React from 'react';
import { 
  ChevronDown, 
  MessageCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Share2
} from 'lucide-react';
import { MOCK_ANALYTICS, SALES_REPS } from '@/lib/mock-data/data-analysis';
import Image from 'next/image';

export function AnalyticsDashboardClient({ id }: { id: string }) {
  const rep = SALES_REPS.find(r => r.id === id) || SALES_REPS[0];
  const analytics = MOCK_ANALYTICS[id] || MOCK_ANALYTICS['adebimpe-tolani'];

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
              <Image 
                src={rep.avatar} 
                alt={rep.name} 
                fill 
                className="object-cover" 
                sizes="48px"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{rep.name}'s</h1>
              <p className="text-sm text-gray-400 font-medium">Dashboard</p>
            </div>
          </div>
        </div>
        
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 cursor-pointer shadow-sm hover:bg-purple-200 transition-colors">
          <MessageCircle size={20} fill="currentColor" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-700">Analytics</h2>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {analytics.metrics.map((metric: any, index: number) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">{metric.label}</span>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                <span className="text-[10px] font-bold text-gray-500">This Month</span>
                <ChevronDown size={10} className="text-gray-400" />
              </div>
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
              <p className="text-4xl font-black">{analytics.kpi.value}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-medium opacity-60">Target for the month:</span>
              <p className="text-xs font-bold">{analytics.kpi.target}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <span className="text-green-400 text-sm font-bold">{analytics.kpi.change}</span>
            <span className="text-[10px] font-medium opacity-60">vs last month</span>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {/* Best Selling Products */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">Best Selling Product</h3>
            <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
              <span className="text-[11px] font-bold text-gray-500">This Month</span>
              <ChevronDown size={12} className="text-gray-400" />
            </div>
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
                {analytics.bestSellingProducts.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-600 font-medium">{p.product}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 font-bold text-right">{p.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 self-start cursor-pointer">
              <span className="text-[11px] font-bold text-gray-500">September</span>
              <ChevronDown size={12} className="text-gray-400" />
            </div>
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
            <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
              <span className="text-[11px] font-bold text-gray-500">This Month</span>
              <ChevronDown size={12} className="text-gray-400" />
            </div>
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
                {analytics.upsellingRate.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-600 font-medium">{p.product}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 font-bold text-right">{p.upsell}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 self-start cursor-pointer">
              <span className="text-[11px] font-bold text-gray-500">September</span>
              <ChevronDown size={12} className="text-gray-400" />
            </div>
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
