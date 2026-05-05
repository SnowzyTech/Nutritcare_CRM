'use client';

import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import { salesRecordsData, SalesRecord } from '@/lib/mock-data/sales-records';

export function SalesRecordClient() {
  const router = useRouter();
  const [records, setRecords] = useState(salesRecordsData);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter states
  const [productFilter, setProductFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // UI state for dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const updateDeliveryFee = (id: string, newNumber: string) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, deliveryFee: `₦${newNumber}` } : r));
  };

  // Nigerian States
  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
    "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
    "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
    "Sokoto", "Taraba", "Yobe", "Zamfara"
  ];

  const products = ["Fonio Mill", "Trim & Tone", "Prosxact", "Shred Belly", "Neuro-Vive Balm"];
  const agents = ["Ibrahim Lawal", "Emeka Nwosu", "Yusuf Sani", "Samuel Etim", "Monday Oghene"];
  const statuses = ["Pending", "Delivered", "Cancelled", "Failed"];

  const filtered = records.filter((r) => {
    const matchSearch = r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.orderId.toLowerCase().includes(search.toLowerCase());
    const matchProduct = productFilter === 'All' || r.products.includes(productFilter);
    const matchState = stateFilter === 'All' || r.state === stateFilter;
    const matchAgent = agentFilter === 'All' || r.agent.includes(agentFilter);
    const matchStatus = statusFilter === 'All' || r.orderStatus === statusFilter;
    const matchDate = (!dateRange.from || r.date >= dateRange.from) &&
      (!dateRange.to || r.date <= dateRange.to);

    return matchSearch && matchProduct && matchState && matchAgent && matchStatus && matchDate;
  });

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
      <div className="flex flex-wrap items-center gap-3 mb-8">
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
                onClick={() => { setProductFilter('All'); setOpenDropdown(null); }}
              >
                All Products
              </div>
              {products.map(p => (
                <div
                  key={p}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => { setProductFilter(p); setOpenDropdown(null); }}
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
                onClick={() => { setStateFilter('All'); setOpenDropdown(null); }}
              >
                All States
              </div>
              {nigerianStates.map(s => (
                <div
                  key={s}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => { setStateFilter(s); setOpenDropdown(null); }}
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
                onClick={() => { setAgentFilter('All'); setOpenDropdown(null); }}
              >
                All Agents
              </div>
              {agents.map(a => (
                <div
                  key={a}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => { setAgentFilter(a); setOpenDropdown(null); }}
                >
                  {a}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Status Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('status')}
            className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[160px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CreditCard size={16} strokeWidth={2.5} />
              <span>{statusFilter === 'All' ? 'Payment Status' : statusFilter}</span>
            </div>
            <ChevronDown size={14} strokeWidth={3} className={`transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'status' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => { setStatusFilter('All'); setOpenDropdown(null); }}
              >
                All Statuses
              </div>
              {statuses.map(s => (
                <div
                  key={s}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => { setStatusFilter(s); setOpenDropdown(null); }}
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
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-purple-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">To</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
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
                  onClick={() => { setDateRange({ from: '', to: '' }); setOpenDropdown(null); }}
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
            onChange={(e) => setSearch(e.target.value)}
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
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Net AMount</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Delivery Fee</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Rem. Status</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Agent</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/accounting/sales-record/${r.id}`)}
                >
                  <td className="px-5 py-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-gray-800 tracking-tight">{r.orderId}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] text-white uppercase ${r.orderStatus === 'Delivered' ? 'bg-[#10B981]' :
                        r.orderStatus === 'Pending' ? 'bg-[#F59E0B]' :
                          'bg-[#EF4444]'
                        }`}>
                        {r.orderStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-6">
                    <div className="text-[13px] text-gray-700 leading-[1.3] font-medium whitespace-pre-line">{r.customer}</div>
                  </td>
                  <td className="px-5 py-6 text-[13px] text-gray-600 font-medium">{r.state}</td>
                  <td className="px-5 py-6 text-[13px] text-gray-800 font-bold tracking-tight">{r.products}</td>
                  <td className="px-5 py-6 text-[13px] text-gray-600 font-medium">{r.qty}</td>
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
                          onClick={() => setEditingId(null)}
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

