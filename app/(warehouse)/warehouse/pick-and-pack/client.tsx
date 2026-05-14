"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import type { PickPackRow, PickerOption } from "@/modules/warehouse/services/warehouse.service";
import { assignPickerAction } from "@/modules/warehouse/actions/pick-pack.action";

type TabFilter = "All" | "QUEUED" | "PACKED";

const statusBg: Record<string, string> = {
  QUEUED: "bg-[#F59E0B] text-white",
  PACKED: "bg-[#059669] text-white",
};

const statusLabel: Record<string, string> = {
  QUEUED: "Queued",
  PACKED: "Packed",
};

interface Props {
  initialOrders: PickPackRow[];
  pickers: PickerOption[];
  locationCodes: string[];
}

export default function PickAndPackClient({ initialOrders, pickers, locationCodes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabFilter>("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>(locationCodes[0] ?? "");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [selectedPickerId, setSelectedPickerId] = useState<string | null>(null);
  const [isPickerDropdownOpen, setIsPickerDropdownOpen] = useState(false);
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const pickerDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerDropdownRef.current && !pickerDropdownRef.current.contains(event.target as Node)) {
        setIsPickerDropdownOpen(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOrders = initialOrders.filter((order) => {
    if (activeTab === "All") return true;
    return order.status === activeTab;
  });

  const getTabClass = (tab: TabFilter) =>
    activeTab === tab
      ? "bg-[#ad1df4] text-white text-[13px] font-bold px-4 py-1.5 rounded-md shadow-sm"
      : "bg-[#f3f4f6] text-gray-500 text-[13px] font-medium px-4 py-1.5 rounded-md hover:bg-gray-200 transition-colors";

  const handleSelectAll = (checked: boolean) => {
    // Only allow selecting QUEUED items (PACKED items can't be reassigned)
    const queued = filteredOrders.filter((o) => o.status === "QUEUED").map((o) => o.id);
    setSelectedIds(checked ? queued : []);
  };

  const selectedPicker = pickers.find((p) => p.id === selectedPickerId);

  const handleAssign = () => {
    if (!selectedPickerId) {
      setActionError("Please select a picker first.");
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await assignPickerAction(selectedIds, selectedPickerId, selectedLocation);
      if (result.success) {
        setIsAssignModalOpen(false);
        setSelectedIds([]);
        setSelectedPickerId(null);
        setIsHighPriority(false);
        router.refresh();
      } else {
        setActionError(result.error ?? "Failed to assign picker.");
      }
    });
  };

  return (
    <>
      <div className="space-y-6 mt-4 max-w-6xl">
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {(["All", "QUEUED", "PACKED"] as TabFilter[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={getTabClass(tab)}>
                {tab === "All" ? "All" : statusLabel[tab]}
              </button>
            ))}
          </div>
          <button className="bg-[#f3f4f6] text-gray-500 text-[13px] font-medium px-5 py-1.5 rounded-md hover:bg-gray-200 transition-colors">
            Export
          </button>
        </div>

        {/* Main Table */}
        <div className="bg-white overflow-hidden shadow-sm">
          <div className="bg-[#e5e7eb] px-5 py-3 flex items-center justify-between rounded-t-lg">
            <h2 className="text-[13px] font-medium text-gray-600">Pick &amp; Pack Queue</h2>
            <button
              onClick={() => {
                if (selectedIds.length > 0) {
                  setActionError(null);
                  setIsAssignModalOpen(true);
                }
              }}
              className={`${
                selectedIds.length > 0
                  ? "bg-[#ad1df4] hover:bg-[#9b19dc]"
                  : "bg-[#d1a3e6] cursor-not-allowed opacity-80"
              } text-white text-[13px] font-bold px-6 py-2 rounded-lg transition-colors shadow-sm`}
              disabled={selectedIds.length === 0}
            >
              Assign Picker {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead className="bg-[#faf5ff]">
                <tr className="text-gray-500 text-left font-medium">
                  <th className="px-5 py-4 w-12 font-medium">
                    <Checkbox
                      className="border-gray-300"
                      checked={
                        filteredOrders.filter((o) => o.status === "QUEUED").length > 0 &&
                        selectedIds.length === filteredOrders.filter((o) => o.status === "QUEUED").length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-4 font-medium">Reference</th>
                  <th className="px-4 py-4 font-medium">Dispatch Agent</th>
                  <th className="px-4 py-4 font-medium">Items</th>
                  <th className="px-4 py-4 font-medium">Picker</th>
                  <th className="px-4 py-4 font-medium">BIN Location</th>
                  <th className="px-4 py-4 font-medium">Assigned At</th>
                  <th className="px-4 py-4 font-medium w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white border-t border-white">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-5 py-4">
                        <Checkbox
                          className="border-gray-300"
                          checked={selectedIds.includes(order.id)}
                          disabled={order.status === "PACKED"}
                          onCheckedChange={(checked) => {
                            if (order.status === "PACKED") return;
                            setSelectedIds((prev) =>
                              checked ? [...prev, order.id] : prev.filter((id) => id !== order.id),
                            );
                          }}
                        />
                      </td>
                      <td className="px-4 py-4 text-gray-500">{order.referenceNumber}</td>
                      <td className="px-4 py-4 text-gray-500">{order.dispatchAgent}</td>
                      <td className="px-4 py-4 text-gray-500">{order.itemsCount}</td>
                      <td className="px-4 py-4 text-gray-500">
                        {order.status === "QUEUED" ? "—" : order.picker}
                      </td>
                      <td className="px-4 py-4 text-gray-500">{order.locationCode}</td>
                      <td className="px-4 py-4 text-gray-500">{order.assignedAt ?? "—"}</td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-block text-[12px] font-medium rounded px-3 py-1 ${statusBg[order.status] ?? ""}`}
                        >
                          {statusLabel[order.status] ?? order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                      No dispatched stock movements found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assign Picker Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-[480px] p-8 shadow-2xl relative">
            <h2 className="text-3xl font-bold text-black mb-1">Assign Orders</h2>
            <p className="text-gray-600 mb-8">
              You have selected {selectedIds.length} item
              {selectedIds.length !== 1 ? "s" : ""} for assignment
            </p>

            <h3 className="text-[17px] font-bold text-black mb-4">Selected Items</h3>

            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-500 text-sm">Select pickup bin location</span>
              <div className="relative" ref={locationDropdownRef}>
                <button
                  onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                  className="bg-[#e5e7eb] border border-gray-400 px-4 py-2 rounded text-gray-800 font-medium min-w-[72px] flex items-center justify-between gap-2"
                >
                  {selectedLocation || "—"}
                  <span className="text-[10px]">▼</span>
                </button>
                {isLocationDropdownOpen && (
                  <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 w-28 max-h-40 overflow-y-auto">
                    {locationCodes.length > 0 ? (
                      locationCodes.map((code) => (
                        <button
                          key={code}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setSelectedLocation(code);
                            setIsLocationDropdownOpen(false);
                          }}
                        >
                          {code}
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-2 text-sm text-gray-500">No locations</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border border-gray-300 rounded overflow-y-auto h-28 p-2 mb-8 text-gray-700 font-mono text-sm leading-relaxed">
              {selectedIds.map((id) => {
                const order = initialOrders.find((o) => o.id === id);
                return <div key={id}>{order?.referenceNumber ?? id}</div>;
              })}
            </div>

            <h3 className="text-[17px] font-bold text-black mb-3">Assign to Picker</h3>
            <div className="mb-6 relative" ref={pickerDropdownRef}>
              <button
                onClick={() => setIsPickerDropdownOpen(!isPickerDropdownOpen)}
                className="w-full bg-white border border-[#f3e8ff] p-2.5 text-[#a855f7] text-sm mb-3 rounded-md flex justify-between items-center shadow-sm"
              >
                <span className="flex-1 text-center font-medium">
                  {selectedPicker ? selectedPicker.name : "Select a Picker"}
                </span>
                <span className="bg-[#fdfaff] px-2 py-0.5 rounded shadow-sm text-gray-400">▼</span>
              </button>

              {isPickerDropdownOpen && (
                <div className="absolute top-12 left-0 w-full bg-white border border-gray-200 rounded shadow-xl z-20">
                  {pickers.length > 0 ? (
                    pickers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPickerId(p.id);
                          setIsPickerDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center"
                      >
                        <strong className="text-gray-800">{p.name}</strong>
                        <span className="text-xs text-gray-500">
                          {p.activeTasks} active task{p.activeTasks !== 1 ? "s" : ""}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-gray-500">No warehouse staff found.</p>
                  )}
                </div>
              )}

              {pickers.length > 0 && (
                <div className="text-sm text-gray-600 space-y-1.5 px-1 bg-gray-50/50 p-2 rounded border border-gray-100">
                  {pickers.map((p) => (
                    <div
                      key={p.id}
                      className={`flex gap-2 transition-opacity duration-200 ${selectedPickerId === p.id ? "opacity-100" : "opacity-50"}`}
                    >
                      <strong className="text-gray-800 w-24 truncate">{p.name}</strong>
                      <span className="text-gray-500 text-[13px]">
                        {p.activeTasks} active task{p.activeTasks !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className="flex items-center gap-3 mb-8 cursor-pointer select-none"
              onClick={() => setIsHighPriority(!isHighPriority)}
            >
              <div
                className={`w-5 h-5 rounded-full border-[1.5px] border-[#ad1df4] flex items-center justify-center transition-all ${isHighPriority ? "bg-purple-50" : "bg-white"}`}
              >
                {isHighPriority && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ad1df4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-black text-[15px]">Mark as High Priority</span>
            </div>

            {actionError && <p className="text-red-500 text-sm mb-4">{actionError}</p>}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedPickerId(null);
                  setIsHighPriority(false);
                  setActionError(null);
                }}
                className="bg-[#a3a3a3] text-white font-bold py-2.5 px-8 rounded-md hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleAssign}
                disabled={isPending}
                className="bg-[#ad1df4] text-white font-bold py-2.5 px-8 rounded-md hover:bg-[#9b19dc] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? "Assigning…" : "Assign Picker"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
