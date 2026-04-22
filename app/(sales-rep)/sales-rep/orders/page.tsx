'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Calendar,
  ArrowUpDown
} from 'lucide-react';

interface Order {
  id: string;
  email: string;
  name: string;
  agent?: string;
  agentLocation?: string;
  product: string;
  quantity: number;
  date: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled' | 'failed';
}

const mockOrders: Order[] = [
  {
    id: '1',
    email: 'adewale.johnson.ng@gmail.com',
    name: 'Adewale Johnson',
    product: 'Prosxact',
    quantity: 3,
    date: '03-02-2026',
    status: 'pending',
  },
  {
    id: '2',
    email: 'funke.adebayo.ng@gmail.com',
    name: 'Funke Adebayo',
    product: 'Shred Belly',
    quantity: 2,
    date: '03-02-2026',
    status: 'pending',
  },
  {
    id: '3',
    email: 'ibrahim.musa.ng@gmail.com',
    name: 'Ibrahim Musa',
    agent: 'Mr. Ola',
    agentLocation: 'Lagos State',
    product: 'Fonio-Mill',
    quantity: 5,
    date: '03-02-2026',
    status: 'failed',
  },
  {
    id: '4',
    email: 'chinedu.okafor.ng@gmail.com',
    name: 'Chinedu Okafor',
    agent: 'Mr. Qudus',
    agentLocation: 'Lagos State',
    product: 'Trim and Tone',
    quantity: 4,
    date: '03-02-2026',
    status: 'confirmed',
  },
  {
    id: '5',
    email: 'blessing.eze.ng@gmail.com',
    name: 'Blessing Eze',
    agent: 'Mr. Oyelowo',
    agentLocation: 'Ogun State',
    product: 'Neuro-Vive Balm',
    quantity: 1,
    date: '03-02-2026',
    status: 'cancelled',
  },
  {
    id: '6',
    email: 'sola.ogunleye.ng@gmail.com',
    name: 'Sola Ogunleye',
    product: 'Prosxact',
    quantity: 3,
    date: '03-02-2026',
    status: 'pending',
  },
  {
    id: '7',
    email: 'halima.abdullahi.ng@gmail.com',
    name: 'Halima Abdullahi',
    agent: 'Mr. Praise',
    agentLocation: 'Ebonyi State',
    product: 'Shred Belly',
    quantity: 6,
    date: '03-02-2026',
    status: 'confirmed',
  },
];

const statusStyles: Record<string, { dot: string; bg: string; text: string }> = {
  pending: { dot: 'bg-orange-400', bg: 'bg-[#FFF3CD]', text: 'text-[#856404]' },
  confirmed: { dot: 'bg-green-400', bg: 'bg-[#D1E7DD]', text: 'text-[#0F5132]' },
  delivered: { dot: 'bg-green-600', bg: 'bg-[#198754]', text: 'text-white' },
  cancelled: { dot: 'bg-red-300', bg: 'bg-[#F8D7DA]', text: 'text-[#842029]' },
  failed: { dot: 'bg-red-600', bg: 'bg-[#DC3545]', text: 'text-white' },
};

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const countByStatus = {
    all: 38, // Hardcoded for mockup parity
    pending: mockOrders.filter((o) => o.status === 'pending').length,
    confirmed: 8,
    delivered: 7,
    cancelled: 2,
    failed: 1,
  };

  const filteredOrders = activeTab
    ? mockOrders.filter((o) => o.status === activeTab)
    : mockOrders;

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Top Navigation Icons */}
      <div className="flex items-center gap-4 mb-6">
        <button className="p-1 hover:bg-gray-100 rounded text-purple-400">
          <ChevronLeft size={16} />
        </button>
        <button className="p-1 hover:bg-gray-100 rounded text-purple-400">
          <ChevronRight size={16} />
        </button>
        <button className="p-1 hover:bg-gray-100 rounded text-purple-400 ml-2">
          <RotateCcw size={16} />
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-700 mb-8">Welcome Back, Tolani</h1>

      {/* Status Tabs */}
      <div className="flex items-center gap-8 mb-8 border-b border-gray-100 pb-4 overflow-x-auto no-scrollbar">
        {[
          { label: 'All', key: null, count: countByStatus.all },
          { label: 'Pending', key: 'pending', count: countByStatus.pending },
          { label: 'Confirmed', key: 'confirmed', count: countByStatus.confirmed },
          { label: 'Delivered', key: 'delivered', count: countByStatus.delivered },
          { label: 'Cancelled', key: 'cancelled', count: countByStatus.cancelled },
          { label: 'Failed', key: 'failed', count: countByStatus.failed },
        ].map((tab) => (
          <button
            key={tab.key || 'all'}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-2 whitespace-nowrap px-6 py-2.5 transition-all group rounded-xl ${activeTab === tab.key
              ? 'bg-purple-200'
              : 'hover:text-gray-900 hover:bg-purple-100 cursor-pointer'
              }`}
          >
            <span className={`text-sm font-bold tracking-tight ${activeTab === tab.key
              ? 'text-[#532194]'
              : 'text-gray-400'
              }`}>
              {tab.label}
              {tab.label !== 'All' && tab.count > 0 && `(${tab.count})`}
            </span>
            {tab.label === 'All' && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${activeTab === tab.key ? 'bg-[#D6BBFB] text-[#532194]' : 'bg-gray-200 text-gray-500'
                }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <button className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
          <SlidersHorizontal size={18} />
          <span className="text-sm font-medium">Filter</span>
        </button>

        <button className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
          <span className="text-sm font-medium">Date</span>
          <ChevronLeft className="-rotate-90" size={16} />
        </button>

        <button className="p-2 bg-white rounded-lg text-gray-400">
          <ArrowUpDown size={18} />
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-4 py-1.5 bg-[#FFF3CD] text-[#856404] text-xs font-semibold rounded-md border border-yellow-100 shadow-sm">Pending</span>
          <span className="px-4 py-1.5 bg-[#D1E7DD] text-[#0F5132] text-xs font-semibold rounded-md border border-green-100 shadow-sm">Confirmed</span>
          <span className="px-4 py-1.5 bg-[#198754] text-white text-xs font-semibold rounded-md shadow-sm">Delivered</span>
          <span className="px-4 py-1.5 bg-[#F8D7DA] text-[#842029] text-xs font-semibold rounded-md border border-red-100 shadow-sm">Cancelled</span>
          <span className="px-4 py-1.5 bg-[#DC3545] text-white text-xs font-semibold rounded-md shadow-sm">Failed</span>
        </div>

        <div className="ml-auto relative">
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-10 py-2 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-200 w-48 shadow-sm"
          />
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-50/50 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pl-12 pr-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">G-Mail</th>
              <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Agent</th>
              <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                className="group hover:bg-gray-50/80 transition-colors cursor-pointer border-b border-gray-50 last:border-0"
                onClick={() => router.push(`/sales-rep/orders/${order.id}`)}
              >
                <td className="pl-6 pr-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${statusStyles[order.status].dot}`} />
                    <span className="text-sm text-gray-500 group-hover:text-gray-900 transition-colors">{order.email}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm font-medium text-gray-700">{order.name}</span>
                </td>
                <td className="px-6 py-5">
                  {order.agent ? (
                    <div>
                      <p className="text-sm font-medium text-gray-700">{order.agent}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{order.agentLocation}</p>
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm font-medium text-gray-700">{order.product}</span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="text-sm text-gray-500">{order.quantity}</span>
                </td>
                <td className="px-6 py-5 text-right">
                  <span className="text-sm text-gray-500">{order.date}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
