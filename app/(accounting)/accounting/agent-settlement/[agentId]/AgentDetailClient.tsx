'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ChevronLeft, ChevronRight, RotateCcw, MessageCircle, Search,
  ArrowDown, ArrowUp, ArrowRight, Calendar as CalendarIcon,
  ChevronDown, User, Database,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { AgentPageData } from '@/modules/finance/services/agent-settlement.service';

interface Props extends AgentPageData {
  agentId: string;
}

export function AgentDetailClient({ agent, chartData, totalSalesYear, prevYearSalesTotal, ledger, inventory, agentId }: Props) {
  const router = useRouter();
  const [chartFilter, setChartFilter] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerDateRange, setLedgerDateRange] = useState<DateRange | undefined>();
  const [inventorySearch, setInventorySearch] = useState('');

  const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

  const pctChange = prevYearSalesTotal > 0
    ? (((totalSalesYear - prevYearSalesTotal) / prevYearSalesTotal) * 100).toFixed(1)
    : null;

  const filteredLedger = useMemo(() => {
    return ledger.filter((row) => {
      const matchesSearch =
        !ledgerSearch ||
        row.referenceId.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        row.referenceType.toLowerCase().includes(ledgerSearch.toLowerCase());
      const rowDate = new Date(row.date);
      const matchesFrom = !ledgerDateRange?.from || rowDate >= ledgerDateRange.from;
      const matchesTo = !ledgerDateRange?.to || rowDate <= ledgerDateRange.to;
      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [ledger, ledgerSearch, ledgerDateRange]);

  const filteredInventory = useMemo(() => {
    if (!inventorySearch) return inventory;
    return inventory.filter((row) =>
      row.product.toLowerCase().includes(inventorySearch.toLowerCase())
    );
  }, [inventory, inventorySearch]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value as number;
      return (
        <div className="bg-[#1A1A1A] text-white p-3 rounded-xl text-sm shadow-xl relative -top-6">
          <p className="font-medium text-gray-400 text-[10px] mb-1 uppercase">{label}</p>
          <p className="font-bold text-[14px]">{fmt(val * 1000)}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[#1A1A1A]" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F9FAFB]/50 font-sans">
      {/* Navigation Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center text-[#AE00FF] bg-purple-50 rounded-md hover:bg-purple-100 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center text-[#AE00FF] bg-purple-50 rounded-md hover:bg-purple-100 transition-colors">
          <ChevronRight size={18} />
        </button>
        <button onClick={() => router.refresh()} className="w-8 h-8 flex items-center justify-center text-[#AE00FF] bg-purple-50 rounded-md hover:bg-purple-100 transition-colors">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[32px] font-bold text-gray-800 tracking-tight">Agent</h1>
        <button className="w-14 h-14 bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-105 transition-transform">
          <MessageCircle fill="currentColor" size={24} />
        </button>
      </div>

      {/* Top Widgets Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10">

        {/* Profile Widget */}
        <div className="xl:col-span-4 bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-[20px] text-gray-600 mb-6">Profile</h2>
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#EAEFF4] to-[#F3F6F9] flex items-center justify-center shadow-inner flex-shrink-0">
                <Database size={42} className="text-[#3E82F7] opacity-90 drop-shadow-md" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[24px] font-bold text-gray-800 mb-1">
                  {agent.companyName}
                  {agent.state && <span className="text-gray-300 font-normal"> | {agent.state}</span>}
                </h3>
                <p className="text-[15px] text-gray-400 font-medium mb-3">
                  Delivery Agent{agent.state && <span className="font-bold text-gray-600"> {agent.state}</span>}
                </p>
                <div className={`inline-flex items-center gap-2 px-3 py-1 border rounded-md text-[12px] font-medium ${agent.status === 'ACTIVE' ? 'border-green-200 text-green-500' : 'border-gray-200 text-gray-400'}`}>
                  {agent.status === 'ACTIVE' ? 'Active' : agent.status}
                  {agent.status === 'ACTIVE' && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 pb-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <p className="text-[11px] text-gray-400 mb-1 font-medium">Phone Number</p>
                  <p className="text-[13px] font-bold text-gray-800">{agent.phone1}</p>
                </div>
                {agent.phone2 && (
                  <div className="border-l border-gray-100 pl-4">
                    <p className="text-[11px] text-gray-400 mb-1 font-medium">Whatsapp</p>
                    <p className="text-[13px] font-bold text-gray-800">{agent.phone2}</p>
                  </div>
                )}
                {agent.email && (
                  <div className="border-l border-gray-100 pl-4">
                    <p className="text-[11px] text-gray-400 mb-1 font-medium">Email</p>
                    <p className="text-[13px] font-bold text-gray-800 truncate" title={agent.email}>{agent.email}</p>
                  </div>
                )}
                {agent.state && (
                  <div className="border-l border-gray-100 pl-4">
                    <p className="text-[11px] text-gray-400 mb-1 font-medium">State</p>
                    <p className="text-[13px] font-bold text-gray-800">{agent.state}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button className="flex items-center gap-2 w-[220px] py-4 border border-[#AE00FF] text-[#AE00FF] rounded-xl font-bold text-[14px] hover:bg-purple-50 transition-colors justify-center">
            <User size={16} className="opacity-80" />
            See Full Profile <ArrowRight size={16} />
          </button>
        </div>

        {/* Chart Widget */}
        <div className="xl:col-span-8 bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[13px] text-gray-400 font-medium mb-1">Sales {new Date().getFullYear()}</p>
              <div className="flex items-center gap-4">
                <h3 className="text-[28px] font-bold text-gray-800 tracking-tight">{fmt(totalSalesYear)}</h3>
                {pctChange !== null && (
                  <span className={`text-[11px] font-bold flex items-center gap-1 ${Number(pctChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <span className={`p-0.5 rounded-full ${Number(pctChange) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      {Number(pctChange) >= 0 ? <ArrowUp size={10} strokeWidth={3} /> : <ArrowDown size={10} strokeWidth={3} />}
                    </span>
                    {Math.abs(Number(pctChange))}%{' '}
                    <span className="text-gray-400 font-medium tracking-wide">VS LAST YEAR</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
              {(['Daily', 'Weekly', 'Monthly'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setChartFilter(f)}
                  className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${chartFilter === f ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-[220px] w-full">
            {chartData.every((d) => d.sales === 0) ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-[14px] font-medium">
                No sales data for {new Date().getFullYear()} yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#AE00FF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#AE00FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} tickFormatter={(v) => v === 0 ? '0' : `${v}K`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#AE00FF', strokeWidth: 1.5 }} />
                  <Area type="monotone" dataKey="sales" stroke="#AE00FF" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 6, fill: '#1A1A1A', stroke: '#1A1A1A', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="space-y-10">

        {/* Agent Ledger */}
        <div>
          <h2 className="text-[15px] font-bold text-gray-800 mb-4">Agent Ledger</h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger className="flex items-center justify-between w-[220px] px-4 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-black transition-colors">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-gray-400" />
                    {ledgerDateRange?.from ? (
                      ledgerDateRange.to
                        ? `${format(ledgerDateRange.from, "LLL dd")} - ${format(ledgerDateRange.to, "LLL dd, y")}`
                        : format(ledgerDateRange.from, "LLL dd, y")
                    ) : <span>Date Range</span>}
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar initialFocus mode="range" defaultMonth={ledgerDateRange?.from} selected={ledgerDateRange} onSelect={setLedgerDateRange} numberOfMonths={2} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="relative w-full sm:w-[400px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference ID or type…"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="w-full h-[44px] pl-12 pr-4 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-purple-300 shadow-sm transition-colors"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#E5E7EB]/60 text-[12px] font-bold text-gray-600 border-b border-gray-200">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Reference Type</th>
                  <th className="px-6 py-4">Reference ID</th>
                  <th className="px-6 py-4"><div className="flex items-center gap-2">Debit <ArrowDown size={14} className="text-orange-500" strokeWidth={3} /></div></th>
                  <th className="px-6 py-4"><div className="flex items-center gap-2">Credit <ArrowUp size={14} className="text-green-500" strokeWidth={3} /></div></th>
                  <th className="px-6 py-4">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[13px] text-gray-400 font-medium">
                      {ledger.length === 0 ? 'No ledger entries yet for this agent' : 'No entries match your filters'}
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((row, idx) => (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/accounting/agent-settlement/${agentId}/${row.id}`)}
                      className={`${idx % 2 === 1 ? 'bg-[#F9FAFB]/60' : 'bg-white'} hover:bg-purple-50/40 transition-colors cursor-pointer border-b border-gray-50 last:border-0`}
                    >
                      <td className="px-6 py-4 text-[13px] text-gray-500 font-medium">{row.date}</td>
                      <td className="px-6 py-4 text-[13px] text-gray-600">{row.referenceType}</td>
                      <td className="px-6 py-4 text-[13px] text-gray-600 font-bold">{row.referenceId}</td>
                      <td className="px-6 py-4 text-[13px] text-gray-800 font-medium">{row.debit}</td>
                      <td className="px-6 py-4 text-[13px] text-gray-800 font-medium">{row.credit}</td>
                      <td className="px-6 py-4 text-[13px] text-gray-800 font-bold">{row.runningBalance}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <button className="flex items-center justify-center gap-2 w-[140px] py-2.5 bg-purple-50 text-[#AE00FF] font-bold text-[13px] rounded-lg hover:bg-purple-100 transition-colors">
              See All <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Agent Inventory */}
        <div>
          <h2 className="text-[15px] font-bold text-gray-800 mb-4">Agent Inventory</h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="relative w-full sm:w-[400px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product name…"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full h-[44px] pl-12 pr-4 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-purple-300 shadow-sm transition-colors"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm mb-10">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#E5E7EB]/60 text-[12px] font-bold text-gray-600 border-b border-gray-200">
                  <th className="px-6 py-4">Products</th>
                  <th className="px-6 py-4">No. of product left</th>
                  <th className="px-6 py-4">Scheduled for del.</th>
                  <th className="px-6 py-4">Inventory Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[13px] text-gray-400 font-medium">
                      {inventory.length === 0 ? 'No stock movements recorded for this agent' : 'No products match your search'}
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((row, idx) => (
                    <tr key={idx} className={`${idx % 2 === 1 ? 'bg-[#F9FAFB]/60' : 'bg-white'} hover:bg-gray-50/80 transition-colors`}>
                      <td className="px-6 py-4 text-[13px] text-gray-600 font-medium">{row.product}</td>
                      <td className="px-6 py-4 text-[13px] text-gray-600">{row.left}</td>
                      <td className="px-6 py-4 text-[13px] text-gray-600">{row.scheduled}</td>
                      <td className="px-6 py-4 text-[13px] text-gray-800 font-medium">{row.value}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
