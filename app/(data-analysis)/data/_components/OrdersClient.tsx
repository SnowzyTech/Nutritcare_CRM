'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  ChevronDown, 
  MessageCircle
} from 'lucide-react';
import { ALL_ORDERS } from '@/lib/mock-data/data-analysis';
import { useRouter } from 'next/navigation';

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  Pending: { dot: 'bg-yellow-400', bg: 'bg-[#FFF3CD]', text: 'text-[#856404]', label: 'Pending' },
  Confirmed: { dot: 'bg-green-400', bg: 'bg-[#D1E7DD]', text: 'text-[#0F5132]', label: 'Confirmed' },
  Delivered: { dot: 'bg-green-600', bg: 'bg-[#198754]', text: 'text-white', label: 'Delivered' },
  Cancelled: { dot: 'bg-red-300', bg: 'bg-[#F8D7DA]', text: 'text-[#842029]', label: 'Cancelled' },
  Failed: { dot: 'bg-red-600', bg: 'bg-[#DC3545]', text: 'text-white', label: 'Failed' },
};

const TABS = ['All', 'Pending', 'Confirmed', 'Delivered', 'Cancelled', 'Failed'];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export function OrdersClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);

  const counts = useMemo(() => {
    return {
      All: ALL_ORDERS.length,
      Pending: ALL_ORDERS.filter(o => o.status === 'Pending').length,
      Confirmed: ALL_ORDERS.filter(o => o.status === 'Confirmed').length,
      Delivered: ALL_ORDERS.filter(o => o.status === 'Delivered').length,
      Cancelled: ALL_ORDERS.filter(o => o.status === 'Cancelled').length,
      Failed: ALL_ORDERS.filter(o => o.status === 'Failed').length,
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return ALL_ORDERS.filter(o => {
      const matchesTab = activeTab === 'All' || o.status === activeTab;
      const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           o.gmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           o.salesRep.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = !dateFilter || o.date.includes(dateFilter);
      const matchesProduct = !productFilter || o.product === productFilter;
      const matchesState = !stateFilter || (o.state.toLowerCase().includes(stateFilter.toLowerCase()));
      const matchesTeam = !teamFilter || o.salesRep === teamFilter;
      return matchesTab && matchesSearch && matchesDate && matchesProduct && matchesState && matchesTeam;
    });
  }, [activeTab, searchQuery, dateFilter, productFilter, stateFilter, teamFilter]);

  const uniqueProducts = Array.from(new Set(ALL_ORDERS.map(o => o.product)));
  const uniqueStates = Array.from(new Set(ALL_ORDERS.map(o => o.state)));
  const uniqueSalesReps = Array.from(new Set(ALL_ORDERS.map(o => o.salesRep)));

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-700">Welcome Back, Favour</h1>
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 cursor-pointer shadow-sm hover:bg-purple-200 transition-colors">
          <MessageCircle size={22} fill="currentColor" />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const count = (counts as any)[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                isActive ? 'bg-[#F4EBFF] text-[#A020F0]' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <span className={`text-sm font-bold ${isActive ? 'text-[#A020F0]' : 'text-gray-400'}`}>
                {tab}
                {tab !== 'All' && count > 0 ? `(${count})` : ''}
              </span>
              {tab === 'All' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? 'bg-[#D6BBFB] text-[#A020F0]' : 'bg-gray-200 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2 text-gray-400">
          <SlidersHorizontal size={18} />
          <span className="text-sm font-medium">Filter</span>
        </div>
        
        <div className="relative">
          <input 
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>

        <div className="relative">
          <button 
            onClick={() => {
              setIsProductOpen(!isProductOpen);
              setIsStateOpen(false);
              setIsTeamOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium"
          >
            <span>{productFilter || 'Product'}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isProductOpen ? 'rotate-180' : ''}`} />
          </button>
          {isProductOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProductOpen(false)} />
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 min-w-[150px] max-h-[250px] overflow-y-auto">
                <button
                  onClick={() => { setProductFilter(''); setIsProductOpen(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-gray-600 hover:bg-purple-50"
                >
                  All Products
                </button>
                {uniqueProducts.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setProductFilter(p); setIsProductOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-purple-50 transition-colors ${
                      productFilter === p ? 'text-[#A020F0] bg-purple-50' : 'text-gray-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => {
              setIsStateOpen(!isStateOpen);
              setIsProductOpen(false);
              setIsTeamOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium"
          >
            <span>{stateFilter || 'State'}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isStateOpen ? 'rotate-180' : ''}`} />
          </button>
          {isStateOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsStateOpen(false)} />
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 min-w-[150px] max-h-[250px] overflow-y-auto">
                <button
                  onClick={() => { setStateFilter(''); setIsStateOpen(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-gray-600 hover:bg-purple-50"
                >
                  All States
                </button>
                {NIGERIAN_STATES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStateFilter(s); setIsStateOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-purple-50 transition-colors ${
                      stateFilter === s ? 'text-[#A020F0] bg-purple-50' : 'text-gray-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => {
              setIsTeamOpen(!isTeamOpen);
              setIsProductOpen(false);
              setIsStateOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium"
          >
            <span>{teamFilter || 'Team'}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isTeamOpen ? 'rotate-180' : ''}`} />
          </button>
          {isTeamOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsTeamOpen(false)} />
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 min-w-[150px] max-h-[250px] overflow-y-auto">
                <button
                  onClick={() => { setTeamFilter(''); setIsTeamOpen(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-gray-600 hover:bg-purple-50"
                >
                  All Teams
                </button>
                {uniqueSalesReps.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setTeamFilter(s); setIsTeamOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-purple-50 transition-colors ${
                      teamFilter === s ? 'text-[#A020F0] bg-purple-50' : 'text-gray-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowUpDown size={18} />
        </button>

        <div className="flex items-center gap-2 ml-2">
          {Object.entries(STATUS_STYLES).map(([key, style]) => (
            <span key={key} className={`px-3 py-1 rounded text-[10px] font-bold shadow-sm ${style.bg} ${style.text}`}>
              {style.label}
            </span>
          ))}
        </div>

        <div className="ml-auto relative">
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-200 w-48 shadow-sm"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#F8F9FA] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-separate border-spacing-y-0">
          <thead>
            <tr className="bg-gray-100/50">
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">G-Mail</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Agent</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">State</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sales Rep</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Quantity</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredOrders.map((order) => {
              const style = STATUS_STYLES[order.status];
              return (
                <tr 
                  key={order.id} 
                  onClick={() => router.push(`/data/order/${order.id === '1' ? '012994248' : order.id === '2' ? '012994249' : order.id === '3' ? '012994250' : order.id === '4' ? '012994248' : order.id === '5' ? '012994250' : order.id === '7' ? '012994252' : order.id === '9' ? '012994251' : '012994248'}`)}
                  className="group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                      <span className="text-sm text-gray-500 group-hover:text-gray-900 transition-colors">{order.gmail}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-700">{order.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    {order.agent ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700">{order.agent.name}</p>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{order.state}</p>
                      <p className="text-[10px] text-gray-400">{order.state} State</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-medium">{order.salesRep}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-medium">{order.product}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">{order.quantity}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-500">{order.date}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
