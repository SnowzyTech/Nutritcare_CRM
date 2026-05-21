"use client";

import React, { useState, useRef, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import type { PickPackRow, TransferProductItem } from "@/modules/warehouse/services/warehouse.service";
import { assignPickerAction, type TransferShelfAllocation } from "@/modules/warehouse/actions/pick-pack.action";

type TabFilter = "All" | "QUEUED" | "PACKED";

const statusBg: Record<string, string> = {
  QUEUED: "bg-[#F59E0B] text-white",
  PACKED: "bg-[#059669] text-white",
};
const statusLabel: Record<string, string> = { QUEUED: "Queued", PACKED: "Packed" };

interface Props {
  initialOrders: PickPackRow[];
  pickers: { id: string; name: string; activeTasks: number }[];
  locationCodes: string[];
}

// Per-product shelf selection state for the transfer modal
// productId → locationId → qty (string for controlled input)
type TransferSelections = Record<string, Record<string, string>>;

export default function PickAndPackClient({ initialOrders, pickers, locationCodes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabFilter>("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPickerId, setSelectedPickerId] = useState<string | null>(null);
  const [isPickerDropdownOpen, setIsPickerDropdownOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Regular outgoing: single location code selection
  const [selectedLocation, setSelectedLocation] = useState<string>(locationCodes[0] ?? "");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);

  // Transfer: per-product per-shelf quantity selections
  const [transferSelections, setTransferSelections] = useState<TransferSelections>({});

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

  const filteredOrders = initialOrders.filter((o) => activeTab === "All" || o.status === activeTab);
  const getTabClass = (tab: TabFilter) =>
    activeTab === tab
      ? "bg-[#ad1df4] text-white text-[13px] font-bold px-4 py-1.5 rounded-md shadow-sm"
      : "bg-[#f3f4f6] text-gray-500 text-[13px] font-medium px-4 py-1.5 rounded-md hover:bg-gray-200 transition-colors";

  const handleSelectAll = (checked: boolean) => {
    const queued = filteredOrders.filter((o) => o.status === "QUEUED").map((o) => o.id);
    setSelectedIds(checked ? queued : []);
  };

  const selectedPicker = pickers.find((p) => p.id === selectedPickerId);

  // Determine if current selection is all-transfers or all-regular
  const selectedOrders = useMemo(
    () => initialOrders.filter((o) => selectedIds.includes(o.id)),
    [selectedIds, initialOrders],
  );
  const hasTransfer = selectedOrders.some((o) => o.isTransfer);
  const hasRegular = selectedOrders.some((o) => !o.isTransfer);
  const isMixedSelection = hasTransfer && hasRegular;
  const isTransferMode = hasTransfer && !hasRegular;

  // Aggregate transfer products across all selected PickPacks (transfers and outgoing both populate transferProducts)
  const aggregatedTransferProducts = useMemo<TransferProductItem[]>(() => {
    const map = new Map<string, TransferProductItem>();
    for (const o of selectedOrders) {
      for (const tp of o.transferProducts) {
        const existing = map.get(tp.productId);
        if (existing) {
          map.set(tp.productId, { ...existing, requiredQty: existing.requiredQty + tp.requiredQty });
        } else {
          map.set(tp.productId, { ...tp });
        }
      }
    }
    return Array.from(map.values());
  }, [selectedOrders]);

  // Show shelf-selection UI whenever any selected order has shelf data
  const isShelfMode = aggregatedTransferProducts.length > 0;

  function toggleShelf(productId: string, locationId: string, availableQty: number, checked: boolean) {
    setTransferSelections((prev) => {
      const productShelves = { ...(prev[productId] ?? {}) };
      if (checked) {
        // Default quantity = min(available, still needed) so we never auto-overshoot
        const product = aggregatedTransferProducts.find((p) => p.productId === productId);
        const required = product?.requiredQty ?? 0;
        const alreadySelected = Object.values(productShelves).reduce((s, v) => s + (parseInt(v) || 0), 0);
        const stillNeeded = Math.max(0, required - alreadySelected);
        productShelves[locationId] = String(Math.min(availableQty, stillNeeded));
      } else {
        delete productShelves[locationId];
      }
      return { ...prev, [productId]: productShelves };
    });
  }

  function updateShelfQty(productId: string, locationId: string, value: string) {
    setTransferSelections((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] ?? {}), [locationId]: value },
    }));
  }

  function selectedQtyForProduct(productId: string): number {
    return Object.values(transferSelections[productId] ?? {}).reduce(
      (s, v) => s + (parseInt(v) || 0),
      0,
    );
  }

  function allTransferProductsCovered(): boolean {
    return aggregatedTransferProducts.every(
      (p) => selectedQtyForProduct(p.productId) === p.requiredQty,
    );
  }

  function buildTransferAllocations(): TransferShelfAllocation[] {
    const result: TransferShelfAllocation[] = [];
    for (const [productId, shelves] of Object.entries(transferSelections)) {
      for (const [locationId, qtyStr] of Object.entries(shelves)) {
        const qty = parseInt(qtyStr) || 0;
        if (qty > 0) result.push({ productId, locationId, quantity: qty });
      }
    }
    return result;
  }

  function openModal() {
    if (selectedIds.length === 0) return;
    setActionError(null);
    const initSelections: TransferSelections = {};
    for (const p of aggregatedTransferProducts) {
      initSelections[p.productId] = {};
    }
    setTransferSelections(initSelections);
    setIsAssignModalOpen(true);
  }

  function closeModal() {
    setIsAssignModalOpen(false);
    setSelectedPickerId(null);
    setActionError(null);
    setTransferSelections({});
  }

  const handleAssign = () => {
    if (!selectedPickerId) {
      setActionError("Please select a picker first.");
      return;
    }
    if (isMixedSelection) {
      setActionError("Cannot mix transfer and regular pick tasks. Select only one type.");
      return;
    }
    if (isShelfMode && !allTransferProductsCovered()) {
      setActionError("Selected shelf quantities must exactly match the required quantities — not more, not less.");
      return;
    }

    setActionError(null);
    const allocations = isShelfMode ? buildTransferAllocations() : undefined;

    startTransition(async () => {
      const result = await assignPickerAction(
        selectedIds,
        selectedPickerId,
        selectedLocation,
        allocations,
      );
      if (result.success) {
        closeModal();
        setSelectedIds([]);
        router.refresh();
      } else {
        setActionError(result.error ?? "Failed to assign picker.");
      }
    });
  };

  return (
    <>
      <div className="space-y-6 mt-4 max-w-6xl">
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

        <div className="bg-white overflow-hidden shadow-sm">
          <div className="bg-[#e5e7eb] px-5 py-3 flex items-center justify-between rounded-t-lg">
            <h2 className="text-[13px] font-medium text-gray-600">Pick &amp; Pack Queue</h2>
            <button
              onClick={openModal}
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
                  <th className="px-4 py-4 font-medium">Type</th>
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
                      <td className="px-4 py-4">
                        <span
                          className={`inline-block text-[11px] font-medium rounded px-2 py-0.5 ${
                            order.isTransfer ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {order.isTransfer ? "Transfer" : "Outgoing"}
                        </span>
                      </td>
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
                    <td colSpan={9} className="px-5 py-8 text-center text-gray-500">
                      No dispatched stock movements found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Assign Picker Modal ─────────────────────────────────────────────── */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-[600px] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-black mb-1">Assign Orders</h2>
            <p className="text-gray-600 mb-6 text-[13px]">
              {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""} selected
              {isTransferMode && " — Warehouse Transfer"}
              {!isTransferMode && isShelfMode && " — Outgoing"}
            </p>

            {isMixedSelection && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 text-[13px] text-red-700">
                Cannot mix transfer and regular pick tasks. Please select only one type at a time.
              </div>
            )}

            {/* ── Shelf selection mode: per-product shelf picks (transfers and outgoing) */}
            {isShelfMode && (
              <div className="mb-6">
                <h3 className="text-[15px] font-bold text-black mb-3">Shelf Assignments by Product</h3>
                {aggregatedTransferProducts.map((product) => {
                  const selected = transferSelections[product.productId] ?? {};
                  const totalSelected = selectedQtyForProduct(product.productId);
                  const covered = totalSelected === product.requiredQty;
                  const over = totalSelected > product.requiredQty;

                  return (
                    <div key={product.productId} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
                        <div>
                          <span className="text-[13px] font-semibold text-gray-800">{product.productName}</span>
                          <span className="ml-2 text-[11px] text-gray-500">Required: {product.requiredQty} units</span>
                        </div>
                        <span
                          className={`text-[12px] font-bold ${covered ? "text-emerald-600" : over ? "text-red-500" : "text-gray-500"}`}
                        >
                          {totalSelected} / {product.requiredQty}
                          {covered && " ✓"}
                          {over && " — over limit"}
                        </span>
                      </div>

                      {product.availableShelves.length === 0 ? (
                        <div className="px-4 py-3 text-[12px] text-orange-600 bg-orange-50">
                          No shelves found with this product. Confirm incoming goods to assign products to shelves first.
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {product.availableShelves.map((shelf) => {
                            const isChecked = shelf.locationId in selected;
                            const qtyValue = selected[shelf.locationId] ?? "";

                            return (
                              <div key={shelf.locationId} className="flex items-center gap-3 px-4 py-3">
                                <input
                                  type="checkbox"
                                  id={`shelf-${product.productId}-${shelf.locationId}`}
                                  checked={isChecked}
                                  onChange={(e) =>
                                    toggleShelf(
                                      product.productId,
                                      shelf.locationId,
                                      Math.min(shelf.availableQty, product.requiredQty - totalSelected + (parseInt(qtyValue) || 0)),
                                      e.target.checked,
                                    )
                                  }
                                  className="w-4 h-4 accent-[#ad1df4]"
                                />
                                <label
                                  htmlFor={`shelf-${product.productId}-${shelf.locationId}`}
                                  className="flex-1 flex items-center gap-2 cursor-pointer"
                                >
                                  <span className="text-[13px] font-medium text-gray-800 w-16">
                                    {shelf.locationCode}
                                  </span>
                                  <span className="text-[12px] text-gray-500">
                                    {shelf.availableQty} units available
                                  </span>
                                </label>

                                {isChecked && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-gray-500">Take:</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max={shelf.availableQty}
                                      value={qtyValue}
                                      onChange={(e) =>
                                        updateShelfQty(product.productId, shelf.locationId, e.target.value)
                                      }
                                      className="w-[64px] h-[28px] border border-gray-300 rounded px-2 text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#ad1df4] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Regular outgoing mode: single location code (no shelf data available) */}
            {!isShelfMode && !isMixedSelection && (
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
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

                <div className="border border-gray-300 rounded overflow-y-auto h-24 p-2 text-gray-700 font-mono text-sm leading-relaxed">
                  {selectedIds.map((id) => {
                    const order = initialOrders.find((o) => o.id === id);
                    return <div key={id}>{order?.referenceNumber ?? id}</div>;
                  })}
                </div>
              </div>
            )}

            {/* ── Picker selection ──────────────────────────────────────────── */}
            <h3 className="text-[15px] font-bold text-black mb-3">Assign to Picker</h3>
            <div className="mb-5 relative" ref={pickerDropdownRef}>
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
            </div>

            {actionError && <p className="text-red-500 text-sm mb-4">{actionError}</p>}

            <div className="flex gap-4">
              <button
                onClick={closeModal}
                className="bg-[#a3a3a3] text-white font-bold py-2.5 px-8 rounded-md hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleAssign}
                disabled={
                  isPending ||
                  isMixedSelection ||
                  (isShelfMode && !allTransferProductsCovered())
                }
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
