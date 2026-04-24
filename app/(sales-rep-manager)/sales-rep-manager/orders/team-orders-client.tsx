"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";

type OrderStatus = "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED" | "FAILED";

export type TeamOrderListItem = {
  id: string;
  status: string;
  email: string;
  name: string;
  agent: { name: string; state: string } | null;
  salesRep: string;
  product: string;
  qty: number;
  date: string; // ISO date: YYYY-MM-DD
};

export type OrderCounts = {
  all: number;
  pending: number;
  confirmed: number;
  delivered: number;
  cancelled: number;
  failed: number;
};

interface TeamOrdersClientProps {
  orders: TeamOrderListItem[];
  counts: OrderCounts;
}

const STATUS_STYLES: Record<OrderStatus, { dot: string; bg: string; text: string; label: string }> = {
  PENDING: { dot: "bg-amber-400", bg: "bg-[#FDE68A]", text: "text-gray-900", label: "Pending" },
  CONFIRMED: { dot: "bg-[#6EE7B7]", bg: "bg-[#6EE7B7]", text: "text-gray-900", label: "Confirmed" },
  DELIVERED: { dot: "bg-[#10B981]", bg: "bg-[#10B981]", text: "text-white", label: "Delivered" },
  CANCELLED: { dot: "bg-[#FCA5A5]", bg: "bg-[#FCA5A5]", text: "text-gray-900", label: "Cancelled" },
  FAILED: { dot: "bg-[#DC2626]", bg: "bg-[#DC2626]", text: "text-white", label: "Failed" },
};

const TABS: Array<{ label: string; key: OrderStatus | null; countKey: keyof OrderCounts }> = [
  { label: "All", key: null, countKey: "all" },
  { label: "Pending", key: "PENDING", countKey: "pending" },
  { label: "Confirmed", key: "CONFIRMED", countKey: "confirmed" },
  { label: "Delivered", key: "DELIVERED", countKey: "delivered" },
  { label: "Cancelled", key: "CANCELLED", countKey: "cancelled" },
  { label: "Failed", key: "FAILED", countKey: "failed" },
];

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

export function TeamOrdersClient({ orders, counts }: TeamOrdersClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const uniqueProducts = useMemo(
    () => Array.from(new Set(orders.map(o => o.product).filter(Boolean))).sort(),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    let result = activeTab ? orders.filter(o => o.status === activeTab) : orders;

    if (dateFilter) {
      result = result.filter(o => o.date === dateFilter);
    }

    if (productFilter) {
      result = result.filter(o => o.product === productFilter);
    }

    if (stateFilter) {
      result = result.filter(o => o.agent?.state === stateFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        o =>
          o.name.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.product.toLowerCase().includes(q) ||
          o.salesRep.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, activeTab, dateFilter, productFilter, stateFilter, searchQuery]);

  const hasActiveFilters = dateFilter || productFilter || stateFilter;

  function clearFilters() {
    setDateFilter("");
    setProductFilter("");
    setStateFilter("");
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 relative">
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Team&apos;s Orders</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-100 pb-4 overflow-x-auto no-scrollbar">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.countKey];
          return (
            <button
              key={tab.key ?? "all"}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-[#FAF5FF] text-gray-900 font-bold shadow-sm"
                  : "text-gray-500 font-medium hover:text-gray-900"
              }`}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                    isActive ? "bg-[#D6BBFB] text-white" : "text-gray-400"
                  }`}
                >
                  {isActive ? count : `(${count})`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white py-4">
        <div className="flex items-center gap-2 text-gray-500 pr-2 border-r border-gray-200">
          <SlidersHorizontal size={18} />
          <span className="text-sm font-medium">Filter</span>
        </div>

        {/* Date */}
        <div className="relative min-w-[140px]">
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full appearance-none bg-gray-900 border border-gray-900 rounded-lg pl-4 pr-3 py-2 text-sm text-white font-medium outline-none hover:bg-gray-800 transition-colors cursor-pointer"
            style={{ colorScheme: "dark" }}
          />
        </div>

        {/* Product */}
        <div className="relative min-w-[120px]">
          <select
            value={productFilter}
            onChange={e => setProductFilter(e.target.value)}
            className="w-full appearance-none bg-gray-900 border border-gray-900 rounded-lg pl-4 pr-10 py-2 text-sm text-white font-medium outline-none hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <option value="">Product</option>
            {uniqueProducts.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <ChevronLeft
            className="-rotate-90 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            size={14}
          />
        </div>

        {/* State */}
        <div className="relative min-w-[120px]">
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            className="w-full appearance-none bg-gray-900 border border-gray-900 rounded-lg pl-4 pr-10 py-2 text-sm text-white font-medium outline-none hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <option value="">State</option>
            {NIGERIAN_STATES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronLeft
            className="-rotate-90 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            size={14}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-purple-600 font-semibold hover:underline"
          >
            Clear filters
          </button>
        )}

        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors ml-2">
          <ArrowUpDown size={18} />
        </button>

        <div className="flex items-center gap-2 flex-wrap ml-4">
          {(["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED", "FAILED"] as OrderStatus[]).map(s => {
            const style = STATUS_STYLES[s];
            return (
              <span
                key={s}
                className={`px-3 py-1.5 ${style.bg} ${style.text} text-[10px] font-bold rounded-lg shadow-sm tracking-wider w-24 text-center`}
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
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-100 w-48 transition-all"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#FAFAFA] rounded-2xl border border-gray-100 overflow-hidden mb-24">
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm bg-white">No orders found.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#F8F7FB] border-b border-gray-100">
                <th className="pl-10 pr-6 py-4 font-bold text-gray-500 text-sm w-16">G-Mail</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm">Name</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm">Agent</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm">Sales Rep</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm">Product</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm text-center">Quantity</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-sm text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, idx) => {
                const style = STATUS_STYLES[order.status as OrderStatus];
                return (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/sales-rep-manager/orders/${order.id}`)}
                    className={`group hover:bg-gray-50/80 transition-colors border-b border-gray-100 last:border-0 cursor-pointer ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"
                    }`}
                  >
                    <td className="pl-6 pr-6 py-4 relative">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
                        <span className="text-gray-500 font-medium">{order.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">
                      {order.name.split(" ").map((word, i) => (
                        <div key={i}>{word}</div>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {order.agent ? (
                        <div>
                          <p className="font-medium text-gray-700">{order.agent.name}</p>
                          <p className="text-[10px] text-gray-400">{order.agent.state}</p>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">
                      {order.salesRep.split(" ").map((word, i) => (
                        <div key={i}>{word}</div>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{order.product}</td>
                    <td className="px-6 py-4 text-center text-gray-500 font-medium">{order.qty}</td>
                    <td className="px-6 py-4 text-right text-gray-500 font-medium whitespace-nowrap">
                      {formatDate(order.date)}
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
