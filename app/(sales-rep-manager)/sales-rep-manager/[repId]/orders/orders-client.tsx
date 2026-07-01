"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, RotateCcw } from "lucide-react";
import { formatDate } from "@/lib/utils";

type OrderStatus = "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED" | "FAILED";

export type OrderListItem = {
  id: string;
  status: string;
  email: string;
  name: string;
  agent: { name: string; state: string } | null;
  product: string;
  qty: number;
  isReorder: boolean;
  itemNames: string[]; // all product names on the order (for the +N badge)
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

interface OrdersClientProps {
  repId: string;
  repName: string;
  orders: OrderListItem[];
  counts: OrderCounts;
  products?: string[];
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

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

export function OrdersClient({ repId, repName, orders, counts, products = [] }: OrdersClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  // Full catalog when provided; otherwise fall back to products seen in the orders
  // (each order can carry several products, so flatten itemNames — not just the first).
  const uniqueProducts = useMemo(() => {
    if (products.length > 0) return products;
    return Array.from(new Set(orders.flatMap(o => o.itemNames).filter(Boolean))).sort();
  }, [products, orders]);

  const filteredOrders = useMemo(() => {
    let result = activeTab ? orders.filter(o => o.status === activeTab) : orders;

    if (dateFilter) result = result.filter(o => o.date === dateFilter);
    if (productFilter) result = result.filter(o => o.itemNames.includes(productFilter));
    if (stateFilter) result = result.filter(o => o.agent?.state === stateFilter);

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        o =>
          o.name.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.product.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, activeTab, dateFilter, productFilter, stateFilter, searchQuery]);

  const hasActiveFilters = dateFilter || productFilter || stateFilter;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg border border-purple-200">
          {repName.charAt(0)}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{repName}&apos;s Orders</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-4 overflow-x-auto no-scrollbar">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.countKey];
          return (
            <button
              key={tab.key ?? "all"}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                isActive ? "bg-purple-600 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              {!isActive && count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-gray-500 pr-2 border-r border-gray-200">
          <SlidersHorizontal size={18} />
          <span className="text-sm font-medium">Filter</span>
        </div>

        {/* Date */}
        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-3 py-2 text-sm text-gray-700 font-medium outline-none hover:bg-gray-100 transition-colors cursor-pointer"
          />
        </div>

        {/* Product */}
        <div className="relative">
          <select
            value={productFilter}
            onChange={e => setProductFilter(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 font-medium outline-none hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <option value="">Product</option>
            {uniqueProducts.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ChevronLeft className="-rotate-90 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
        </div>

        {/* State */}
        <div className="relative">
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 font-medium outline-none hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <option value="">State</option>
            {NIGERIAN_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronLeft className="-rotate-90 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => { setDateFilter(""); setProductFilter(""); setStateFilter(""); }}
            className="text-xs text-purple-600 font-semibold hover:underline"
          >
            Clear
          </button>
        )}

        <button className="p-2 bg-gray-50 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowUpDown size={18} />
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {(["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED", "FAILED"] as OrderStatus[]).map(s => {
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

        <div className="w-full sm:w-auto sm:ml-auto relative">
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-100 w-full sm:w-48 transition-all"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 text-center text-gray-400 text-sm">No orders found.</div>
      ) : (
        <>
          {/* ── Mobile Card List (visible on small screens) ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredOrders.map(order => {
              const style = STATUS_STYLES[order.status as OrderStatus];
              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/sales-rep-manager/${repId}/orders/${order.id}`)}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style?.dot}`} />
                      <span className="text-sm font-bold text-gray-900 truncate">{order.name}</span>
                      {order.isReorder && (
                        <span className="inline-flex items-center gap-0.5 bg-purple-100 text-[#532194] text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                          <RotateCcw size={8} /> Re
                        </span>
                      )}
                    </div>
                    {style && (
                      <span className={`${style.bg} ${style.text} text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shrink-0`}>
                        {style.label}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs text-gray-500">
                    <div className="truncate col-span-2"><span className="text-gray-400">Email:</span> {order.email}</div>
                    <div className="truncate flex items-center gap-1">
                      <span className="text-gray-400">Product:</span>{" "}
                      <span className="text-gray-700 font-medium truncate">{order.product}</span>
                      {order.itemNames.length > 1 && (
                        <span className="shrink-0 inline-flex items-center bg-purple-100 text-[#532194] text-[9px] font-bold px-1 py-0.5 rounded-full">
                          +{order.itemNames.length - 1}
                        </span>
                      )}
                    </div>
                    <div className="text-right"><span className="text-gray-400">Qty:</span> <span className="text-gray-700 font-medium">{order.qty}</span></div>
                    <div className="text-right col-span-2"><span className="text-gray-400">Date:</span> {formatDate(order.date)}</div>
                    <div className="truncate col-span-2"><span className="text-gray-400">Agent:</span> {order.agent ? `${order.agent.name} (${order.agent.state})` : "—"}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop Table (hidden on small screens) ── */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="pl-10 pr-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">G-Mail</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Name</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Agent</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Product</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-center">Quantity</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-center">Status</th>
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
                    <td className="px-6 py-4 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{order.name}</span>
                        {order.isReorder && (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-[#532194] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <RotateCcw size={10} /> Reorder
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.agent ? (
                        <div>
                          <p className="font-bold text-gray-900">{order.agent.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                            {order.agent.state}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[160px]">{order.product}</span>
                        {order.itemNames.length > 1 && (
                          <span
                            title={order.itemNames.join(", ")}
                            className="shrink-0 inline-flex items-center bg-purple-100 text-[#532194] text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          >
                            +{order.itemNames.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-600">{order.qty}</td>
                    <td className="px-6 py-4 text-center">
                      {style && (
                        <span className={`inline-block px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-500">
                      {formatDate(order.date)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}
