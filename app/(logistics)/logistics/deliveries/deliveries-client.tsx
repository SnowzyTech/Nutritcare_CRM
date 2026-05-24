"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { DeliveryStatus } from "@prisma/client";
import type { LogisticsDeliveryRow } from "@/modules/delivery/services/logistics-orders.service";
import { updateDeliveryStatusAction } from "@/modules/delivery/actions/logistics-update-status.action";

type Tab = "All" | "Pending" | "In Transit" | "Delivered" | "Failed";

const SOURCE_LABEL: Record<string, string> = {
  stockOut: "Stock Out",
  stockTransfer: "Transfer",
};

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

type EditModalProps = {
  delivery: LogisticsDeliveryRow;
  onClose: () => void;
};

function EditStatusModal({ delivery, onClose }: EditModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleUpdate(finalStatus: "DELIVERED" | "FAILED") {
    setError(null);
    startTransition(async () => {
      const result = await updateDeliveryStatusAction(
        delivery.id,
        delivery.sourceType,
        finalStatus
      );
      if (!result.success) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-8 w-full max-w-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Update Delivery Status</h2>
          <p className="text-xs text-gray-400 mt-1">Ref: <span className="font-semibold text-gray-600">{delivery.orderNumber}</span></p>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <p className="text-sm text-gray-600">Mark this delivery as completed or failed?</p>

        <div className="flex gap-3">
          <Button
            onClick={() => handleUpdate("DELIVERED")}
            disabled={isPending}
            className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold h-10 rounded-md disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Delivered"}
          </Button>
          <Button
            onClick={() => handleUpdate("FAILED")}
            disabled={isPending}
            className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold h-10 rounded-md disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Failed"}
          </Button>
        </div>

        <button
          onClick={onClose}
          disabled={isPending}
          className="w-full text-xs text-gray-400 hover:text-gray-600 font-medium disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function LogisticsDeliveriesClient({ deliveries }: { deliveries: LogisticsDeliveryRow[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingDelivery, setEditingDelivery] = useState<LogisticsDeliveryRow | null>(null);

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
    <>
      {editingDelivery && (
        <EditStatusModal
          delivery={editingDelivery}
          onClose={() => setEditingDelivery(null)}
        />
      )}

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
                  <th className="px-6 py-4 font-bold">Ref ID</th>
                  <th className="px-6 py-4 font-bold">Type</th>
                  <th className="px-6 py-4 font-bold">Warehouse</th>
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
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
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
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          delivery.sourceType === "stockOut"
                            ? "bg-orange-50 text-orange-600"
                            : "bg-teal-50 text-teal-600"
                        }`}>
                          {SOURCE_LABEL[delivery.sourceType]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{delivery.agent}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{delivery.driver}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{delivery.time}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{delivery.address}</td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={delivery.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {delivery.status === "PENDING_DISPATCH" ? (
                          <Button
                            variant="outline"
                            onClick={() => handleAssign(delivery)}
                            className="h-7 text-[10px] font-bold px-6 rounded-md border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                          >
                            Assign
                          </Button>
                        ) : delivery.status === "IN_TRANSIT" ? (
                          <Button
                            variant="outline"
                            onClick={() => setEditingDelivery(delivery)}
                            className="h-7 text-[10px] font-bold px-6 rounded-md border border-[#ad1df4] bg-[#faf5ff] text-[#ad1df4] hover:bg-[#f3e8ff]"
                          >
                            Edit
                          </Button>
                        ) : (
                          <span className="text-gray-300 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
