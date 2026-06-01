"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
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
  "Abia State",
  "Adamawa State",
  "Akwa Ibom State",
  "Anambra State",
  "Bauchi State",
  "Bayelsa State",
  "Benue State",
  "Borno State",
  "Cross River State",
  "Delta State",
  "Ebonyi State",
  "Edo State",
  "Ekiti State",
  "Enugu State",
  "Gombe State",
  "Imo State",
  "Jigawa State",
  "Kaduna State",
  "Kano State",
  "Katsina State",
  "Kebbi State",
  "Kogi State",
  "Kwara State",
  "Lagos State",
  "Nasarawa State",
  "Niger State",
  "Ogun State",
  "Ondo State",
  "Osun State",
  "Oyo State",
  "Plateau State",
  "Rivers State",
  "Sokoto State",
  "Taraba State",
  "Yobe State",
  "Zamfara State",
  "Federal Capital Territory (FCT)",
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
          o.salesRep.name.toLowerCase().includes(q),
      );
    }

    if (selectedProduct && selectedProduct !== "__all__") {
      result = result.filter((o) =>
        o.items.some((i) => i.product.name === selectedProduct),
      );
    }

    if (selectedState && selectedState !== "__all__") {
      result = result.filter(
        (o) => o.customer.state.toLowerCase() === selectedState.toLowerCase(),
      );
    }

    if (selectedDate) {
      result = result.filter((o) => {
        const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
        return orderDate === selectedDate;
      });
    }

    return result;
  }, [
    orders,
    activeTab,
    searchQuery,
    selectedProduct,
    selectedState,
    selectedDate,
  ]);

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
      <div className="bg-white rounded-xl p-2 flex items-center justify-center gap-6 sm:gap-10 mb-6 shadow-sm border border-gray-100">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.countKey];
          return (
            <button
              key={tab.key ?? "all"}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1 whitespace-nowrap px-4 sm:px-6 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-purple-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <span
                className={`text-sm sm:text-base font-bold ${
                  isActive
                    ? "text-purple-700"
                    : "text-gray-500"
                }`}
              >
                {tab.label}
              </span>
              {isActive ? (
                <span className="bg-purple-200 text-purple-700 text-xs font-bold px-1.5 py-0.5 rounded">
                  {count}
                </span>
              ) : (
                <span className="text-gray-400 text-sm font-medium">
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-gray-400 font-medium text-sm mr-2">
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
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold shadow-sm pointer-events-none"
          >
            {selectedDate || "Date"} <ChevronDown size={14} />
          </button>
        </div>

        {/* Product dropdown */}
        <Select
          value={selectedProduct}
          onValueChange={(v) => setSelectedProduct(v ?? "__all__")}
        >
          <SelectTrigger className="w-[130px] h-[36px] bg-gray-900 text-white border-0 rounded-lg text-xs font-semibold shadow-sm px-3 [&>span]:text-white">
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
        <Select
          value={selectedState}
          onValueChange={(v) => setSelectedState(v ?? "__all__")}
        >
          <SelectTrigger className="w-[110px] h-[36px] bg-gray-900 text-white border-0 rounded-lg text-xs font-semibold shadow-sm px-3 [&>span]:text-white">
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

        {/* Team dropdown placeholder */}
        <Select
          value="__all__"
          onValueChange={() => {}}
        >
          <SelectTrigger className="w-[110px] h-[36px] bg-gray-900 text-white border-0 rounded-lg text-xs font-semibold shadow-sm px-3 [&>span]:text-white">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Teams</SelectItem>
          </SelectContent>
        </Select>

        <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-all">
          <ArrowUpDown size={16} />
        </button>

        <div className="flex gap-2 mx-4">
          <span className="bg-[#FFD54F] text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-md">
            Pending
          </span>
          <span className="bg-[#81C784] text-white text-xs font-semibold px-3 py-1.5 rounded-md">
            Confirmed
          </span>
          <span className="bg-[#00C853] text-white text-xs font-semibold px-3 py-1.5 rounded-md">
            Delivered
          </span>
          <span className="bg-[#E57373] text-white text-xs font-semibold px-3 py-1.5 rounded-md">
            Cancelled
          </span>
          <span className="bg-[#D32F2F] text-white text-xs font-semibold px-3 py-1.5 rounded-md">
            Failed
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white min-w-[200px]">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-none outline-none text-sm text-gray-600 bg-transparent w-full placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-50/50 rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_1.2fr_0.8fr_1fr] px-6 sm:px-8 py-4 border-b border-gray-100 bg-gray-50">
          {[
            "G-Mail",
            "Name",
            "Agent",
            "State",
            "Sales Rep",
            "Product",
            "Quantity",
            "Date",
          ].map((h, i) => (
            <span
              key={i}
              className="text-xs font-bold text-gray-500 uppercase tracking-wider"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm bg-white">
            No orders found.
          </div>
        ) : (
          <div>
            {filteredOrders.map((order, index) => {
              const firstItem = order.items[0];
              const totalQty = order.items.reduce(
                (sum, i) => sum + i.quantity,
                0,
              );
              const isEvenRow = index % 2 === 0;
              return (
                <Link
                  href={`/admin/orders/${order.id}`}
                  key={order.id}
                  className={`grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_1.2fr_0.8fr_1fr] px-6 sm:px-8 py-4 items-center border-b border-gray-50 last:border-0 transition-colors ${
                    isEvenRow ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100/50`}
                >
                  {/* G-Mail + Status Dot */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[order.status]}`}
                    />
                    <span className="text-sm text-gray-500 truncate max-w-[180px]">
                      {order.customer.email ?? "—"}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="leading-tight">
                    <p className="text-sm font-medium text-gray-700">
                      {order.customer.name}
                    </p>
                  </div>

                  {/* Agent */}
                  <div className="leading-tight">
                    <p className="text-sm font-medium text-gray-700">
                      {order.agent?.companyName ?? "—"}
                    </p>
                    {order.agent?.state && (
                      <p className="text-[10px] text-gray-400 font-medium">
                        {order.agent.state}
                      </p>
                    )}
                  </div>

                  {/* State */}
                  <div className="leading-tight">
                    <p className="text-sm text-gray-600">
                      {order.customer.state}
                    </p>
                  </div>

                  {/* Sales Rep */}
                  <span className="text-sm text-gray-600">
                    {order.salesRep.name}
                  </span>

                  {/* Product */}
                  <span className="text-sm font-medium text-gray-700">
                    {firstItem?.product.name ?? "—"}
                  </span>

                  {/* Quantity */}
                  <span className="text-sm text-gray-500 text-center">
                    {totalQty}
                  </span>

                  {/* Date */}
                  <span className="text-sm text-gray-500">
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
