"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Settings, Bell } from "lucide-react";
import { formatDate } from "@/lib/utils";

type UIStatus = "All" | "Pending" | "Delivered" | "Failed";

interface OrderItem {
  quantity: number;
  product: { name: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: Date;
  customer: { name: string; email: string | null; phone: string };
  items: OrderItem[];
}

interface StatusCounts {
  pending: number;
  delivered: number;
  failed: number;
}

interface Props {
  orders: Order[];
  statusCounts: StatusCounts;
  user: { name?: string | null; image?: string | null } | undefined;
}

function mapToUIStatus(dbStatus: string): string {
  switch (dbStatus) {
    case "DELIVERED": return "Delivered";
    case "FAILED":
    case "CANCELLED": return "Failed";
    case "PENDING":
    case "CONFIRMED": return "Pending";
    default: return "Pending";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Delivered":
      return <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />;
    case "Pending":
      return <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />;
    case "Failed":
      return <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />;
    default:
      return null;
  }
}

function summariseItems(items: OrderItem[]): string {
  if (items.length === 0) return "No items";
  if (items.length === 1) return `${items[0].quantity} ${items[0].product.name}`;
  const total = items.reduce((s, i) => s + i.quantity, 0);
  return `${total} items (${items.map(i => i.product.name).join(", ")})`;
}

export function OrdersClient({ orders, statusCounts, user }: Props) {
  const [activeFilter, setActiveFilter] = useState<UIStatus>("All");
  const [search, setSearch] = useState("");

  const avatarUrl = user?.name
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f3e8ff&color=ad1df4`
    : "https://ui-avatars.com/api/?name=Agent&background=f3e8ff&color=ad1df4";

  const filtered = orders.filter((order) => {
    const uiStatus = mapToUIStatus(order.status);
    const matchesFilter = activeFilter === "All" || uiStatus === activeFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      order.customer.name.toLowerCase().includes(q) ||
      (order.customer.email ?? "").toLowerCase().includes(q) ||
      order.orderNumber.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Mobile Top Header */}
      <div className="flex items-center justify-between lg:hidden">
        <img src="/nuycle-logo.png" alt="Nuycle Logo" className="h-8 w-auto object-contain" />
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full border border-gray-100 bg-white text-gray-500 shadow-sm">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full border border-gray-100 bg-white text-gray-500 shadow-sm relative">
            <Bell className="w-5 h-5" />
            {statusCounts.pending > 0 && (
              <span className="absolute top-2.5 right-3 w-1.5 h-1.5 bg-[#ad1df4] rounded-full" />
            )}
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ml-1">
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or order number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border-none shadow-sm focus:outline-none text-sm placeholder:text-gray-400"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <FilterTab label={`All (${orders.length})`} active={activeFilter === "All"} onClick={() => setActiveFilter("All")} color="purple" />
        <FilterTab label={`Pending (${statusCounts.pending})`} active={activeFilter === "Pending"} onClick={() => setActiveFilter("Pending")} color="yellow" />
        <FilterTab label={`Delivered (${statusCounts.delivered})`} active={activeFilter === "Delivered"} onClick={() => setActiveFilter("Delivered")} color="green" />
        <FilterTab label={`Failed (${statusCounts.failed})`} active={activeFilter === "Failed"} onClick={() => setActiveFilter("Failed")} color="red" />
      </div>

      {/* Orders List */}
      <div className="space-y-6 pt-2">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">No orders found</p>
        ) : (
          filtered.map((order) => (
            <Link key={order.id} href={`/delivery-agents/${order.id}`}>
              <div className="flex items-start justify-between mb-6 active:scale-[0.98] transition-transform">
                <div className="space-y-1">
                  <h3 className="font-bold text-[#1e1e2d] text-base leading-none">{order.customer.name}</h3>
                  <p className="text-xs text-gray-400 font-medium">{order.customer.email ?? order.customer.phone}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right space-y-1">
                    <h4 className="font-bold text-[#1e1e2d] text-xs leading-none">{summariseItems(order.items)}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="pt-1">{getStatusIcon(mapToUIStatus(order.status))}</div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function FilterTab({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: "purple" | "yellow" | "green" | "red";
}) {
  const getDot = () => {
    switch (color) {
      case "yellow": return <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />;
      case "green": return <div className="w-2 h-2 rounded-full bg-[#22c55e]" />;
      case "red": return <div className="w-2 h-2 rounded-full bg-[#ef4444]" />;
      default: return null;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
        active
          ? "bg-[#ad1df4] text-white border-[#ad1df4]"
          : "bg-[#f1f2f4] text-gray-400 border-transparent hover:bg-gray-200"
      }`}
    >
      {label}
      {getDot()}
    </button>
  );
}
