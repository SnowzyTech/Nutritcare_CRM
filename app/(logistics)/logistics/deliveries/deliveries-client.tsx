"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { DeliveryStatus } from "@prisma/client";
import type { LogisticsDeliveryRow } from "@/modules/delivery/services/logistics-orders.service";

type Tab = "All" | "Pending" | "In Transit" | "Delivered" | "Failed";

const TAB_STATUS_MAP: Record<Tab, DeliveryStatus | null> = {
  All: null,
  Pending: "PENDING_DISPATCH",
  "In Transit": "IN_TRANSIT",
  Delivered: "DELIVERED",
  Failed: "FAILED",
};

function StatusBadge({ status }: { status: DeliveryStatus }) {
  switch (status) {
    case "PENDING_DISPATCH":
      return <span className="px-6 py-1 rounded-full text-[10px] font-bold bg-[#fdf8e6] text-[#eab308] border border-[#fde68a]">Pending</span>;
    case "IN_TRANSIT":
      return <span className="px-6 py-1 rounded-full text-[10px] font-bold bg-[#faf5ff] text-[#ad1df4] border border-[#f3e8ff]">In Transit</span>;
    case "DELIVERED":
      return <span className="px-6 py-1 rounded-full text-[10px] font-bold bg-[#f0fdf4] text-[#22c55e] border border-[#dcfce7]">Delivered</span>;
    case "FAILED":
      return <span className="px-6 py-1 rounded-full text-[10px] font-bold bg-[#fef2f2] text-[#ef4444] border border-[#fee2e2]">Failed</span>;
  }
}

export function LogisticsDeliveriesClient({ deliveries }: { deliveries: LogisticsDeliveryRow[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const statusFilter = TAB_STATUS_MAP[activeTab];
    let rows = statusFilter ? deliveries.filter((d) => d.status === statusFilter) : deliveries;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (d) =>
          d.orderNumber.toLowerCase().includes(q) ||
          d.agent.toLowerCase().includes(q) ||
          d.driver.toLowerCase().includes(q) ||
          d.address.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [deliveries, activeTab, search]);

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : filtered.map((d) => d.id));
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  function handleAssign(delivery: LogisticsDeliveryRow) {
    const params = new URLSearchParams({ orderId: delivery.orderId, address: delivery.address });
    router.push(`/logistics/dispatch?${params.toString()}`);
  }

  const tabClass = (tab: Tab) =>
    activeTab === tab
      ? tab === "Failed"
        ? "bg-[#e11d48] text-white"
        : "bg-[#ad1df4] text-white"
      : "bg-[#f3f4f6] text-gray-500 hover:bg-gray-200";

  return (
    <div className="space-y-6 pt-2">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, agent, driver…"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#ad1df4]"
          />
        </div>
        <Button variant="outline" className="text-gray-500 border-gray-200 font-medium px-6 h-10">
          Excel
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4">
        {(Object.keys(TAB_STATUS_MAP) as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-1.5 rounded-md text-xs font-bold transition-all ${tabClass(tab)}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf5ff] text-gray-400 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 w-10">
                  <Checkbox
                    className="border-gray-300"
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="px-6 py-4 font-bold">Order ID</th>
                <th className="px-6 py-4 font-bold">Agent</th>
                <th className="px-6 py-4 font-bold">Driver</th>
                <th className="px-6 py-4 font-bold">Time</th>
                <th className="px-6 py-4 font-bold">Address</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    {deliveries.length === 0 ? "No deliveries recorded yet." : "No deliveries match your filter."}
                  </td>
                </tr>
              ) : (
                filtered.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Checkbox
                        className="border-gray-300"
                        checked={selectedIds.includes(delivery.id)}
                        onCheckedChange={() => toggleOne(delivery.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">{delivery.orderNumber}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{delivery.agent}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{delivery.driver}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{delivery.time}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{delivery.address}</td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={delivery.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => handleAssign(delivery)}
                        className="h-7 text-[10px] font-bold px-6 rounded-md border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                      >
                        Assign
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
