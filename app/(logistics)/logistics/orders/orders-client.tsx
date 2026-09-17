"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Filter,
  ChevronDown,
  ArrowUpDown,
  Search,
} from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { formatDate,formatCurrency } from "@/lib/utils";
import { upsellExtraCount } from "@/lib/orders/upsell";
import { Button } from "@/components/ui/button";

type OrderRow = {
  id: string;
  status: OrderStatus;
  date: string;
  customer: { name: string; email: string | null };
  agent: { companyName: string; state: string | null } | null;
    items: { quantity: number; upsellQuantity: number; isUpsell: boolean; product: { name: string } }[];
  deliveryFee: number;
};

type StatusCounts = Partial<Record<OrderStatus, number>>;

const STATUS_STYLES: Record<OrderStatus, { dot: string; badge: string }> = {
  PENDING:   { dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-600 border-amber-200" },
  CONFIRMED: { dot: "bg-green-400",  badge: "bg-green-50 text-green-600 border-green-200" },
  DELIVERED: { dot: "bg-green-600",  badge: "bg-green-600 text-white border-green-600" },
  CANCELLED: { dot: "bg-red-400",    badge: "bg-red-50 text-red-500 border-red-200" },
  FAILED:    { dot: "bg-red-600",    badge: "bg-red-600 text-white border-red-600" },
};

const ALL_TABS: Array<{ label: string; value: OrderStatus | "ALL" }> = [
  { label: "All",       value: "ALL" },
  { label: "Pending",   value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Failed",    value: "FAILED" },
];

const PAGE_SIZE = 15;

export function LogisticsOrdersClient({
  orders,
  statusCounts,
  total,
  page: pageProp,
  initialFilters,
}: {
  orders: OrderRow[];
  statusCounts: StatusCounts;
  total: number;
  page: number;
  initialFilters?: { status: string; search: string };
}) {
  const [activeTab, setActiveTab] = useState<OrderStatus | "ALL">((initialFilters?.status as OrderStatus) || "ALL");
  const [search, setSearch] = useState(initialFilters?.search ?? "");
  const [page, setPage] = useState(pageProp);

  const router = useRouter();
  const pathname = usePathname();
  const totalAll = Object.values(statusCounts).reduce((a, b) => a + (b ?? 0), 0);

  // The server already returns just this page's rows (filtered + paginated).
  const pageRows = orders;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  // Compact window of page numbers around the current page — avoids a huge row of
  // buttons when there are many pages.
  const pageWindow: number[] = [];
  for (let i = Math.max(1, safePage - 2); i <= Math.min(totalPages, safePage + 2); i++) {
    pageWindow.push(i);
  }

  // Sync filters → URL → server (debounced). Local state drives the controls; the
  // URL (read by the server page) drives which rows come back.
  const query = (() => {
    const p = new URLSearchParams();
    if (activeTab !== "ALL") p.set("status", activeTab);
    if (search.trim()) p.set("q", search.trim());
    if (safePage > 1) p.set("page", String(safePage));
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

  function handleTabChange(tab: OrderStatus | "ALL") {
    setActiveTab(tab);
    setPage(1);
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
        <span className="text-sm text-gray-400">{total} orders</span>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex">
        {ALL_TABS.map((tab) => {
          const count = tab.value === "ALL" ? totalAll : (statusCounts[tab.value as OrderStatus] ?? 0);
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                isActive ? "bg-[#faf5ff] text-[#ad1df4]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isActive ? "bg-[#ad1df4] text-white" : "bg-gray-100 text-gray-500"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase">
            <Filter className="w-4 h-4" />
            Filter
          </div>
          <div className="flex items-center gap-2 text-gray-400 font-medium text-xs border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer">
            Date <ChevronDown className="w-4 h-4" />
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowUpDown className="w-4 h-4" />
          </button>

          {/* Legend */}
          <div className="flex items-center gap-2 ml-2">
            {(Object.entries(STATUS_STYLES) as [OrderStatus, { dot: string; badge: string }][]).map(
              ([status, styles]) => (
                <span
                  key={status}
                  className={`px-3 py-1 rounded text-[10px] font-bold border ${styles.badge}`}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </span>
              )
            )}
          </div>
        </div>

        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="search"
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ad1df4]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fa] text-gray-500 uppercase font-bold">
              <tr>
                <th className="px-6 py-5 w-10"></th>
                <th className="px-6 py-5">Email</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Agent</th>
                <th className="px-6 py-5">Product</th>
                <th className="px-6 py-5 text-center">Qty</th>
                <th className="px-6 py-5">Delivery Fee</th>
                <th className="px-6 py-5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                pageRows.map((order) => {
                  const dot = STATUS_STYLES[order.status]?.dot ?? "bg-gray-300";
                  const firstItem = order.items[0];
                  const productName = firstItem ? firstItem.product.name : "—";
                  const extra = upsellExtraCount(order.items);
                  const extraItems = extra > 0 ? ` +${extra}` : "";
                  const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/logistics/orders/${order.id}`)}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className={`w-2.5 h-2.5 rounded-full mx-auto ${dot}`} />
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {order.customer.email ?? "—"}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-700">
                        {order.customer.name}
                      </td>
                      <td className="px-6 py-4">
                        {order.agent ? (
                          <div className="flex flex-col">
                            <span className="text-gray-700 font-medium">{order.agent.companyName}</span>
                            <span className="text-[10px] text-gray-400">{order.agent.state}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {productName}{extraItems}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-center">{totalQty}</td>
                      <td className="px-6 py-4 text-gray-600">{formatCurrency(order.deliveryFee)}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(order.date)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 pb-8">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="h-8 text-xs bg-gray-200 text-gray-500 border-none hover:bg-gray-300 px-4 disabled:opacity-40"
          >
            Previous
          </Button>

          {pageWindow[0] > 1 && (
            <>
              <Button
                onClick={() => setPage(1)}
                className="h-8 w-8 text-xs rounded-md bg-gray-200 text-gray-500 hover:bg-gray-300"
              >
                1
              </Button>
              {pageWindow[0] > 2 && <span className="px-1 text-gray-300">…</span>}
            </>
          )}

          {pageWindow.map((p) => (
            <Button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 text-xs rounded-md ${
                safePage === p
                  ? "bg-[#ad1df4] hover:bg-[#8e14cc] text-white"
                  : "bg-gray-200 text-gray-500 hover:bg-gray-300"
              }`}
            >
              {p}
            </Button>
          ))}

          {pageWindow[pageWindow.length - 1] < totalPages && (
            <>
              {pageWindow[pageWindow.length - 1] < totalPages - 1 && <span className="px-1 text-gray-300">…</span>}
              <Button
                onClick={() => setPage(totalPages)}
                className="h-8 w-8 text-xs rounded-md bg-gray-200 text-gray-500 hover:bg-gray-300"
              >
                {totalPages}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="h-8 text-xs bg-gray-200 text-gray-500 border-none hover:bg-gray-300 px-4 disabled:opacity-40"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
