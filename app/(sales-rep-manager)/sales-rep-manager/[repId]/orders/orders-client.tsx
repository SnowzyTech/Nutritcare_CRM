"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft } from "lucide-react";
import Link from "next/link";

type OrderStatus = "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED" | "FAILED";

export type OrderListItem = {
  id: string;
  status: string;
  email: string;
  name: string;
  agent: { name: string; state: string } | null;
  product: string;
  qty: number;
  date: string;
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
  repId: string;
  repName: string;
  orders: OrderListItem[];
  counts: OrderCounts;
}

const STATUS_STYLES: Record<OrderStatus, { dot: string; bg: string; text: string; label: string }> = {
  PENDING: { dot: "bg-amber-400", bg: "bg-amber-400", text: "text-white", label: "Pending" },
  CONFIRMED: { dot: "bg-emerald-400", bg: "bg-emerald-500", text: "text-white", label: "Confirmed" },
  DELIVERED: { dot: "bg-green-500", bg: "bg-green-600", text: "text-white", label: "Delivered" },
  CANCELLED: { dot: "bg-orange-400", bg: "bg-orange-500", text: "text-white", label: "Cancelled" },
  FAILED: { dot: "bg-red-500", bg: "bg-red-500", text: "text-white", label: "Failed" },
};

const TABS: Array<{ label: string; key: OrderStatus | null; countKey: keyof OrderCounts }> = [
  { label: "All", key: null, countKey: "all" },
  { label: "Pending", key: "PENDING", countKey: "pending" },
  { label: "Confirmed", key: "CONFIRMED", countKey: "confirmed" },
  { label: "Delivered", key: "DELIVERED", countKey: "delivered" },
  { label: "Cancelled", key: "CANCELLED", countKey: "cancelled" },
  { label: "Failed", key: "FAILED", countKey: "failed" },
];

export function OrdersClient({ repId, repName, orders, counts }: OrdersClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    let result = activeTab ? orders.filter((o) => o.status === activeTab) : orders;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.product.toLowerCase().includes(q),
      );
    }
    return result;
  }, [orders, activeTab, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg border border-purple-200">
          {repName.charAt(0)}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{repName}'s Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-4 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.countKey];
          return (
            <button
              key={tab.key ?? "all"}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                isActive
                  ? "bg-purple-600 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab.label}{!isActive && count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <SlidersHorizontal size={18} />
          <span className="text-sm font-medium">Filter</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <span className="text-sm font-medium">Date</span>
          <ChevronLeft className="-rotate-90" size={14} />
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <span className="text-sm font-medium">Product</span>
          <ChevronLeft className="-rotate-90" size={14} />
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <span className="text-sm font-medium">State</span>
          <ChevronLeft className="-rotate-90" size={14} />
        </button>
        <button className="p-2 bg-gray-50 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowUpDown size={18} />
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          {(["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED", "FAILED"] as OrderStatus[]).map((s) => {
            const style = STATUS_STYLES[s];
            return (
              <span
                key={s}
                className={`px-3 py-1 ${style.bg} ${style.text} text-[10px] uppercase font-bold rounded-md shadow-sm tracking-wider`}
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
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-100 w-48 transition-all"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm bg-white">No orders found.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="pl-10 pr-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">G-Mail</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Name</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Agent</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Product</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-center">Quantity</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, idx) => {
                const style = STATUS_STYLES[order.status as OrderStatus];
                return (
                  <tr
                    key={order.id}
                    className={`group hover:bg-purple-50/50 transition-colors cursor-pointer border-b border-gray-50 last:border-0 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                    onClick={() => router.push(`/sales-rep-manager/${repId}/orders/${order.id}`)}
                  >
                    <td className="pl-6 pr-6 py-4 relative">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
                        <span className="text-gray-500 group-hover:text-gray-900 transition-colors font-medium">
                          {order.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{order.name}</td>
                    <td className="px-6 py-4">
                      {order.agent ? (
                        <div>
                          <p className="font-bold text-gray-900">{order.agent.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{order.agent.state}</p>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">{order.product}</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-600">{order.qty}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-500">{order.date}</td>
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
