'use client';

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  MessageCircle,
  TrendingUp,
  ChevronDown,
  Search,
  MoreVertical
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const reportTypes = [
  "Profit & Loss",
  "Balance Sheet",
  "Cash Flow",
  "Agent Performance",
  "Delivery Expense",
  "Inventory Valuation",
  "Sales by Product",
  "Sales by State",
  "Tax Report",
  "Aging Report"
];

const fallbackChartData = [
  { name: 'JAN', delivered: 400, failed: 240 },
  { name: 'FEB', delivered: 1800, failed: 800 },
  { name: 'MAR', delivered: 1600, failed: 1200 },
  { name: 'APR', delivered: 2200, failed: 900 },
  { name: 'MAY', delivered: 1800, failed: 1400 },
  { name: 'JUN', delivered: 1700, failed: 1200 },
  { name: 'JUL', delivered: 1500, failed: 1100 },
  { name: 'AUG', delivered: 1400, failed: 1300 },
  { name: 'SEP', delivered: 1500, failed: 1100 },
  { name: 'OCT', delivered: 1700, failed: 1400 },
  { name: 'NOV', delivered: 1800, failed: 1200 },
  { name: 'DEC', delivered: 600, failed: 400 },
];

const fallbackTableData = [
  { name: 'Mr Ola Adewale', state: 'Lagos', product: 5, performance: '89%', avatar: 'https://ui-avatars.com/api/?name=Ola+Adewale&background=FFB6C1&color=fff' },
  { name: 'Mr. Qudus Aina', state: 'Ibadan', product: 12, performance: '87%', avatar: 'https://ui-avatars.com/api/?name=Qudus+Aina&background=4B0082&color=fff' },
  { name: 'Mr. Elijah', state: 'Kano', product: 19, performance: '89%', avatar: 'https://ui-avatars.com/api/?name=Elijah&background=FFD700&color=fff' },
  { name: 'Flymack | Lagos', state: 'Borno', product: 13, performance: '68%', avatar: 'https://ui-avatars.com/api/?name=Flymack&background=ADD8E6&color=fff' },
  { name: 'Mr Oyelowo John', state: 'Ebonyi', product: 10, performance: '86%', avatar: 'https://ui-avatars.com/api/?name=Oyelowo+John&background=8B4513&color=fff' },
  { name: 'Mrs. Sumni', state: 'Edo', product: 20, performance: '86%', avatar: 'https://ui-avatars.com/api/?name=Sumni&background=2F4F4F&color=fff' },
  { name: 'Mr. Adeola Isaiah', state: 'Benin', product: 9, performance: '88%', avatar: 'https://ui-avatars.com/api/?name=Adeola+Isaiah&background=E9967A&color=fff' },
  { name: 'Flymack | Kaduna', state: 'Kogi', product: 13, performance: '68%', avatar: 'https://ui-avatars.com/api/?name=Flymack&background=ADD8E6&color=fff' },
  { name: 'AirPeace', state: 'Abeokuta', product: 6, performance: '84%', avatar: 'https://ui-avatars.com/api/?name=AirPeace&background=00008B&color=fff' },
];

interface ReportsClientProps {
  agentPerformance?: {
    chartData: { name: string; delivered: number; failed: number }[];
    tableData: { name: string; state: string; product: number; performance: string }[];
    summary: { overallPerformance: number; bestAgent: { name: string; performance: string } | null };
  };
}

export function ReportsClient({ agentPerformance }: ReportsClientProps = {}) {
  const [activeReport, setActiveReport] = useState("Agent Performance");
  const chartData = agentPerformance?.chartData?.length ? agentPerformance.chartData : fallbackChartData;
  const tableData = agentPerformance?.tableData?.length
    ? agentPerformance.tableData.map(t => ({ ...t, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=4B0082&color=fff` }))
    : fallbackTableData;
  const overallPerf = agentPerformance?.summary.overallPerformance ?? 65;
  const bestAgentName = agentPerformance?.summary.bestAgent?.name ?? "Qudus Aina";
  const bestAgentPerf = agentPerformance?.summary.bestAgent?.performance ?? "75%";

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F9FAFB]">
      {/* Top Controls */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <ChevronRight size={20} />
          </button>
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <RotateCcw size={18} />
          </button>
        </div>
        <div className="w-14 h-14 bg-[#F3E8FF] rounded-full flex items-center justify-center">
          <div className="w-10 h-10 bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 cursor-pointer">
            <MessageCircle size={22} fill="currentColor" />
          </div>
        </div>
      </div>

      <h1 className="text-[32px] font-bold text-gray-800 mb-10 tracking-tight leading-none">Reports</h1>

      <div className="flex gap-10 items-start">
        {/* Secondary Sidebar */}
        <div className="w-72 shrink-0 bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm min-h-[700px]">
          <div className="space-y-6">
            {reportTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveReport(type)}
                className={`w-full text-left text-[14px] font-bold transition-all ${
                  activeReport === type ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 space-y-10">
          <div className="flex gap-8">
            {/* Left Stats Section */}
            <div className="w-[340px] space-y-6">
              {/* Agent Performance Summary */}
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 h-[200px] flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <h3 className="text-[14px] font-bold text-gray-800">Agent Performance</h3>
                  <button className="flex items-center gap-2 text-[12px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    This Month <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex items-end gap-3 relative z-10">
                  <span className="text-[56px] font-black text-gray-800 leading-none">{overallPerf}%</span>
                  <div className="flex items-center gap-1 text-emerald-500 font-black text-[14px] mb-2">
                    +9% <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider ml-1">vs last month</span>
                  </div>
                </div>
              </div>

              {/* Best Agent Card */}
              <div className="bg-[#4A0A77] rounded-[32px] p-8 h-[160px] text-white flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <h3 className="text-[14px] font-bold opacity-80">Best Agent</h3>
                  <button className="flex items-center gap-2 text-[12px] font-bold opacity-80 bg-white/10 px-3 py-1.5 rounded-lg">
                    This Month <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/20">
                    <img src="https://ui-avatars.com/api/?name=Qudus+Aina&background=4B0082&color=fff" alt="Best Agent" />
                  </div>
                  <div>
                    <h4 className="text-[18px] font-black leading-tight">{bestAgentName} <span className="opacity-80">{bestAgentPerf}</span></h4>
                  </div>
                </div>
              </div>

              {/* Best Agent Last Month */}
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 h-[160px] flex flex-col justify-between">
                <h3 className="text-[14px] font-bold text-gray-400">Best Agent For Last Month</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-400">
                    <img src="https://ui-avatars.com/api/?name=Flymack&background=ADD8E6&color=fff" className="rounded-xl w-10 h-10" alt="Flymack" />
                  </div>
                  <div>
                    <h4 className="text-[18px] font-black text-gray-800 leading-tight">
                      Flymack | Lagos <span className="text-emerald-500 font-black">65%</span>
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Chart Section */}
            <div className="flex-1 bg-white rounded-[40px] border border-gray-100 shadow-sm p-10 flex flex-col">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Statistics</p>
                  <h3 className="text-[24px] font-black text-gray-800">Sales report</h3>
                </div>
                <div className="flex flex-col items-end gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Delivered Order</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Failed Order</span>
                    </div>
                  </div>
                  <div className="flex bg-gray-50 p-1 rounded-xl">
                    {["7 days", "30 days", "12 months"].map((t) => (
                      <button key={t} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${t === '12 months' ? 'bg-[#1E293B] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                      dx={-10}
                      domain={[0, 2400]}
                      ticks={[0, 400, 800, 1200, 1600, 2000, 2400]}
                      tickFormatter={(val) => `${val} ORD`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="delivered" 
                      stroke="#10B981" 
                      strokeWidth={3} 
                      strokeDasharray="8 8"
                      dot={false}
                      animationDuration={2000}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="failed" 
                      stroke="#F43F5E" 
                      strokeWidth={3} 
                      strokeDasharray="8 8"
                      dot={false}
                      animationDuration={2500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Table Section */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F1F5F9]/50 text-[12px] font-bold text-gray-400 uppercase tracking-[0.1em]">
                  <th className="px-10 py-6">Name</th>
                  <th className="px-10 py-6 text-center">State</th>
                  <th className="px-10 py-6 text-center">Top Product</th>
                  <th className="px-10 py-6 text-right">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tableData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl overflow-hidden border border-gray-100">
                          <img src={row.avatar} alt={row.name} />
                        </div>
                        <span className="text-[14px] font-black text-gray-700">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-10 py-5 text-center text-[14px] font-bold text-gray-400">{row.state}</td>
                    <td className="px-10 py-5 text-center text-[14px] font-black text-gray-700">{row.product}</td>
                    <td className="px-10 py-5 text-right">
                      <span className="text-[16px] font-black text-gray-800">{row.performance}</span>
                    </td>
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
