'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown
} from 'lucide-react';
import { SalesRepProfile } from '@/modules/data-analysis/services/data-analysis.service';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function MonthDropdown({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <span className="text-[10px] font-bold text-gray-500">{value}</span>
        <ChevronDown size={10} className="text-gray-400" />
      </div>
      {isOpen && (
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

interface SalesRepSummaryClientProps {
  repData: SalesRepProfile;
}

export function SalesRepSummaryClient({ repData }: SalesRepSummaryClientProps) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState('This Month');

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
            <Image src={repData.avatarUrl} alt={repData.name} fill className="object-cover" sizes="48px" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{repData.name}'s</h1>
            <p className="text-sm text-gray-400 font-medium">Dashboard</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 cursor-pointer shadow-sm hover:bg-purple-200 transition-colors">
          <MessageCircle size={20} fill="currentColor" />
        </div>
      </div>

      {/* Order Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-gray-700 border-b border-gray-100 pb-2">Order</h2>
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
          {Object.entries(repData.orderCounts).map(([label, count]) => (
            <div key={label} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl whitespace-nowrap ${label === 'All' ? 'bg-[#F4EBFF] text-[#A020F0]' : 'text-gray-400'}`}>
              <span className="text-sm font-bold">{label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${label === 'All' ? 'bg-[#D6BBFB] text-[#A020F0]' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push(`/data/sales-reps/${repData.id}/order`)}
          className="bg-[#F4EBFF] text-[#A020F0] px-8 py-3 rounded-xl text-sm font-bold transition-transform active:scale-95"
        >
          See All Orders
        </button>
      </div>

      {/* Profile Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-gray-700 border-b border-gray-100 pb-2">Profile</h2>
        <div className="bg-white rounded-3xl p-8 border border-gray-50 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-12 items-start md:items-center">
            <div className="flex items-center gap-6 min-w-[300px]">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50">
                <Image src={repData.avatarUrl} alt={repData.name} fill className="object-cover" sizes="96px" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-800">{repData.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 font-bold">Sales Rep</span>
                  <span className="text-sm text-gray-700 font-black">{repData.teamName}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 flex justify-center md:justify-end pr-8">
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 mb-1">{repData.name.split(' ')[0]}'s KPI for this<br />month is <span className="text-gray-900">{repData.orderCounts.All} orders</span></p>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-3xl font-black text-green-500">{repData.kpiAchievement}%</span>
                  <span className="text-[10px] font-bold text-gray-400">achieved</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 pt-12 border-t border-gray-50">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Phone Number</p>
              <p className="text-lg font-black text-[#532194]">{repData.phone || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Whatsapp</p>
              <p className="text-lg font-black text-[#532194]">{repData.whatsapp || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Email</p>
              <p className="text-lg font-black text-[#532194] truncate">{repData.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Team</p>
              <p className="text-lg font-black text-[#532194]">{repData.teamName}</p>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => router.push(`/data/sales-reps/${repData.id}/profile`)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-[#A020F0] text-[#A020F0] text-sm font-bold hover:bg-purple-50 transition-colors ml-auto"
            >
              See Full Profile
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Preview */}
      <div className="space-y-6 pb-12">
        <h2 className="text-lg font-bold text-gray-700 border-b border-gray-100 pb-2">Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-50 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">General Performance</span>
              <MonthDropdown value={selectedMonth} onChange={setSelectedMonth} />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-black text-gray-900 tracking-tighter">{repData.generalPerformance}%</span>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-400 font-medium">this month</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-50 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">Delivery Rate</span>
              <MonthDropdown value={selectedMonth} onChange={setSelectedMonth} />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-black text-gray-900 tracking-tighter">{repData.kpiAchievement}%</span>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-400 font-medium">this month</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-800">Orders</span>
              <ArrowUpRight size={14} className="text-gray-300" />
            </div>
            <p className="text-[8px] text-gray-400 mb-6 leading-tight">Order summary this month.</p>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-[#1D9BF0] rounded-sm" />
              <span className="text-xs font-bold">{repData.orderCounts.All}</span>
              <span className="text-[10px] text-gray-400">Total</span>
            </div>
            <div className="flex items-end justify-between h-20 gap-1 px-2">
              {[
                repData.orderCounts.Pending,
                repData.orderCounts.Confirmed,
                repData.orderCounts.Delivered,
                repData.orderCounts.Cancelled,
                repData.orderCounts.Failed,
              ].map((val, i) => {
                const max = Math.max(repData.orderCounts.All, 1);
                const h = Math.round((val / max) * 100);
                return (
                  <div key={i} className="flex-1 bg-[#F4EBFF] rounded-t-sm group relative">
                    <div style={{ height: `${h}%` }} className={`w-full ${i === 2 ? 'bg-[#1D9BF0]' : 'bg-[#D6BBFB]'} rounded-t-sm`} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 px-1">
              {['Pe', 'Co', 'De', 'Ca', 'Fa'].map(d => (
                <span key={d} className="text-[8px] text-gray-300 font-medium">{d}</span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push(`/data/sales-reps/${repData.id}/analytics`)}
          className="flex items-center gap-2 px-8 py-2.5 rounded-xl border-2 border-[#A020F0] text-[#A020F0] text-sm font-bold hover:bg-purple-50 transition-colors"
        >
          <BarChart3 size={16} className="rotate-90" />
          See Full Analytics
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
