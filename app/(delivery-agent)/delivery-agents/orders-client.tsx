"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Settings, Bell, CalendarClock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { upsellExtraCount } from "@/lib/orders/upsell";

type UIStatus = "All" | "Pending" | "Delivered" | "Failed";

interface OrderItem {
  quantity: number;
  upsellQuantity: number;
  isUpsell: boolean;
  product: { name: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  isRescheduled: boolean;
  createdAt: Date;
  deliveryDate: Date | null;
  customer: { name: string; email: string | null; phone: string };
  items: OrderItem[];
}

interface StatusCounts {
  pending: number;
  delivered: number;
  failed: number;
}

interface Props {
  /** The CURRENT page's rows (server-paginated). */
  orders: Order[];
  statusCounts: StatusCounts;
  /** Total orders matching the filters (drives pagination). */
  total: number;
  /** Current 1-based page. */
  page: number;
  /** Filter selections parsed from the URL on the server (seed the controls). */
  initialFilters?: { status: string; search: string };
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

export function OrdersClient({ orders, statusCounts, total, page: pageProp, initialFilters, user }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeFilter, setActiveFilter] = useState<UIStatus>((initialFilters?.status as UIStatus) || "All");
  const [search, setSearch] = useState(initialFilters?.search ?? "");
  const [page, setPage] = useState(pageProp);

  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  // Jump back to page 1 whenever the filter/search changes.
  useEffect(() => { setPage(1); }, [activeFilter, search]);

  // Sync filters → URL → server (debounced). Local state drives the controls; the
  // URL (read by the server page) drives which rows come back, so filtering +
  // pagination happen in the database.
  const query = (() => {
    const p = new URLSearchParams();
    if (activeFilter !== "All") p.set("status", activeFilter);
    if (search.trim()) p.set("q", search.trim());
    if (currentPage > 1) p.set("page", String(currentPage));
    return p.toString();
  })();
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    const handle = setTimeout(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(handle);
  }, [query, pathname, router]);

  const avatarUrl = user?.name
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f3e8ff&color=ad1df4`
    : "https://ui-avatars.com/api/?name=Agent&background=f3e8ff&color=ad1df4";

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
        <FilterTab label={`All (${total})`} active={activeFilter === "All"} onClick={() => setActiveFilter("All")} color="purple" />
        <FilterTab label={`Pending (${statusCounts.pending})`} active={activeFilter === "Pending"} onClick={() => setActiveFilter("Pending")} color="yellow" />
        <FilterTab label={`Delivered (${statusCounts.delivered})`} active={activeFilter === "Delivered"} onClick={() => setActiveFilter("Delivered")} color="green" />
        <FilterTab label={`Failed (${statusCounts.failed})`} active={activeFilter === "Failed"} onClick={() => setActiveFilter("Failed")} color="red" />
      </div>

      {/* Orders List */}
      <div className="space-y-6 pt-2">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">No orders found</p>
        ) : (
          orders.map((order) => (
            <Link key={order.id} href={`/delivery-agents/${order.id}`}>
              <div className="flex items-start justify-between mb-6 active:scale-[0.98] transition-transform">
                <div className="space-y-1">
                  <h3 className="font-bold text-[#1e1e2d] text-base leading-none">{order.customer.name}</h3>
                  <p className="text-xs text-gray-400 font-medium">{order.customer.email ?? order.customer.phone}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right space-y-1">
                    <h4 className="font-bold text-[#1e1e2d] text-xs leading-none flex items-center justify-end gap-1.5">
                      <span>{summariseItems(order.items)}</span>
                      {upsellExtraCount(order.items) > 0 && (
                        <span className="shrink-0 inline-flex items-center bg-purple-100 text-[#532194] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          +{upsellExtraCount(order.items)}
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-medium">{formatDate(order.createdAt)}</p>
                    {order.deliveryDate && (
                      <p className="text-[10px] text-[#ad1df4] font-semibold">
                        {mapToUIStatus(order.status) === "Delivered" ? "Delivered" : "Delivery"}: {formatDate(order.deliveryDate)}
                      </p>
                    )}
                    {order.isRescheduled && (order.status === "PENDING" || order.status === "CONFIRMED") && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        <CalendarClock size={9} /> Rescheduled
                      </span>
                    )}
                  </div>
                  <div className="pt-1">{getStatusIcon(mapToUIStatus(order.status))}</div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pb-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-xs font-semibold text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
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
