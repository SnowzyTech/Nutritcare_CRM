'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Plus, MessageCircle, ChevronLeft, ChevronRight, RotateCcw, ChevronDown, X,
} from 'lucide-react';
import Link from 'next/link';

/* ── Fallback Mock Data ─────────────────────────────────────────────────── */

const fallbackFinancialSummary = [
  { label: 'Total Revenue', value: 'N60,000,000', change: '+12%', isPositive: true, subText: 'vs last month', highlight: 'default' as const },
  { label: 'Net Profit', value: 'N52,000,000', change: '+12%', isPositive: true, subText: 'vs last month', highlight: 'purple' as const },
  { label: 'Total Expenses', value: 'N8,000,000', change: '+12%', isPositive: true, subText: 'vs last month', highlight: 'default' as const },
  { label: 'Delivery Expenses', value: 'N800,000', change: '+12%', isPositive: true, subText: 'vs last month', highlight: 'default' as const },
  { label: 'Tax Payable', value: '24%', change: '', isPositive: true, subText: '', highlight: 'default' as const },
];

const inventorySnapshot1 = [
  { label: 'Total Inventory Value', value: 'N820,000,000', subLabel: '26,000 Products', color: '#10B981', bg: 'bg-[#FDF9FF]' },
  { label: 'Proxsact', value: 'N200,000,000', subLabel: '6000 Products', color: '#10B981', bg: 'bg-white' },
  { label: 'Shred Belly', value: 'N120,000,000', subLabel: '4520 Products', color: '#10B981', bg: 'bg-white' },
  { label: 'Linix', value: 'N120,000,000', subLabel: '4520 Products', color: '#10B981', bg: 'bg-white' },
  { label: 'Neuro-Vive Balm', value: 'N120,000,000', subLabel: '4520 Products', color: '#10B981', bg: 'bg-white' },
  { label: 'After-Natal', value: 'N120,000,000', subLabel: '4520 Products', color: '#10B981', bg: 'bg-white' },
];

const inventorySnapshot2 = [
  { label: 'Fonio- Mill', value: 'N120,000,000', subLabel: '4520 Products', color: '#10B981', bg: 'bg-white' },
  { label: 'Vitorep', value: 'N10,400,000', subLabel: '452 Products', color: '#EF4444', bg: 'bg-white', badge: 'Low Stock' },
  { label: 'Stock With Agents', value: '12,000', subLabel: 'products across', subDetail: '72 delivery agents', color: '#10B981', bg: 'bg-white' },
  { label: 'Stock In Warehouse', value: '14,000', subLabel: 'products across 12', subDetail: 'warehouses', color: '#10B981', bg: 'bg-white' },
];

const fallbackSalesChartData = [
  { name: 'JAN', value: 30_000_000 }, { name: 'FEB', value: 25_000_000 },
  { name: 'MAR', value: 35_000_000 }, { name: 'APR', value: 28_000_000 },
  { name: 'MAY', value: 40_000_000 }, { name: 'JUN', value: 55_000_000 },
  { name: 'JUL', value: 70_000_000 }, { name: 'AUG', value: 85_000_000 },
  { name: 'SEP', value: 60_000_000 }, { name: 'OCT', value: 45_000_000 },
  { name: 'NOV', value: 35_000_000 }, { name: 'DEC', value: 20_000_000 },
];

const fallbackSalesTrends = {
  day: [
    { name: 'Mon', value: 4_000_000 }, { name: 'Tue', value: 6_500_000 },
    { name: 'Wed', value: 5_000_000 }, { name: 'Thu', value: 8_000_000 },
    { name: 'Fri', value: 7_200_000 }, { name: 'Sat', value: 9_500_000 },
    { name: 'Sun', value: 3_800_000 },
  ],
  week: [
    { name: 'W1', value: 28_000_000 }, { name: 'W2', value: 32_000_000 },
    { name: 'W3', value: 26_000_000 }, { name: 'W4', value: 41_000_000 },
    { name: 'W5', value: 38_000_000 }, { name: 'W6', value: 45_000_000 },
    { name: 'W7', value: 33_000_000 }, { name: 'W8', value: 49_000_000 },
    { name: 'W9', value: 52_000_000 }, { name: 'W10', value: 44_000_000 },
    { name: 'W11', value: 58_000_000 }, { name: 'W12', value: 61_000_000 },
  ],
  month: fallbackSalesChartData,
  year: new Date().getFullYear(),
};

const fallbackSalesByProduct = [
  { name: 'FONIO MILL', fullName: 'Fonio Mill', value: 8_000_000 },
  { name: 'SHRED BELLY', fullName: 'Shred Belly', value: 12_000_000 },
  { name: 'AFTER-NATAL', fullName: 'After-Natal', value: 6_000_000 },
  { name: 'PROSXACT', fullName: 'Prosxact', value: 10_000_000 },
  { name: 'TRIM AND TONE', fullName: 'Trim and Tone', value: 15_000_000, isMax: true },
  { name: 'LINIX', fullName: 'Linix', value: 8_000_000 },
  { name: 'NEURO-VIVE BALM', fullName: 'Neuro-Vive Balm', value: 11_000_000 },
  { name: 'VITOREP', fullName: 'Vitorep', value: 9_000_000 },
];

const fallbackSalesByState = [
  { name: 'LAGOS', value: 5_000_000 }, { name: 'OSUN', value: 3_000_000 },
  { name: 'OYO', value: 4_000_000 }, { name: 'DELTA', value: 2_000_000 },
  { name: 'IMO', value: 3_000_000 }, { name: 'KADUNA', value: 6_000_000, isMax: true },
  { name: 'EKITI', value: 4_000_000 }, { name: 'BENIN', value: 3_000_000 },
  { name: 'NASSARAWA', value: 2_000_000 }, { name: 'ABIA', value: 5_000_000 },
  { name: 'BAUCHI', value: 4_000_000 }, { name: 'JIGAWA', value: 3_000_000 },
];

/* ── Axis labels ──────────────────────────────────────────────────────────── */

// Split a long product label into (at most) two balanced lines, breaking on the
// space nearest the middle, then on a hyphen — keeps full names readable on the
// narrow x-axis instead of overlapping or being truncated.
function wrapAxisLabel(label: string): string[] {
  if (label.length <= 9) return [label];
  const mid = Math.floor(label.length / 2);
  const spaces: number[] = [];
  for (let i = 0; i < label.length; i++) if (label[i] === ' ') spaces.push(i);
  if (spaces.length) {
    let best = spaces[0];
    for (const s of spaces) if (Math.abs(s - mid) < Math.abs(best - mid)) best = s;
    return [label.slice(0, best), label.slice(best + 1)];
  }
  const hyphen = label.indexOf('-');
  if (hyphen !== -1) return [label.slice(0, hyphen + 1), label.slice(hyphen + 1)];
  return [label];
}

function WrappedAxisTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string | number } }) {
  const lines = wrapAxisLabel(String(payload?.value ?? ''));
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text key={i} x={0} y={0} dy={12 + i * 8} textAnchor="middle" fontSize={7} fontWeight={600} fill="#9CA3AF">
          {line}
        </text>
      ))}
    </g>
  );
}

/* ── Tooltips ─────────────────────────────────────────────────────────────── */

function SalesChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="bg-[#1C1C24] text-white rounded-lg px-3 py-2 text-[10px] shadow-lg border border-[#2D2D35] flex flex-col items-center">
      <p className="font-semibold text-gray-300">{label}</p>
      <p className="text-white font-bold">{fmtN(v)}</p>
    </div>
  );
}

function BarChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: { name: string; fullName?: string; quantity?: number } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-[#1C1C24] text-white rounded-lg px-3 py-2 text-[10px] shadow-lg border border-[#2D2D35] flex flex-col items-center">
      <p className="font-semibold text-gray-300">{p.payload.fullName ?? p.payload.name}</p>
      {p.payload.quantity != null && (
        <p className="text-gray-400">{p.payload.quantity.toLocaleString()} units</p>
      )}
      <p className="text-white font-bold">{fmtN(p.value)}</p>
    </div>
  );
}

/* ── Month Dropdown ───────────────────────────────────────────────────────── */

function MonthDropdown({ value, onChange, theme = 'light' }: { value: string; onChange: (v: string) => void; theme?: 'light' | 'dark' }) {
  const [open, setOpen] = useState(false);
  const months = ['This Month', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const isDark = theme === 'dark';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors ${isDark
          ? 'bg-[#3C006E] border-[#4D008C] hover:bg-[#32005C]'
          : 'bg-[#F9FAFB] border-gray-100 hover:bg-gray-100'
          }`}
      >
        <span className={`text-[8px] font-bold ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{value}</span>
        <ChevronDown size={10} className={isDark ? 'text-gray-300' : 'text-gray-400'} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 top-full mt-1 border rounded-lg shadow-lg z-50 py-1 min-w-[110px] max-h-[180px] overflow-y-auto ${isDark ? 'bg-[#3C006E] border-[#4D008C]' : 'bg-white border-gray-100'
            }`}>
            {months.map((m) => (
              <button key={m} onClick={() => { onChange(m); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-[10px] font-bold transition-colors ${isDark
                  ? (value === m ? 'text-white bg-[#4D008C]' : 'text-gray-300 hover:bg-[#4D008C]')
                  : (value === m ? 'text-[#AE00FF] bg-purple-50' : 'text-gray-600 hover:bg-gray-50')
                  }`}
              >{m}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Dashboard Component ──────────────────────────────────────────────────── */

interface DashboardClientProps {
  summary?: {
    totalRevenue: number;
    netProfit: number;
    totalExpenses: number;
    deliveryExpenses: number;
    revenueChangePct: number;
    expenseChangePct: number;
    profitChangePct: number;
    deliveryChangePct: number;
  };
  salesTrends?: {
    day: { name: string; value: number }[];
    week: { name: string; value: number }[];
    month: { name: string; value: number }[];
    year: number;
  };
  salesByProductData?: { name: string; fullName?: string; value: number; quantity?: number; isMax?: boolean }[];
  salesByStateData?: { name: string; fullName?: string; value: number; isMax?: boolean }[];
  inventory?: {
    totalValue: number;
    totalProducts: number;
    agentStock: number;
    warehouseStock: number;
    agentCount: number;
    warehouseCount: number;
    products: { id: string; name: string; total: number; value: number; lowStock: boolean }[];
  };
  settlementSummary?: {
    totalPendingRemittance: number;
    totalPendingCount: number;
    totalOverpayments: number;
    companyOwingAgents: number;
    topAgentName: string;
    topAgentState: string;
    topAgentRemitted: number;
  };
  userName?: string;
}

const fmtN = (n: number) => `N${Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
const fmtCompact = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`
    : v >= 1_000
      ? `${Math.round(v / 1_000)}k`
      : `${Math.round(v)}`;

export function DashboardClient({
  summary,
  salesTrends,
  salesByProductData,
  salesByStateData,
  inventory,
  settlementSummary,
  userName,
}: DashboardClientProps = {}) {
  const firstName = userName?.trim().split(/\s+/)[0] || 'there';
  const [mounted, setMounted] = useState(false);
  const [activeRange, setActiveRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const financialSummary = summary
    ? [
        { label: 'Total Revenue', value: fmtN(summary.totalRevenue), change: `${summary.revenueChangePct >= 0 ? '+' : ''}${summary.revenueChangePct}%`, isPositive: summary.revenueChangePct >= 0, subText: 'vs last month', highlight: 'default' as const },
        { label: 'Net Profit', value: fmtN(summary.netProfit), change: `${summary.profitChangePct >= 0 ? '+' : ''}${summary.profitChangePct}%`, isPositive: summary.profitChangePct >= 0, subText: 'vs last month', highlight: 'purple' as const },
        { label: 'Total Expenses', value: fmtN(summary.totalExpenses), change: `${summary.expenseChangePct >= 0 ? '+' : ''}${summary.expenseChangePct}%`, isPositive: summary.expenseChangePct <= 0, subText: 'vs last month', highlight: 'default' as const },
        { label: 'Delivery Expenses', value: fmtN(summary.deliveryExpenses), change: `${summary.deliveryChangePct >= 0 ? '+' : ''}${summary.deliveryChangePct}%`, isPositive: summary.deliveryChangePct <= 0, subText: 'vs last month', highlight: 'default' as const },
        { label: 'Tax Payable', value: '24%', change: '', isPositive: true, subText: '', highlight: 'default' as const },
      ]
    : fallbackFinancialSummary;

  const trends = salesTrends ?? fallbackSalesTrends;
  const rangeKey = activeRange === 'Daily' ? 'day' : activeRange === 'Weekly' ? 'week' : 'month';
  const salesChartData = trends[rangeKey]?.length ? trends[rangeKey] : fallbackSalesChartData;
  const salesHeading =
    activeRange === 'Daily'
      ? 'Sales · Last 7 Days'
      : activeRange === 'Weekly'
        ? 'Sales · Last 12 Weeks'
        : `Sales ${trends.year}`;
  const salesByProduct = salesByProductData && salesByProductData.length > 0 ? salesByProductData : fallbackSalesByProduct;
  const salesByState = salesByStateData && salesByStateData.length > 0 ? salesByStateData : fallbackSalesByState;

  const buildInventorySnapshot1 = () => {
    if (!inventory) return inventorySnapshot1;
    const top5 = inventory.products.slice(0, 5);
    return [
      { label: 'Total Inventory Value', value: fmtN(inventory.totalValue), subLabel: `${inventory.totalProducts.toLocaleString()} Products`, color: '#10B981', bg: 'bg-[#FDF9FF]' },
      ...top5.map(p => ({ label: p.name, value: fmtN(p.value), subLabel: `${p.total.toLocaleString()} Products`, color: '#10B981', bg: 'bg-white' as const })),
    ];
  };
  const inventorySnapshot1Data = buildInventorySnapshot1();

  const buildInventorySnapshot2 = () => {
    if (!inventory) return inventorySnapshot2;
    const next2 = inventory.products.slice(5, 7);
    const lowStock = inventory.products.find(p => p.lowStock);
    const items: any[] = next2.map(p => ({ label: p.name, value: fmtN(p.value), subLabel: `${p.total.toLocaleString()} Products`, color: '#10B981', bg: 'bg-white' }));
    if (lowStock) items.push({ label: lowStock.name, value: fmtN(lowStock.value), subLabel: `${lowStock.total.toLocaleString()} Products`, color: '#EF4444', bg: 'bg-white', badge: 'Low Stock' });
    items.push({ label: 'Stock With Agents', value: inventory.agentStock.toLocaleString(), subLabel: 'products across', subDetail: `${inventory.agentCount} delivery agents`, color: '#10B981', bg: 'bg-white' });
    items.push({ label: 'Stock In Warehouse', value: inventory.warehouseStock.toLocaleString(), subLabel: `products across ${inventory.warehouseCount}`, subDetail: 'warehouses', color: '#10B981', bg: 'bg-white' });
    return items;
  };
  const inventorySnapshot2Data = buildInventorySnapshot2();

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Navigation Arrows */}
      <div className="flex items-center gap-2 mb-2">
        <button className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F9F5FF] text-[#AE00FF] hover:bg-[#F3E8FF] transition-colors">
          <ChevronLeft size={14} />
        </button>
        <button className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F9F5FF] text-[#AE00FF] hover:bg-[#F3E8FF] transition-colors">
          <ChevronRight size={14} />
        </button>
        <button className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F9F5FF] text-[#AE00FF] hover:bg-[#F3E8FF] transition-colors ml-1">
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Welcome Back, {firstName}</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsCreateOpen(!isCreateOpen)}
              className="flex items-center gap-2 bg-[#A800FF] text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-purple-200/50 hover:bg-[#9100D6] transition-colors"
            >
              <Plus size={16} />
              Create
            </button>
            {isCreateOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCreateOpen(false)} />
                <div className="absolute right-0 top-[calc(100%+12px)] w-[260px] bg-white rounded-2xl shadow-[0_12px_40px_rgb(0,0,0,0.08)] border border-gray-100 p-7 z-50">
                  <button 
                    onClick={() => setIsCreateOpen(false)} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                  {/* Customer */}
                  <div className="mb-7">
                    <h3 className="text-[15px] font-medium text-gray-900 mb-4">Customer</h3>
                    <div className="flex flex-col gap-3.5 ml-1">
                      <Link href="/accounting/create-invoice" className="text-left text-[14px] text-gray-400 hover:text-gray-800 transition-colors block">Invoice</Link>
                      <Link href="/accounting/sales-receipt" className="text-left text-[14px] text-gray-400 hover:text-gray-800 transition-colors block">Sales Receipt</Link>
                      <Link href="/accounting/refund-receipt" className="text-left text-[14px] text-gray-400 hover:text-gray-800 transition-colors block">Refund Receipt</Link>
                    </div>
                  </div>
                  
                  {/* Suppliers */}
                  <div className="mb-7">
                    <h3 className="text-[15px] font-medium text-gray-900 mb-4">Suppliers</h3>
                    <div className="flex flex-col gap-3.5 ml-1">
                      <Link href="/accounting/expenses" className="text-left text-[14px] text-gray-400 hover:text-gray-800 transition-colors block">Expense</Link>
                      <Link href="/accounting/expenses?tab=supplier" className="text-left text-[14px] text-gray-400 hover:text-gray-800 transition-colors block">Add Supplier</Link>
                    </div>
                  </div>

                  {/* Other */}
                  <div>
                    <h3 className="text-[15px] font-medium text-gray-900 mb-4">Other</h3>
                    <div className="flex flex-col gap-3.5 ml-1">
                      <Link href="/accounting/accounting-ledger?tab=Journal+Entry" className="text-left text-[14px] text-gray-400 hover:text-gray-800 transition-colors block">Journal Entry</Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <button className="w-11 h-11 bg-[#FDF5FF] rounded-full flex items-center justify-center text-[#A800FF] hover:bg-[#F9E8FF] transition-colors shadow-sm">
            <MessageCircle size={20} className="fill-[#A800FF]" />
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white  p-6">
        <h2 className="text-[17px] font-bold text-gray-900 mb-5 tracking-tight">Financial Summary</h2>
        <div className="grid grid-cols-5 gap-3">
          {financialSummary.map((item, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 shadow-sm transition-shadow ${item.highlight === 'purple'
                ? 'bg-[#4B0082] border-[#4B0082]'
                : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold tracking-wide ${item.highlight === 'purple' ? 'text-gray-200' : 'text-gray-800'}`}>
                  {item.label}
                </span>
                {item.label !== 'Tax Payable' && (
                  <MonthDropdown
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    theme={item.highlight === 'purple' ? 'dark' : 'light'}
                  />
                )}
              </div>
              <p className={`text-[20px] font-black tracking-tight ${item.highlight === 'purple' ? 'text-white' : 'text-gray-600'}`}>
                {item.value}
              </p>
              {item.change && (
                <p className={`text-[10px] font-bold mt-1.5 flex items-center gap-1 ${item.isPositive ? 'text-[#10B981]' : 'text-red-500'
                  }`}>
                  {item.change} <span className={`font-medium ${item.highlight === 'purple' ? 'text-[#A78BFA]' : 'text-gray-400'}`}>{item.subText}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Snapshot */}
      <div className="bg-white  p-6  mt-6">
        <h2 className="text-[17px] font-bold text-gray-900 mb-5 tracking-tight">Inventory Snapshot</h2>

        {/* Row 1 */}
        <div className="grid grid-cols-6 gap-3 mb-3">
          {inventorySnapshot1Data.map((item: any, i: number) => (
            <div key={i} className={`rounded-xl border border-gray-100 p-3.5 shadow-sm hover:border-gray-200 transition-colors ${item.bg}`}>
              <span className="text-[9px] font-bold text-gray-800 tracking-wide block mb-2">{item.label}</span>
              <p className="text-[17px] font-black text-gray-600 tracking-tight mb-1">{item.value}</p>
              <span className="text-[10px] font-bold" style={{ color: item.color }}>{item.subLabel}</span>
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-[1fr_1fr_1.5fr_1.5fr_1fr_1fr] gap-3">
          {inventorySnapshot2Data.map((item: any, i: number) => (
            <div key={i} className={`rounded-xl border border-gray-100 p-3.5 shadow-sm hover:border-gray-200 transition-colors relative ${i === 2 || i === 3 ? 'col-span-1' : ''
              } ${i === 0 || i === 1 ? 'col-span-1' : ''
              }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-800 tracking-wide">{item.label}</span>
                {item.badge && (
                  <span className="text-[8px] font-bold bg-[#EF4444] text-white px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>

              {item.subDetail ? (
                <div className="flex items-end gap-2.5 mt-1">
                  <p className="text-[20px] font-black text-gray-600 tracking-tight leading-none">{item.value}</p>
                  <div className="flex flex-col pb-0.5">
                    <span className="text-[9px] font-bold leading-tight" style={{ color: item.color }}>{item.subLabel}</span>
                    <span className="text-[9px] font-bold leading-tight" style={{ color: item.color }}>{item.subDetail}</span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[17px] font-black text-gray-600 tracking-tight mb-1">{item.value}</p>
                  <span className="text-[10px] font-bold" style={{ color: item.color }}>{item.subLabel}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sales Chart + Agent Settlement */}
      <div className="grid grid-cols-[1fr_440px] gap-6 mt-6">
        {/* Sales Chart */}
        <div className="bg-white  border border-gray-100/50 p-6 ">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[11px] text-gray-400 font-medium">{salesHeading}</span>
              <div className="flex items-center gap-3">
                <p className="text-[22px] font-black text-gray-900">{(() => {
                  const total = salesChartData.reduce((s, x) => s + Number(x.value), 0);
                  return total >= 1_000_000 ? `N${(total / 1_000_000).toFixed(1)}M` : fmtN(total);
                })()}</p>
                <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
                  1.3% <span className="text-gray-400 font-medium tracking-wide">VS LAST YEAR</span>
                </span>
              </div>
            </div>
            <div className="flex items-center bg-[#F9FAFB] rounded-lg p-1 border border-gray-100">
              {(['Daily', 'Weekly', 'Monthly'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeRange === range
                    ? 'bg-[#1C1C24] text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-700'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          {mounted && (
            <div className="mt-4" style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }} tickFormatter={(v: number) => v >= 1_000_000 ? `${v / 1_000_000}M` : `${v / 1_000}K`} />
                  <Tooltip content={<SalesChartTooltip />} cursor={{ stroke: '#B400FF', strokeWidth: 1.5 }} />
                  <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" activeDot={{ r: 6, fill: '#6366F1', strokeWidth: 3, stroke: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Agent Settlement */}
        <div className="bg-white  p-6  flex flex-col">
          <h2 className="text-[17px] font-bold text-gray-900 mb-5 tracking-tight">Agent Settlement</h2>
          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Box 1 */}
            <div className="rounded-xl border border-gray-100 p-4 shadow-sm hover:border-gray-200 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-800 tracking-wide block mb-3">Total Pending Remittance</span>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[20px] font-black text-gray-600 tracking-tight leading-none">{settlementSummary ? fmtN(settlementSummary.totalPendingRemittance) : 'N600,000'}</p>
                  <span className="text-[18px] font-black text-gray-600 leading-none">{settlementSummary?.totalPendingCount ?? 4}</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-[#10B981] flex items-center gap-1">+12% <span className="font-medium text-gray-400">vs last month</span></p>
            </div>

            {/* Box 2 */}
            <div className="rounded-xl border border-gray-100 p-4 shadow-sm hover:border-gray-200 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-800 tracking-wide block mb-3">Total Overpayments</span>
                <p className="text-[20px] font-black text-gray-600 tracking-tight leading-none mb-2">{settlementSummary ? fmtN(settlementSummary.totalOverpayments) : 'N80,000'}</p>
              </div>
              <p className="text-[10px] font-bold text-[#10B981] flex items-center gap-1">+12% <span className="font-medium text-gray-400">vs last month</span></p>
            </div>

            {/* Box 3 */}
            <div className="rounded-xl border border-gray-100 p-4 shadow-sm hover:border-gray-200 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-800 tracking-wide block mb-3">Company Owing Agents</span>
                <p className="text-[20px] font-black text-gray-600 tracking-tight leading-none mb-2">{settlementSummary ? fmtN(settlementSummary.companyOwingAgents) : 'N800,000'}</p>
              </div>
              <p className="text-[10px] font-bold text-[#10B981] flex items-center gap-1">+12% <span className="font-medium text-gray-400">vs last month</span></p>
            </div>

            {/* Box 4 */}
            <div className="rounded-xl border border-gray-100 p-4 shadow-sm hover:border-gray-200 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-800 tracking-wide block mb-3">Top Performing Agents</span>
                <p className="text-[16px] font-black text-gray-600 tracking-tight leading-none mb-2">{settlementSummary ? `${settlementSummary.topAgentName}${settlementSummary.topAgentState ? ` | ${settlementSummary.topAgentState}` : ''}` : 'Mr Elijah | Kaduna'}</p>
              </div>
              <p className="text-[10px] font-bold text-[#10B981]">{settlementSummary ? `${fmtN(settlementSummary.topAgentRemitted)} Remitted` : 'N1.4M Remitted'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Bar Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Sales by Product */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[9px] text-gray-400 font-medium">Activity</span>
              <h3 className="text-[13px] font-bold text-gray-900">Sales by Product</h3>
            </div>
            <MonthDropdown value={selectedMonth} onChange={setSelectedMonth} />
          </div>
          {mounted && (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByProduct} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} tick={<WrappedAxisTick />} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#9CA3AF', fontWeight: 600 }} tickFormatter={(val) => val === 0 ? '0' : fmtCompact(val)} />
                  <Tooltip cursor={{ fill: 'transparent' }} content={<BarChartTooltip />} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={8}>
                    {salesByProduct.map((entry, index) => (
                      <Cell key={index} fill={entry.isMax ? '#4F46E5' : '#E5E7EB'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Sales by State */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[9px] text-gray-400 font-medium">Activity</span>
              <h3 className="text-[13px] font-bold text-gray-900">Sales by State</h3>
            </div>
            <div className="flex items-center gap-2">
              <MonthDropdown value={selectedMonth} onChange={setSelectedMonth} />
              <button className="text-[9px] font-bold text-white bg-[#1C1C24] px-3 py-1.5 rounded-md hover:bg-black transition-colors">
                See All
              </button>
            </div>
          </div>
          {mounted && (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByState} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fill: '#9CA3AF', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#9CA3AF', fontWeight: 600 }} tickFormatter={(val) => val === 0 ? '0' : fmtCompact(val)} />
                  <Tooltip cursor={{ fill: 'transparent' }} content={<BarChartTooltip />} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={8}>
                    {salesByState.map((entry, index) => (
                      <Cell key={index} fill={entry.isMax ? '#4F46E5' : '#E5E7EB'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
