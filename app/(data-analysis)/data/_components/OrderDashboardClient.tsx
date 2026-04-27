'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircle
} from 'lucide-react';
import { MOCK_ORDERS, SALES_REPS, Order } from '@/lib/mock-data/data-analysis';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const STATUS_STYLES = {
  Pending: { dot: 'bg-yellow-400', bg: 'bg-[#FFF9E6]', text: 'text-[#856404]', label: 'Pending' },
  Confirmed: { dot: 'bg-[#27AE60]', bg: 'bg-[#EBF7EF]', text: 'text-[#0F5132]', label: 'Confirmed' },
  Delivered: { dot: 'bg-[#198754]', bg: 'bg-[#198754]', text: 'text-white', label: 'Delivered' },
  Cancelled: { dot: 'bg-[#F2994A]', bg: 'bg-[#FFF3E6]', text: 'text-[#856404]', label: 'Cancelled' },
  Failed: { dot: 'bg-[#EB5757]', bg: 'bg-[#EB5757]', text: 'text-white', label: 'Failed' },
};

const TABS = ['All', 'Pending', 'Confirmed', 'Delivered', 'Cancelled', 'Failed'];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export function OrderDashboardClient({ id }: { id: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedState, setSelectedState] = useState('All');

  const rep = SALES_REPS.find(r => r.id === id) || SALES_REPS[0];
  const orders = MOCK_ORDERS[id] || MOCK_ORDERS['adebimpe-tolani'] || [];

  const uniqueProducts = useMemo(() => {
    const products = new Set(orders.map(o => o.product));
    return ['All', ...Array.from(products)];
  }, [orders]);

  const uniqueStates = useMemo(() => {
    return ['All', ...NIGERIAN_STATES];
  }, []);

  const counts = useMemo(() => {
    return {
      All: orders.length,
      Pending: orders.filter(o => o.status === 'Pending').length,
      Confirmed: orders.filter(o => o.status === 'Confirmed').length,
      Delivered: orders.filter(o => o.status === 'Delivered').length,
      Cancelled: orders.filter(o => o.status === 'Cancelled').length,
      Failed: orders.filter(o => o.status === 'Failed').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesTab = activeTab === 'All' || o.status === activeTab;
      const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.gmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = !dateFilter || o.date.includes(dateFilter);
      const matchesProduct = selectedProduct === 'All' || o.product === selectedProduct;
      const matchesState = selectedState === 'All' || 
        (o.agent?.state?.toLowerCase().includes(selectedState.toLowerCase()));
      return matchesTab && matchesSearch && matchesDate && matchesProduct && matchesState;
    });
  }, [orders, activeTab, searchQuery, dateFilter, selectedProduct, selectedState]);

  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isStateOpen, setIsStateOpen] = useState(false);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
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
        </div>

        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 cursor-pointer shadow-sm hover:bg-purple-200 transition-colors">
          <MessageCircle size={20} fill="currentColor" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-2 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const count = (counts as any)[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 ${isActive ? 'bg-purple-50 text-[#A020F0]' : 'text-gray-400 hover:bg-gray-50'
                }`}
            >
              <span className={`text-sm font-bold ${isActive ? 'text-[#A020F0]' : 'text-gray-400'}`}>
                {tab}
                {tab !== 'All' && count > 0 ? `(${count})` : ''}
              </span>
              {tab === 'All' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? 'bg-purple-200 text-[#A020F0]' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col items-start gap-6 justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <SlidersHorizontal size={18} />
            <span className="text-sm font-medium">Filter</span>
          </div>

          <div className="relative group">
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
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium"
            >
              <span>{selectedProduct === 'All' ? 'Product' : selectedProduct}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isProductOpen ? 'rotate-180' : ''}`} />
            </button>
            {isProductOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProductOpen(false)} />
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 min-w-[150px] max-h-[250px] overflow-y-auto">
                  {uniqueProducts.map((product) => (
                    <button
                      key={product}
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsProductOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-purple-50 transition-colors ${
                        selectedProduct === product ? 'text-[#A020F0] bg-purple-50' : 'text-gray-600'
                      }`}
                    >
                      {product}
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
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium"
            >
              <span>{selectedState === 'All' ? 'State' : selectedState}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isStateOpen ? 'rotate-180' : ''}`} />
            </button>
            {isStateOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsStateOpen(false)} />
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 min-w-[150px] max-h-[250px] overflow-y-auto">
                  {uniqueStates.map((state) => (
                    <button
                      key={state}
                      onClick={() => {
                        setSelectedState(state);
                        setIsStateOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-purple-50 transition-colors ${
                        selectedState === state ? 'text-[#A020F0] bg-purple-50' : 'text-gray-600'
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button className="p-2 text-gray-400">
            <ArrowUpDown size={18} />
          </button>


        </div>


        <div className=" flex items-end justify-around gap-4">
          <div className="flex items-center gap-2 ml-2">
            {Object.entries(STATUS_STYLES).map(([key, style]) => (
              <span key={key} className={`px-4 py-1 rounded-md text-[10px] font-bold shadow-sm ${style.bg} ${style.text}`}>
                {style.label}
              </span>
            ))}
          </div>
          <div className='flex items-end justify-between w-full'>
            <div className="relative w-48">
              <input
                type="text"
                placeholder="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10 py-2 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-200 w-full shadow-sm"
              />
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#F8F9FA] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-separate border-spacing-y-0">
          <thead>
            <tr>
              <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">G-Mail</th>
              <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Agent</th>
              <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product</th>
              <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Quantity</th>
              <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredOrders.map((order) => {
              const style = (STATUS_STYLES as any)[order.status] || STATUS_STYLES.Pending;
              return (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/data/sales-reps/${id}/order/${order.id === '1' ? '012994248' : order.id === '2' ? '012994249' : order.id === '3' ? '012994251' : order.id === '4' ? '012994248' : order.id === '5' ? '012994250' : order.id === '6' ? '012994252' : order.id === '7' ? '012994250' : order.id === '9' ? '012994251' : order.id === '10' ? '012994252' : '012994248'}`)}
                  className="group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                      <span className="text-sm text-gray-500 group-hover:text-gray-900 transition-colors">{order.gmail}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-medium text-gray-700">{order.name}</span>
                  </td>
                  <td className="px-8 py-5">
                    {order.agent ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700">{order.agent.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{order.agent.state}</p>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm text-gray-600 font-medium">{order.product}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="text-sm text-gray-600">{order.quantity}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
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
