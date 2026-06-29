'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircle,
  Box,
  MapPin,
  User,
  CreditCard,
  Calendar as CalendarIcon,
  ChevronDown,
  Edit2,
  Check,
  ClipboardList,
} from 'lucide-react';
import { SalesRecord } from '@/lib/mock-data/sales-records';
import { updateOrderDeliveryFeeAction } from '@/modules/finance/actions/sales-record.action';

type SalesRecordRow = Omit<SalesRecord, 'orderStatus' | 'remStatus'> & {
  orderStatus: string;
  remStatus: string;
};

interface SalesRecordClientProps {
  initialRecords?: SalesRecordRow[];
  products?: string[];
  agents?: { id: string; name: string }[];
  states?: string[];
}

const PAGE_SIZE = 20;

export function SalesRecordClient({ initialRecords = [], products: productProp, agents: agentProp, states: stateProp }: SalesRecordClientProps = {}) {
  const router = useRouter();
  const [records, setRecords] = useState<SalesRecordRow[]>(initialRecords);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Filter states
  const [productFilter, setProductFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // UI state for dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // Close any open filter dropdown when clicking outside the filter bar.
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const resetPage = () => setPage(1);

  const updateDeliveryFee = (id: string, newNumber: string) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, deliveryFee: `₦${newNumber}` } : r));
  };

  const persistDeliveryFee = async (id: string, value: string) => {
    const numeric = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
    setEditingId(null);
    try { await updateOrderDeliveryFeeAction({ orderId: id, deliveryFee: numeric }); } catch {}
  };

  // States are derived from the orders' customers so the filter values match
  // exactly how state was recorded at order creation.
  const nigerianStates = stateProp ?? [];

  const products = productProp ?? ["Fonio Mill", "Trim & Tone", "Prosxact", "Shred Belly", "Neuro-Vive Balm"];
  const agents = (agentProp ?? []).map(a => a.name);
  const statuses = ["Pending", "Confirmed", "Delivered", "Cancelled", "Failed"];
  const paymentStatuses = ["Paid", "Not Paid"];

  const filtered = records.filter((r) => {
    const matchSearch = r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.orderId.toLowerCase().includes(search.toLowerCase());
    const matchProduct = productFilter === 'All' || r.products.includes(productFilter);
    const matchState = stateFilter === 'All' || r.state === stateFilter;
    const matchAgent = agentFilter === 'All' || r.agent.includes(agentFilter);
    const matchStatus = statusFilter === 'All' || r.orderStatus === statusFilter;
    const matchPaymentStatus = paymentStatusFilter === 'All' || r.remStatus === paymentStatusFilter;
    const matchDate = (!dateRange.from || r.date >= dateRange.from) &&
      (!dateRange.to || r.date <= dateRange.to);

    return matchSearch && matchProduct && matchState && matchAgent && matchStatus && matchPaymentStatus && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    resetPage();
    setOpenDropdown(null);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-[#F9FAFB]">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronRight size={20} />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
        <button className="w-12 h-12 bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-105 transition-transform">
          <MessageCircle size={24} fill="currentColor" />
        </button>
      </div>

      <h1 className="text-[32px] font-bold text-gray-800 mb-8 tracking-tight">Sales Record</h1>

      {/* Filter Bar */}
      <div ref={filterBarRef} className="flex flex-wrap items-center gap-3 mb-8">
        {/* Product Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('product')}
            className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[130px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Box size={16} strokeWidth={2.5} />
              <span>{productFilter === 'All' ? 'Product' : productFilter}</span>
            </div>
            <ChevronDown size={14} strokeWidth={3} className={`transition-transform ${openDropdown === 'product' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'product' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => handleFilterChange(setProductFilter, 'All')}
              >
                All Products
              </div>
              {products.map(p => (
                <div
                  key={p}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => handleFilterChange(setProductFilter, p)}
                >
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* State Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('state')}
            className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[120px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MapPin size={16} strokeWidth={2.5} />
              <span>{stateFilter === 'All' ? 'State' : stateFilter}</span>
            </div>
            <ChevronDown size={14} strokeWidth={3} className={`transition-transform ${openDropdown === 'state' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'state' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3 max-h-[300px] overflow-y-auto custom-scrollbar">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => handleFilterChange(setStateFilter, 'All')}
              >
                All States
              </div>
              {nigerianStates.map(s => (
                <div
                  key={s}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => handleFilterChange(setStateFilter, s)}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('agent')}
            className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[120px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <User size={16} strokeWidth={2.5} />
              <span>{agentFilter === 'All' ? 'Agent' : agentFilter.split('\n')[0]}</span>
            </div>
            <ChevronDown size={14} strokeWidth={3} className={`transition-transform ${openDropdown === 'agent' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'agent' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => handleFilterChange(setAgentFilter, 'All')}
              >
                All Agents
              </div>
              {agents.map(a => (
                <div
                  key={a}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => handleFilterChange(setAgentFilter, a)}
                >
                  {a}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter (Order Status) */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('status')}
            className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[130px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ClipboardList size={16} strokeWidth={2.5} />
              <span>{statusFilter === 'All' ? 'Status' : statusFilter}</span>
            </div>
            <ChevronDown size={14} strokeWidth={3} className={`transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'status' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => handleFilterChange(setStatusFilter, 'All')}
              >
                All Statuses
              </div>
              {statuses.map(s => (
                <div
                  key={s}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => handleFilterChange(setStatusFilter, s)}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Status Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('paymentStatus')}
            className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[160px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CreditCard size={16} strokeWidth={2.5} />
              <span>{paymentStatusFilter === 'All' ? 'Payment Status' : paymentStatusFilter}</span>
            </div>
            <ChevronDown size={14} strokeWidth={3} className={`transition-transform ${openDropdown === 'paymentStatus' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'paymentStatus' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => handleFilterChange(setPaymentStatusFilter, 'All')}
              >
                All
              </div>
              {paymentStatuses.map(s => (
                <div
                  key={s}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => handleFilterChange(setPaymentStatusFilter, s)}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('date')}
            className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[140px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} strokeWidth={2.5} />
              <span>Date Range</span>
            </div>
            <ChevronDown size={14} strokeWidth={3} className={`transition-transform ${openDropdown === 'date' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'date' && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-4 w-72">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">From</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => { setDateRange(prev => ({ ...prev, from: e.target.value })); resetPage(); }}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-purple-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">To</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => { setDateRange(prev => ({ ...prev, to: e.target.value })); resetPage(); }}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-purple-300"
                  />
                </div>
                <button
                  onClick={() => setOpenDropdown(null)}
                  className="w-full bg-[#AE00FF] text-white py-2 rounded-lg text-sm font-bold mt-2"
                >
                  Apply Filter
                </button>
                <button
                  onClick={() => { setDateRange({ from: '', to: '' }); resetPage(); setOpenDropdown(null); }}
                  className="w-full text-gray-400 py-1 text-[12px] font-medium"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[300px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="w-full h-[48px] pl-12 pr-4 bg-white  rounded-xl text-[14px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-200"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[#E5E7EB]/80">
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Order ID</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Customer</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">State</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Product(s)</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Qty</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Total</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Discount</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Net Amount</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Delivery Fee</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Rem. Status</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Agent</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/accounting/sales-record/${r.id}`)}
                >
                  <td className="px-5 py-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-gray-800 tracking-tight">{r.orderId}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase ${r.orderStatus === 'Delivered' ? 'bg-[#10B981] text-white' :
                        r.orderStatus === 'Confirmed' ? 'bg-[#6EE7B7] text-[#065F46]' :
                          r.orderStatus === 'Pending' ? 'bg-[#F59E0B] text-white' :
                            'bg-[#EF4444] text-white'
                        }`}>
                        {r.orderStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-6">
                    <div className="text-[13px] text-gray-700 leading-[1.3] font-medium whitespace-pre-line">{r.customer}</div>
                  </td>
                  <td className="px-5 py-6 text-[13px] text-gray-600 font-medium">{r.state}</td>
                  <td className="px-5 py-6 text-[13px] text-gray-800 font-bold tracking-tight">
                    <div className="line-clamp-2 max-w-[220px]" title={r.products}>{r.products}</div>
                  </td>
                  <td className="px-5 py-6 text-[13px] text-gray-600 font-medium whitespace-nowrap">{r.qty}</td>
                  <td className="px-5 py-6 text-[13px] font-bold text-gray-800">{r.total}</td>
                  <td className="px-5 py-6 text-[13px] text-gray-600 font-medium">{r.discount}</td>
                  <td className="px-5 py-6 text-[13px] font-black text-gray-900">{r.netAmount}</td>
                  <td className="px-5 py-6">
                    {editingId === r.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[13px] text-gray-400 font-bold">₦</span>
                        <input
                          type="text"
                          value={r.deliveryFee.replace('₦', '')}
                          autoFocus
                          onChange={(e) => updateDeliveryFee(r.id, e.target.value)}
                          className="w-16 bg-transparent border-b border-purple-400 focus:outline-none text-[13px] text-gray-800 font-bold px-0 py-0"
                        />
                        <button
                          onClick={() => persistDeliveryFee(r.id, r.deliveryFee)}
                          className="p-1 text-green-500 hover:bg-green-50 rounded"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group min-w-[80px]">
                        <span className="text-[13px] text-gray-600 font-medium">{r.deliveryFee}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingId(r.id); }}
                          className="p-1.5 text-gray-300 hover:text-purple-500 hover:bg-purple-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-6">
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap ${r.remStatus === 'Paid' ? 'bg-[#10B981] text-white' :
                      'bg-[#E5E7EB] text-gray-600'
                      }`}>
                      {r.remStatus}
                    </span>
                  </td>
                  <td className="px-5 py-6">
                    <div className="text-[13px] text-gray-700 leading-[1.3] font-medium whitespace-pre-line">{r.agent}</div>
                  </td>
                  <td className="px-5 py-6 text-[13px] text-gray-500 font-medium whitespace-nowrap">{r.date}</td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-5 py-16 text-center text-[14px] text-gray-400 font-medium">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-1">
          <p className="text-[13px] text-gray-500 font-medium">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-[13px]">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-9 h-9 rounded-lg text-[13px] font-semibold transition-colors ${
                      page === p
                        ? 'bg-[#AE00FF] text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
