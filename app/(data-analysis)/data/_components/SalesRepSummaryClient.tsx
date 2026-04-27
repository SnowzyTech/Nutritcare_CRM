'use client';

import React from 'react';
import { 
  MessageCircle, 
  ChevronRight, 
  ArrowUpRight,
  User,
  Phone,
  Mail,
  BarChart3
} from 'lucide-react';
import { SALES_REPS, MOCK_ORDERS } from '@/lib/mock-data/data-analysis';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function SalesRepSummaryClient({ id }: { id: string }) {
  const router = useRouter();
  const rep = SALES_REPS.find(r => r.id === id) || SALES_REPS[0];
  const orders = MOCK_ORDERS[id] || MOCK_ORDERS['adebimpe-tolani'] || [];

  const orderCounts = {
    All: orders.length,
    Pending: orders.filter(o => o.status === 'Pending').length || 10,
    Confirmed: orders.filter(o => o.status === 'Confirmed').length || 8,
    Delivered: orders.filter(o => o.status === 'Delivered').length || 7,
    Cancelled: orders.filter(o => o.status === 'Cancelled').length || 2,
    Failed: orders.filter(o => o.status === 'Failed').length || 2,
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
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
        
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 cursor-pointer shadow-sm hover:bg-purple-200 transition-colors">
          <MessageCircle size={20} fill="currentColor" />
        </div>
      </div>

      {/* Order Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-gray-700 border-b border-gray-100 pb-2">Order</h2>
        
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
          {Object.entries(orderCounts).map(([label, count]) => (
            <div key={label} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl whitespace-nowrap ${label === 'All' ? 'bg-[#F4EBFF] text-[#A020F0]' : 'text-gray-400'}`}>
              <span className="text-sm font-bold">{label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${label === 'All' ? 'bg-[#D6BBFB] text-[#A020F0]' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            </div>
          ))}
        </div>

        <button 
          onClick={() => {
            if (!id || id === 'undefined') return;
            router.push(`/data/sales-reps/${id}/order`);
          }}
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
            {/* Avatar & Name */}
            <div className="flex items-center gap-6 min-w-[300px]">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50">
                <Image 
                  src={rep.avatar} 
                  alt={rep.name} 
                  fill 
                  className="object-cover" 
                  sizes="96px"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-800">{rep.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 font-bold">Sales Rep</span>
                  <span className="text-sm text-gray-700 font-black">{rep.team}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${rep.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">Online</span>
                </div>
              </div>
            </div>

            {/* KPI Circle Placeholder */}
            <div className="flex-1 flex justify-center md:justify-end pr-8">
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 mb-1">{rep.name.split(' ')[0]}'s KPI for this<br />month is <span className="text-gray-900">XXXXX</span></p>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-3xl font-black text-green-500">{rep.kpiAchievement}%</span>
                  <span className="text-[10px] font-bold text-gray-400">achieved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 pt-12 border-t border-gray-50">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Phone Number</p>
              <p className="text-lg font-black text-[#532194]">{rep.phoneNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Whatsapp</p>
              <p className="text-lg font-black text-[#532194]">{rep.whatsapp}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Email</p>
              <p className="text-lg font-black text-[#532194] truncate">{rep.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Team</p>
              <p className="text-lg font-black text-[#532194]">{rep.team}</p>
            </div>
          </div>

          <div className="mt-8">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-[#A020F0] text-[#A020F0] text-sm font-bold hover:bg-purple-50 transition-colors ml-auto">
              <User size={16} />
              See Full Profile
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="space-y-6 pb-12">
        <h2 className="text-lg font-bold text-gray-700 border-b border-gray-100 pb-2">Analytics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-50 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">Geeral Performance</span>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[10px] font-bold text-gray-500">This Month</span>
                <ChevronRight size={10} className="rotate-90 text-gray-400" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-black text-gray-900 tracking-tighter">80%</span>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-green-500 font-bold text-sm">
                  +12%
                </div>
                <span className="text-[10px] text-gray-400 font-medium">vs last month</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-50 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">Delivery Rate</span>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[10px] font-bold text-gray-500">This Month</span>
                <ChevronRight size={10} className="rotate-90 text-gray-400" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-black text-gray-900 tracking-tighter">78%</span>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-green-500 font-bold text-sm">
                  +12%
                </div>
                <span className="text-[10px] text-gray-400 font-medium">vs last month</span>
              </div>
            </div>
          </div>

          {/* Sales Chart Mockup */}
          <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-4">
               <span className="text-xs font-bold text-gray-800">Sales</span>
               <div className="w-4 h-4 text-gray-300">
                 <ArrowUpRight size={14} />
               </div>
             </div>
             <p className="text-[8px] text-gray-400 mb-6 leading-tight">Ending Report Loream Ipsum.</p>
             <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-[#1D9BF0] rounded-sm" />
                <span className="text-xs font-bold">540</span>
                <span className="text-[10px] text-gray-400">Sale</span>
             </div>
             <div className="flex items-end justify-between h-20 gap-1 px-2">
                {[40, 60, 30, 80, 50, 90, 45].map((h, i) => (
                  <div key={i} className="flex-1 bg-[#F4EBFF] rounded-t-sm group relative">
                    <div style={{ height: `${h}%` }} className={`w-full ${i === 5 ? 'bg-[#1D9BF0]' : 'bg-[#D6BBFB]'} rounded-t-sm transition-all group-hover:opacity-80`} />
                  </div>
                ))}
             </div>
             <div className="flex justify-between mt-2 px-1">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                  <span key={d} className="text-[8px] text-gray-300 font-medium">{d}</span>
                ))}
             </div>
          </div>
        </div>

        <button 
          onClick={() => {
            if (!id || id === 'undefined') return;
            router.push(`/data/sales-reps/${id}/analytics`);
          }}
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
