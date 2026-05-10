'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircle,
  Search,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Calendar as CalendarIcon,
  ChevronDown,
  User,
  MapPin,
  Mail,
  Phone,
  Database
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { agentSettlementsData as fallbackSettlements } from '@/lib/mock-data/agent-settlement';

// Mock Data for Chart
const chartData = [
  { name: 'JAN', sales: 40 },
  { name: 'FEB', sales: 55 },
  { name: 'MAR', sales: 45 },
  { name: 'APR', sales: 65 },
  { name: 'MAY', sales: 85 },
  { name: 'JUN', sales: 60 },
  { name: 'JUL', sales: 65 },
  { name: 'AUG', sales: 85 },
  { name: 'SEP', sales: 45 },
  { name: 'OCT', sales: 65 },
  { name: 'NOV', sales: 40 },
  { name: 'DEC', sales: 75 },
];

// Mock Data for Tables
const agentLedgerDataLocal = [
  { date: '2026-03-01', referenceType: 'Remittance', referenceId: 'REM-1023', debit: '₦0', credit: '₦45,000', runningBalance: '₦45,000' },
  { date: '2026-03-01', referenceType: 'Adjustment', referenceId: 'ADJ-001', debit: '₦30,000', credit: '₦45,000', runningBalance: '₦45,000' },
  { date: '2026-03-01', referenceType: 'Remittance', referenceId: 'REM-1023', debit: '₦0', credit: '₦45,000', runningBalance: '₦45,000' },
  { date: '2026-03-02', referenceType: 'Adjustment', referenceId: 'ADJ-001', debit: '₦2,500', credit: '₦0', runningBalance: '₦42,500' },
];

const agentInventoryDataLocal = [
  { product: 'Vitorep', left: '20', scheduled: '12', value: 'N200,000' },
  { product: 'Shred', left: '32', scheduled: '12', value: 'N200,000' },
  { product: 'Prosxact', left: '11', scheduled: '23', value: 'N200,000' },
  { product: 'After-Natal', left: '09', scheduled: '12', value: 'N200,000' },
  { product: 'Nuero-Vive Balm', left: '72', scheduled: '34', value: 'N200,000' },
  { product: 'Linix', left: '23', scheduled: '41', value: 'N200,000' },
];

export default function AgentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.agentId as string;

  const [chartFilter, setChartFilter] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');
  
  // Ledger filters
  const [ledgerPaymentStatus, setLedgerPaymentStatus] = useState<string>('');
  const [ledgerDateRange, setLedgerDateRange] = useState<DateRange | undefined>();

  // Inventory filters
  const [inventoryPaymentStatus, setInventoryPaymentStatus] = useState<string>('');
  const [inventoryDateRange, setInventoryDateRange] = useState<DateRange | undefined>();

  const agent = fallbackSettlements.find((a) => a.id === agentId) ?? { id: agentId, agentName: 'Agent', state: '—', totalSalesValue: '₦0', delFeesEarned: '₦0', totalRemitted: '₦0', balance: '₦0', overpayment: '₦0', underpayment: '₦0', date: '' };

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9FAFB]/50">
        <h1 className="text-2xl font-bold text-gray-800">Agent not found</h1>
        <button 
          onClick={() => router.back()}
          className="mt-4 px-6 py-2 bg-[#AE00FF] text-white rounded-xl font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Custom Tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1A1A] text-white p-3 rounded-xl text-sm shadow-xl relative -top-6">
          <p className="font-medium text-gray-400 text-[10px] mb-1 uppercase">1,348 sales</p>
          <p className="font-bold text-[14px]">
            ${(payload[0].value * 40).toLocaleString()}
          </p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[#1A1A1A]"></div>
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
        <button className="w-8 h-8 flex items-center justify-center text-[#AE00FF] bg-purple-50 rounded-md hover:bg-purple-100 transition-colors">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <h1 className="text-[32px] font-bold text-gray-800 tracking-tight">Agent</h1>

        {/* Chat Button */}
        <button className="w-14 h-14 bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 ml-auto z-10 hover:scale-105 transition-transform">
          <MessageCircle fill="currentColor" size={24} />
        </button>
      </div>

      {/* Top Widgets Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10">
        
        {/* Profile Widget (Left) */}
        <div className="xl:col-span-4 bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-[20px] text-gray-600 mb-6">Profile</h2>
            
            <div className="flex items-center gap-6 mb-8">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#EAEFF4] to-[#F3F6F9] flex items-center justify-center shadow-inner relative flex-shrink-0">
                 <Database size={42} className="text-[#3E82F7] opacity-90 drop-shadow-md" strokeWidth={1.5} />
              </div>
              
              <div>
                <h3 className="text-[26px] font-bold text-gray-800 flex items-center gap-2 mb-1">
                  Flymack <span className="text-gray-300 font-normal">|</span> Kaduna
                </h3>
                <p className="text-[16px] text-gray-400 font-medium mb-3">
                  Delivery Agent <span className="font-bold text-gray-600">Kaduna</span>
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-green-200 rounded-md text-[12px] text-green-500 font-medium">
                  Online <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 pb-6">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <p className="text-[11px] text-gray-400 mb-1 font-medium">Phone Number</p>
                  <p className="text-[13px] font-bold text-gray-800 truncate">091524472657</p>
                </div>
                <div className="col-span-1 border-l border-gray-100 pl-3">
                  <p className="text-[11px] text-gray-400 mb-1 font-medium">Whatsapp</p>
                  <p className="text-[13px] font-bold text-gray-800 truncate">091524472657</p>
                </div>
                <div className="col-span-1 border-l border-gray-100 pl-3">
                  <p className="text-[11px] text-gray-400 mb-1 font-medium">Email</p>
                  <p className="text-[13px] font-bold text-gray-800 truncate" title="FlymackLogistics@gamail.com">FlymackLogistics@gamail.com</p>
                </div>
                <div className="col-span-1 border-l border-gray-100 pl-3">
                  <p className="text-[11px] text-gray-400 mb-1 font-medium">State</p>
                  <p className="text-[13px] font-bold text-gray-800 truncate">Kaduna</p>
                </div>
              </div>
            </div>
          </div>

          <button className="flex items-center justify-center gap-2 w-[220px] py-4 border border-[#AE00FF] text-[#AE00FF] rounded-xl font-bold text-[14px] hover:bg-purple-50 transition-colors">
            <User size={16} className="opacity-80" />
            See Full Profile <ArrowRight size={16} />
          </button>
        </div>

        {/* Chart Widget (Right) */}
        <div className="xl:col-span-8 bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[13px] text-gray-400 font-medium mb-1">Sales 2026</p>
              <div className="flex items-center gap-4">
                <h3 className="text-[28px] font-bold text-gray-800 tracking-tight">N1.7M</h3>
                <span className="text-[11px] font-bold text-green-500 flex items-center gap-1">
                  <span className="bg-green-100 p-0.5 rounded-full"><ArrowUp size={10} strokeWidth={3} /></span> 1.3% <span className="text-gray-400 font-medium tracking-wide">VS LAST YEAR</span>
                </span>
              </div>
            </div>
            
            <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
              <button 
                onClick={() => setChartFilter('Daily')}
                className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${chartFilter === 'Daily' ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Daily
              </button>
              <button 
                onClick={() => setChartFilter('Weekly')}
                className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${chartFilter === 'Weekly' ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setChartFilter('Monthly')}
                className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${chartFilter === 'Monthly' ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#AE00FF" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#AE00FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(value) => value === 0 ? '0' : `${value}M`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#AE00FF', strokeWidth: 1.5 }} />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#AE00FF" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  activeDot={{ r: 6, fill: '#1A1A1A', stroke: '#1A1A1A', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
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
              <Select value={ledgerPaymentStatus} onValueChange={(val) => setLedgerPaymentStatus(val ?? '')}>
                <SelectTrigger className="w-[160px] h-[40px] bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium border-none focus:ring-0 [&>svg]:text-gray-400">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-gray-400" />
                    <SelectValue placeholder="Payment Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger className="flex items-center justify-between w-[220px] px-4 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-black transition-colors">
                     <div className="flex items-center gap-2">
                       <CalendarIcon size={16} className="text-gray-400" /> 
                       {ledgerDateRange?.from ? (
                         ledgerDateRange.to ? (
                           <>
                             {format(ledgerDateRange.from, "LLL dd, y")} -{" "}
                             {format(ledgerDateRange.to, "LLL dd, y")}
                           </>
                         ) : (
                           format(ledgerDateRange.from, "LLL dd, y")
                         )
                       ) : (
                         <span>Date Range</span>
                       )}
                     </div>
                     <ChevronDown size={16} className="text-gray-400" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={ledgerDateRange?.from}
                    selected={ledgerDateRange}
                    onSelect={setLedgerDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="relative w-full sm:w-[400px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="search"
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
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      Debit <ArrowDown size={14} className="text-orange-500" strokeWidth={3} />
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      Credit <ArrowUp size={14} className="text-green-500" strokeWidth={3} />
                    </div>
                  </th>
                  <th className="px-6 py-4">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agentLedgerDataLocal.map((row, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => router.push(`/accounting/agent-settlement/${agentId}/${row.referenceId}`)}
                    className={`${idx % 2 === 1 ? 'bg-[#F9FAFB]/60' : 'bg-white'} hover:bg-gray-50/80 transition-colors cursor-pointer`}
                  >
                    <td className="px-6 py-4 text-[13px] text-gray-500 font-medium">{row.date}</td>
                    <td className="px-6 py-4 text-[13px] text-gray-600">{row.referenceType}</td>
                    <td className="px-6 py-4 text-[13px] text-gray-600">{row.referenceId}</td>
                    <td className="px-6 py-4 text-[13px] text-gray-800 font-medium">{row.debit}</td>
                    <td className="px-6 py-4 text-[13px] text-gray-800 font-medium">{row.credit}</td>
                    <td className="px-6 py-4 text-[13px] text-gray-800 font-medium">{row.runningBalance}</td>
                  </tr>
                ))}
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
            <div className="flex items-center gap-3">
              <Select value={inventoryPaymentStatus} onValueChange={(val) => setInventoryPaymentStatus(val ?? '')}>
                <SelectTrigger className="w-[160px] h-[40px] bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium border-none focus:ring-0 [&>svg]:text-gray-400">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-gray-400" />
                    <SelectValue placeholder="Payment Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger className="flex items-center justify-between w-[220px] px-4 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-black transition-colors">
                     <div className="flex items-center gap-2">
                       <CalendarIcon size={16} className="text-gray-400" /> 
                       {inventoryDateRange?.from ? (
                         inventoryDateRange.to ? (
                           <>
                             {format(inventoryDateRange.from, "LLL dd, y")} -{" "}
                             {format(inventoryDateRange.to, "LLL dd, y")}
                           </>
                         ) : (
                           format(inventoryDateRange.from, "LLL dd, y")
                         )
                       ) : (
                         <span>Date Range</span>
                       )}
                     </div>
                     <ChevronDown size={16} className="text-gray-400" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={inventoryDateRange?.from}
                    selected={inventoryDateRange}
                    onSelect={setInventoryDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="relative w-full sm:w-[400px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="search"
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
                {agentInventoryDataLocal.map((row, idx) => (
                  <tr key={idx} className={`${idx % 2 === 1 ? 'bg-[#F9FAFB]/60' : 'bg-white'} hover:bg-gray-50/80 transition-colors`}>
                    <td className="px-6 py-4 text-[13px] text-gray-600 font-medium">{row.product}</td>
                    <td className="px-6 py-4 text-[13px] text-gray-600">{row.left}</td>
                    <td className="px-6 py-4 text-[13px] text-gray-600">{row.scheduled}</td>
                    <td className="px-6 py-4 text-[13px] text-gray-800 font-medium">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
