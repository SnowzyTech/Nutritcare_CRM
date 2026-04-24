"use client";

import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderStatus } from "@prisma/client";

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  customer: { name: string; email: string | null; state: string };
  agent: { companyName: string; state: string | null } | null;
  items: Array<{ quantity: number; product: { name: string } }>;
  salesRep: { name: string };
};

export type AdminOrderCounts = {
  all: number;
  pending: number;
  confirmed: number;
  delivered: number;
  cancelled: number;
  failed: number;
};

interface AdminOrdersClientProps {
  orders: AdminOrderListItem[];
  counts: AdminOrderCounts;
  products: Array<{ id: string; name: string }>;
}

const STATUS_DOT: Record<OrderStatus, string> = {
  PENDING: "bg-amber-400",
  CONFIRMED: "bg-emerald-400",
  DELIVERED: "bg-emerald-600",
  CANCELLED: "bg-orange-300",
  FAILED: "bg-red-500",
};

const TABS: Array<{
  label: string;
  key: OrderStatus | null;
  countKey: keyof AdminOrderCounts;
}> = [
  { label: "All", key: null, countKey: "all" },
  { label: "Pending", key: "PENDING", countKey: "pending" },
  { label: "Confirmed", key: "CONFIRMED", countKey: "confirmed" },
  { label: "Delivered", key: "DELIVERED", countKey: "delivered" },
  { label: "Cancelled", key: "CANCELLED", countKey: "cancelled" },
  { label: "Failed", key: "FAILED", countKey: "failed" },
];

export function AdminOrdersClient({
  orders,
  counts,
  products,
}: AdminOrdersClientProps) {
  const [activeTab, setActiveTab] = useState<OrderStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("__all__");
  const [selectedState, setSelectedState] = useState("__all__");
  const [selectedDate, setSelectedDate] = useState("");

  const filteredOrders = useMemo(() => {
    let result = activeTab
      ? orders.filter((o) => o.status === activeTab)
      : orders;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.customer.name.toLowerCase().includes(q) ||
          (o.customer.email ?? "").toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.salesRep.name.toLowerCase().includes(q)
      );
    }

    if (selectedProduct && selectedProduct !== "__all__") {
      result = result.filter((o) =>
        o.items.some((i) => i.product.name === selectedProduct)
      );
    }

    if (selectedState && selectedState !== "__all__") {
      result = result.filter(
        (o) => o.customer.state.toLowerCase() === selectedState.toLowerCase()
      );
    }

    if (selectedDate) {
      result = result.filter((o) => {
        const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
        return orderDate === selectedDate;
      });
    }

    return result;
  }, [orders, activeTab, searchQuery, selectedProduct, selectedState, selectedDate]);

  function formatDate(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    if (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    ) {
      return "Today";
    }
    return d.toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="max-w-[1400px] mx-auto font-inter text-slate-900 pb-20">
      {/* Status Tabs */}
      <div className="bg-white rounded-xl p-3 flex gap-10 items-center shadow-sm border border-slate-50 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.countKey];
          return (
            <button
              key={tab.key ?? "all"}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <span
                className={`text-[0.9rem] font-black ${
                  isActive ? "text-purple-700" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="bg-purple-100 text-purple-600 text-[0.7rem] font-black px-2 py-0.5 rounded-[4px]">
                  {count}
                </span>
              )}
              {!isActive && count > 0 && tab.key !== null && (
                <span className="text-slate-400 text-[0.75rem] font-semibold">
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm mr-2">
          <SlidersHorizontal size={16} />
          Filter
        </div>

        {/* Date Filter */}
        <div className="relative">
          <input
            type="date"
            id="order-date-picker"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
          />
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 border border-black rounded-lg bg-white text-[0.75rem] font-black shadow-sm pointer-events-none"
          >
            {selectedDate || "Date"} <ChevronDown size={14} />
          </button>
        </div>

        {/* Product dropdown */}
        <Select value={selectedProduct} onValueChange={(v) => setSelectedProduct(v ?? "__all__")}>
          <SelectTrigger className="w-[130px] h-[32px] border-black rounded-lg bg-white text-[0.75rem] font-black shadow-sm px-2">
            <SelectValue placeholder="Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Products</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* State dropdown */}
        <Select value={selectedState} onValueChange={(v) => setSelectedState(v ?? "__all__")}>
          <SelectTrigger className="w-[110px] h-[32px] border-black rounded-lg bg-white text-[0.75rem] font-black shadow-sm px-2">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="__all__">All States</SelectItem>
            {nigerianStates.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedDate || selectedProduct !== "__all__" || selectedState !== "__all__" ? (
          <button
            onClick={() => {
              setSelectedDate("");
              setSelectedProduct("__all__");
              setSelectedState("__all__");
            }}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-[0.75rem] font-black text-slate-500 shadow-sm hover:bg-slate-50 transition-colors"
          >
            Clear filters
          </button>
        ) : null}

        <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-400 hover:bg-slate-50 transition-all">
          <ArrowUpDown size={16} />
        </button>

        <div className="flex gap-2 mx-4">
          <span className="bg-amber-100 text-amber-700 text-[0.65rem] font-black px-3 py-1 rounded-md uppercase">
            Pending
          </span>
          <span className="bg-emerald-50 text-emerald-600 text-[0.65rem] font-black px-3 py-1 rounded-md uppercase">
            Confirmed
          </span>
          <span className="bg-emerald-500 text-white text-[0.65rem] font-black px-3 py-1 rounded-md uppercase">
            Delivered
          </span>
          <span className="bg-rose-100 text-rose-500 text-[0.65rem] font-black px-3 py-1 rounded-md uppercase">
            Cancelled
          </span>
          <span className="bg-rose-600 text-white text-[0.65rem] font-black px-3 py-1 rounded-md uppercase">
            Failed
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-white min-w-[240px] shadow-sm">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-none outline-none text-[0.8rem] text-slate-700 bg-transparent w-full placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.8fr_1fr] px-8 py-5 border-b border-slate-100 bg-slate-50/20">
          {["G-Mail", "Name", "Agent", "State", "Sales Rep", "Product", "Qty", "Date"].map(
            (h, i) => (
              <span
                key={i}
                className="text-[0.75rem] font-black text-slate-500 uppercase tracking-tight"
              >
                {h}
              </span>
            )
          )}
        </div>

        {/* Rows */}
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            No orders found.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredOrders.map((order) => {
              const firstItem = order.items[0];
              const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
              return (
                <Link
                  href={`/admin/orders/${order.id}`}
                  key={order.id}
                  className="grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.8fr_1fr] px-8 py-4 items-center hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  {/* G-Mail + Status Dot */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[order.status]} shadow-sm`}
                    />
                    <span className="text-[0.85rem] font-medium text-slate-500 truncate max-w-[200px]">
                      {order.customer.email ?? "—"}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="leading-tight">
                    <p className="text-[0.85rem] font-bold text-slate-700">
                      {order.customer.name.split(" ")[0]}
                    </p>
                    <p className="text-[0.85rem] font-bold text-slate-700">
                      {order.customer.name.split(" ").slice(1).join(" ")}
                    </p>
                  </div>

                  {/* Agent */}
                  <div className="leading-tight">
                    <p className="text-[0.85rem] font-bold text-slate-700">
                      {order.agent?.companyName ?? "—"}
                    </p>
                    <p className="text-[0.65rem] text-slate-400 font-bold uppercase">
                      {order.agent?.state ?? ""}
                    </p>
                  </div>

                  {/* State */}
                  <div className="leading-tight">
                    <p className="text-[0.85rem] font-bold text-slate-700">
                      {order.customer.state}
                    </p>
                  </div>

                  {/* Sales Rep */}
                  <span className="text-[0.85rem] font-medium text-slate-600">
                    {order.salesRep.name}
                  </span>

                  {/* Product */}
                  <span className="text-[0.85rem] font-medium text-slate-600">
                    {firstItem?.product.name ?? "—"}
                  </span>

                  {/* Quantity */}
                  <span className="text-[0.85rem] font-bold text-slate-700 pl-4">
                    {totalQty}
                  </span>

                  {/* Date */}
                  <span className="text-[0.85rem] font-medium text-slate-500">
                    {formatDate(order.createdAt)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
