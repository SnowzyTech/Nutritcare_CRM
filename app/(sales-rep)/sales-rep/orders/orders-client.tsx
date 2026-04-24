'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';
import type { OrderStatus } from '@prisma/client';

export type OrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string; // ISO string (serialized from server)
  customer: { name: string; email: string | null };
  agent: { companyName: string; state: string | null } | null;
  items: Array<{ quantity: number; product: { name: string } }>;
};

export type OrderCounts = {
  all: number;
  pending: number;
  confirmed: number;
  delivered: number;
  cancelled: number;
  failed: number;
};

interface OrdersClientProps {
  orders: OrderListItem[];
  counts: OrderCounts;
  userName: string;
}

const STATUS_STYLES: Record<OrderStatus, { dot: string; bg: string; text: string; label: string }> = {
  PENDING:   { dot: 'bg-orange-400', bg: 'bg-[#FFF3CD]',  text: 'text-[#856404]',  label: 'Pending' },
  CONFIRMED: { dot: 'bg-green-400',  bg: 'bg-[#D1E7DD]',  text: 'text-[#0F5132]',  label: 'Confirmed' },
  DELIVERED: { dot: 'bg-green-600',  bg: 'bg-[#198754]',  text: 'text-white',       label: 'Delivered' },
  CANCELLED: { dot: 'bg-red-300',    bg: 'bg-[#F8D7DA]',  text: 'text-[#842029]',  label: 'Cancelled' },
  FAILED:    { dot: 'bg-red-600',    bg: 'bg-[#DC3545]',  text: 'text-white',       label: 'Failed' },
};

const TABS: Array<{ label: string; key: OrderStatus | null; countKey: keyof OrderCounts }> = [
  { label: 'All',       key: null,        countKey: 'all' },
  { label: 'Pending',   key: 'PENDING',   countKey: 'pending' },
  { label: 'Confirmed', key: 'CONFIRMED', countKey: 'confirmed' },
  { label: 'Delivered', key: 'DELIVERED', countKey: 'delivered' },
  { label: 'Cancelled', key: 'CANCELLED', countKey: 'cancelled' },
  { label: 'Failed',    key: 'FAILED',    countKey: 'failed' },
];

export function OrdersClient({ orders, counts, userName }: OrdersClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    let result = activeTab ? orders.filter((o) => o.status === activeTab) : orders;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (o) =>
          o.customer.name.toLowerCase().includes(q) ||
          (o.customer.email ?? '').toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, activeTab, searchQuery]);

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
        <button
          className="p-1 hover:bg-gray-100 rounded text-purple-400 ml-2"
          onClick={() => router.refresh()}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-700 mb-8">Welcome Back, {userName}</h1>

      {/* Status Tabs */}
      <div className="flex items-center gap-8 mb-8 border-b border-gray-100 pb-4 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.countKey];
          return (
            <button
              key={tab.key ?? 'all'}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 whitespace-nowrap px-6 py-2.5 transition-all group rounded-xl ${
                isActive ? 'bg-purple-200' : 'hover:text-gray-900 hover:bg-purple-100 cursor-pointer'
              }`}
            >
              <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-[#532194]' : 'text-gray-400'}`}>
                {tab.label}
                {tab.label !== 'All' && count > 0 && `(${count})`}
              </span>
              {tab.label === 'All' && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    isActive ? 'bg-[#D6BBFB] text-[#532194]' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
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
          {(['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED', 'FAILED'] as OrderStatus[]).map((s) => {
            const style = STATUS_STYLES[s];
            return (
              <span
                key={s}
                className={`px-4 py-1.5 ${style.bg} ${style.text} text-xs font-semibold rounded-md shadow-sm`}
              >
                {style.label}
              </span>
            );
          })}
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
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm bg-white">
            No orders found.
          </div>
        ) : (
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
              {filteredOrders.map((order) => {
                const style = STATUS_STYLES[order.status];
                const firstItem = order.items[0];
                const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
                const dateLabel = new Date(order.createdAt).toLocaleDateString('en-NG', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
                return (
                  <tr
                    key={order.id}
                    className="group hover:bg-gray-50/80 transition-colors cursor-pointer border-b border-gray-50 last:border-0"
                    onClick={() => router.push(`/sales-rep/orders/${order.id}`)}
                  >
                    <td className="pl-6 pr-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                        <span className="text-sm text-gray-500 group-hover:text-gray-900 transition-colors">
                          {order.customer.email ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-gray-700">{order.customer.name}</span>
                    </td>
                    <td className="px-6 py-5">
                      {order.agent ? (
                        <div>
                          <p className="text-sm font-medium text-gray-700">{order.agent.companyName}</p>
                          <p className="text-[11px] text-gray-400 font-medium">{order.agent.state}</p>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-gray-700">
                        {firstItem?.product.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm text-gray-500">{totalQty}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-sm text-gray-500">{dateLabel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
