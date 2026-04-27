'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  Share2, 
  ArrowUpRight,
  Download
} from 'lucide-react';
import { 
  TEAM_ANALYTICS_DATA, 
  BEST_SELLING_PRODUCTS, 
  UPSELLING_RATE_DATA,
  MONTHS 
} from '@/lib/mock-data/data-analysis';

const METRIC_KEYS = [
  'totalProductsSold',
  'totalOrderCustomer',
  'bestSellingProduct',
  'generalPerformance',
  'upsellingRate',
  'confirmationRate',
  'deliveryRate',
  'cancellationRate',
  'recoveryRate',
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
          {MONTHS.map((month) => (
            <button
              key={month}
              onClick={() => {
                onChange(month);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-purple-50 transition-colors ${
                value === month ? 'text-[#A020F0] font-bold bg-purple-50' : 'text-gray-600'
              }`}
            >
              {month}
            </button>
          ))}
          <button
            onClick={() => {
              onChange('This Month');
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-purple-50 transition-colors ${
              value === 'This Month' ? 'text-[#A020F0] font-bold bg-purple-50' : 'text-gray-600'
            }`}
          >
            This Month
          </button>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, data, month, onMonthChange }: { 
  label: string; 
  data: any; 
  month: string; 
  onMonthChange: (val: string) => void 
}) {
  const isBestProduct = label === 'Best Selling Product';

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-800">{label}</span>
        <MonthDropdown value={month} onChange={onMonthChange} />
      </div>
      <div className="flex items-end justify-between">
        <span className={`font-black tracking-tight ${isBestProduct ? 'text-2xl text-gray-900' : 'text-3xl text-gray-600'}`}>
          {data.value}
        </span>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-green-500 font-bold text-xs">
            {data.change}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">vs last month</span>
        </div>
      </div>
      {isBestProduct && data.change && (
        <div className="text-right">
          <span className="text-[10px] text-green-500 font-bold">{data.change}</span>
          <span className="text-[10px] text-gray-400 ml-1">last month</span>
        </div>
      )}
    </div>
  );
}

export function AnalyticsClient() {
  const [activeView, setActiveView] = useState<'team' | 'sales'>('team');
  const [selectedTeam, setSelectedTeam] = useState('Team 1');
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  const [tableMonth, setTableMonth] = useState('September');

  const teamData = TEAM_ANALYTICS_DATA[selectedTeam] || TEAM_ANALYTICS_DATA['Team 1'];
  const monthData = teamData[selectedMonth] || teamData['This Month'];

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-700">Team's Analytics</h1>
        
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('team')}
              className={`px-6 py-2 rounded-md text-xs font-bold transition-all ${
                activeView === 'team' 
                  ? 'bg-[#A020F0] text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Team Analytics
            </button>
            <button
              onClick={() => setActiveView('sales')}
              className={`px-6 py-2 rounded-md text-xs font-bold transition-all ${
                activeView === 'sales' 
                  ? 'bg-[#A020F0] text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sales Analytics
            </button>
          </div>

          {/* Team Dropdown */}
          <div className="relative">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="appearance-none bg-black text-white px-4 py-2 rounded-lg text-xs font-bold pr-8 focus:outline-none cursor-pointer"
            >
              <option value="Team 1">Team 1</option>
              <option value="Team 2">Team 2</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white" />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {METRIC_KEYS.map((key) => (
          <MetricCard
            key={key}
            label={METRIC_LABELS[key]}
            data={monthData[key]}
            month={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        ))}

        {/* KPI Box */}
        <div className="bg-gradient-to-br from-[#532194] to-[#3D1A6E] p-6 rounded-xl text-white flex flex-col justify-between relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 text-[#D6BBFB]">KPI</span>
              <p className="text-3xl font-black">{monthData.kpi.value}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-medium opacity-60">Target for the month:</span>
              <p className="text-xs font-bold">{monthData.kpi.target}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4 relative z-10">
            <span className="text-green-400 text-sm font-bold">{monthData.kpi.change}</span>
            <span className="text-[10px] font-medium opacity-60">vs last month</span>
          </div>
        </div>
      </div>

      {/* Tables Section - Only visible in Team Analytics mode */}
      {activeView === 'team' && (
        <div className="mt-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Best Selling Product Table */}
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
                    {BEST_SELLING_PRODUCTS.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-xs text-gray-600 font-medium">{p.product}</td>
                        <td className="px-5 py-3 text-xs text-gray-600 font-bold text-right">{p.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-4">
                <div className="relative w-fit">
                  <select className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium pr-8 focus:outline-none cursor-pointer">
                    <option>September</option>
                    <option>October</option>
                    <option>November</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
                <button className="flex items-center justify-center gap-2 w-full py-3 bg-[#F4EBFF] text-[#A020F0] rounded-xl text-xs font-bold transition-transform active:scale-95 hover:bg-[#E9D5FF]">
                  <Download size={14} />
                  Generate Weekly Report
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>

            {/* Upselling Rate Table */}
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
                    {UPSELLING_RATE_DATA.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-xs text-gray-600 font-medium">{p.product}</td>
                        <td className="px-5 py-3 text-xs text-gray-600 font-bold text-right">{p.upsell}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-4">
                <div className="relative w-fit">
                  <select className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium pr-8 focus:outline-none cursor-pointer">
                    <option>September</option>
                    <option>October</option>
                    <option>November</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
                <button className="flex items-center justify-center gap-2 w-full py-3 bg-[#F4EBFF] text-[#A020F0] rounded-xl text-xs font-bold transition-transform active:scale-95 hover:bg-[#E9D5FF]">
                  <Download size={14} />
                  Generate Montly Report
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
