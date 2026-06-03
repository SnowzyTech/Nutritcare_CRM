"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  LocationBinRow,
  LocationSummaryRow,
  LocationBinDetailMap,
} from "@/modules/warehouse/services/warehouse.service";
import {
  addWarehouseZoneAction,
  removeWarehouseZoneAction,
  updateLocationOccupancyAction,
} from "@/modules/warehouse/actions/location.action";

interface Props {
  initialBins: LocationBinRow[];
  summaryData: LocationSummaryRow[];
  binDetails: LocationBinDetailMap;
}

const statusToDisplay: Record<string, string> = {
  FULL: "Full",
  PARTIAL: "Partial",
  RESERVED: "Reserved",
  EMPTY: "Empty",
  DAMAGE: "Damage",
};

const binColour: Record<string, string> = {
  FULL: "bg-[#059669] text-white",
  PARTIAL: "bg-[#F59E0B] text-white",
  RESERVED: "bg-[#DC2626] text-white",
  EMPTY: "bg-[#ad1df4] text-white",
  DAMAGE: "bg-[#9CA3AF] text-white",
};

const legendItems = [
  { label: "Full", color: "bg-[#059669]" },
  { label: "Partial", color: "bg-[#F59E0B]" },
  { label: "Reserved", color: "bg-[#DC2626]" },
  { label: "Empty", color: "bg-[#ad1df4]" },
  { label: "Damage", color: "bg-[#9CA3AF]" },
];

const COLS = ["1", "2", "3", "4", "5", "6"];

export default function LocationManagementClient({ initialBins, summaryData, binDetails }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add-zone threshold modal state
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [fullThreshold, setFullThreshold] = useState("");
  const [partialThreshold, setPartialThreshold] = useState("");
  const [emptyThreshold, setEmptyThreshold] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const zones = Array.from(new Set(initialBins.map((b) => b.zone))).sort();
  const binMap = new Map(initialBins.map((b) => [b.locationCode, b]));

  const nextZone = (() => {
    const last = zones[zones.length - 1];
    return last ? String.fromCharCode(last.charCodeAt(0) + 1) : "A";
  })();

  const openZoneModal = () => {
    setModalError(null);
    setFullThreshold("");
    setPartialThreshold("");
    setEmptyThreshold("");
    setZoneModalOpen(true);
  };

  const handleCreateZone = () => {
    const full = Number(fullThreshold);
    const partial = Number(partialThreshold);
    const empty = Number(emptyThreshold);

    if ([fullThreshold, partialThreshold, emptyThreshold].some((v) => v.trim() === "")) {
      setModalError("Enter a stock amount for Full, Partial and Empty.");
      return;
    }
    if ([full, partial, empty].some((v) => !Number.isFinite(v) || v < 0)) {
      setModalError("Stock amounts must be non-negative numbers.");
      return;
    }
    if (!(empty < partial && partial < full)) {
      setModalError("Stock amounts must increase: Empty < Partial < Full.");
      return;
    }

    setModalError(null);
    setError(null);
    startTransition(async () => {
      const result = await addWarehouseZoneAction(nextZone, {
        fullThreshold: full,
        partialThreshold: partial,
        emptyThreshold: empty,
      });
      if (result.success) {
        setZoneModalOpen(false);
        router.refresh();
      } else {
        setModalError(result.error ?? "Failed to add zone.");
      }
    });
  };

  const handleRemoveLocation = () => {
    const lastZone = zones[zones.length - 1];
    if (!lastZone) return;
    if (!window.confirm(`Remove zone ${lastZone} and all its bins?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await removeWarehouseZoneAction(lastZone);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Failed to remove zone.");
      }
    });
  };

  const handleOccupancyChange = (locationCode: string, status: string) => {
    startTransition(async () => {
      const result = await updateLocationOccupancyAction(locationCode, status);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update location.");
      }
    });
  };

  const selectedBinData = selectedBin ? binMap.get(selectedBin) : null;
  const selectedBinDetail = selectedBin ? binDetails[selectedBin] : null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 mt-4 max-w-7xl">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#d1d5db] text-gray-500 text-[11px] font-medium px-4 py-2.5 rounded-md flex-1 shadow-sm">
              Shelf / Bin Map
            </div>
            {zones.length > 4 && (
              <button
                onClick={handleRemoveLocation}
                disabled={isPending}
                className="bg-[#DC2626] text-white text-[11px] font-bold px-4 py-2.5 rounded-md hover:bg-red-700 transition-colors shadow-sm disabled:opacity-60"
              >
                − Remove Zone
              </button>
            )}
            <button
              onClick={openZoneModal}
              disabled={isPending}
              className="bg-[#ad1df4] text-white text-[11px] font-bold px-8 py-2.5 rounded-md hover:bg-[#9b19dc] transition-colors shadow-sm disabled:opacity-60"
            >
              {isPending ? "…" : "+ Add Zone"}
            </button>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          {zones.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              No locations configured. Click &ldquo;+ Add Zone&rdquo; to get started.
            </p>
          ) : (
            <>
              <p className="text-[10px] text-gray-500">Click any bin to view content</p>
              <div className="grid grid-cols-6 gap-2.5 mt-2">
                {zones.flatMap((zone) =>
                  COLS.map((col) => {
                    const code = `${zone}${col}`;
                    const bin = binMap.get(code);
                    const colour = bin
                      ? (binColour[bin.occupancyStatus] ?? binColour.EMPTY)
                      : binColour.EMPTY;
                    return (
                      <button
                        key={code}
                        onClick={() => setSelectedBin(code)}
                        className={`${colour} rounded-[4px] flex items-center justify-center font-bold text-lg hover:opacity-90 transition-opacity cursor-pointer aspect-square shadow-sm`}
                        title={bin ? (statusToDisplay[bin.occupancyStatus] ?? "Empty") : "Empty"}
                      >
                        {code}
                      </button>
                    );
                  }),
                )}
              </div>
            </>
          )}

          <div className="flex items-center gap-4 mt-4 pt-1">
            {legendItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium"
              >
                <div className={`w-2.5 h-2.5 rounded-[1px] ${item.color}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="bg-white overflow-hidden shadow-sm rounded-md">
            <div className="bg-[#d1d5db] px-5 py-2.5 rounded-t-md">
              <h2 className="text-[11px] font-medium text-gray-600">Location Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead className="bg-[#faf5ff]">
                  <tr className="text-gray-500 text-left font-medium">
                    <th className="px-5 py-4 w-12 font-medium">
                      <Checkbox className="border-gray-300" />
                    </th>
                    <th className="px-4 py-4 font-medium">BIN</th>
                    <th className="px-4 py-4 font-medium">Product</th>
                    <th className="px-4 py-4 font-medium">QTY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 border-t border-white">
                  {summaryData.length > 0 ? (
                    summaryData.map((row) => (
                      <tr
                        key={row.bin}
                        className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                        onClick={() => setSelectedBin(row.bin)}
                      >
                        <td className="px-5 py-4">
                          <Checkbox className="border-gray-300" />
                        </td>
                        <td className="px-4 py-4 text-gray-500">{row.bin}</td>
                        <td className="px-4 py-4 text-gray-500">{row.product}</td>
                        <td className="px-4 py-4 text-gray-500">{row.qty}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-gray-400">
                        No occupied locations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-10 relative shadow-2xl">
            <button
              onClick={() => setSelectedBin(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
              <div>
                <h2 className="text-[32px] font-medium text-gray-900 mb-1 leading-tight">
                  {selectedBin} Shelf
                </h2>
                <p className="text-[13px] text-gray-400 mb-3">Bin Location</p>
                {selectedBinDetail && (
                  <span
                    className={`inline-block text-white text-[11px] tracking-wide px-3 py-0.5 rounded shadow-sm ${binColour[selectedBinDetail.occupancyStatus] ?? "bg-gray-400"}`}
                  >
                    {statusToDisplay[selectedBinDetail.occupancyStatus] ??
                      selectedBinDetail.occupancyStatus}
                  </span>
                )}
              </div>

              <div className="bg-[#f8f9fa] rounded-xl p-6 w-full md:w-[360px]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-bold text-[15px]">Shelf:</span>
                    <span className="text-gray-700 text-[15px]">{selectedBin}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-bold text-[15px]">Status:</span>
                    <span className="text-gray-700 text-[15px]">
                      {selectedBinDetail
                        ? (statusToDisplay[selectedBinDetail.occupancyStatus] ?? "—")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-bold text-[15px]">Stock Items:</span>
                    <span className="text-gray-700 text-[15px]">
                      {selectedBinDetail?.stockItems.reduce((s, i) => s + i.quantity, 0) ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-bold text-[15px]">Active Orders:</span>
                    <span className="text-gray-700 text-[15px]">
                      {selectedBinDetail?.orders.length ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-bold text-[15px]">Update Status:</span>
                    <select
                      defaultValue={selectedBinData?.occupancyStatus ?? "EMPTY"}
                      onChange={(e) => handleOccupancyChange(selectedBin, e.target.value)}
                      disabled={isPending}
                      className="text-sm border border-gray-300 rounded px-2 py-1 text-gray-700 disabled:opacity-60"
                    >
                      {["FULL", "PARTIAL", "RESERVED", "EMPTY", "DAMAGE"].map((s) => (
                        <option key={s} value={s}>
                          {statusToDisplay[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Shelf stock from incoming goods */}
              <div>
                <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Shelf Stock
                </h3>
                {selectedBinDetail && selectedBinDetail.stockItems.length > 0 ? (
                  <div className="border border-gray-200 shadow-sm rounded-lg p-0.5 bg-white overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-[#059669] text-white">
                        <tr>
                          <th className="px-5 py-3.5 text-left font-normal text-[13px]">#</th>
                          <th className="px-5 py-3.5 text-left font-normal text-[13px]">Product</th>
                          <th className="px-5 py-3.5 text-left font-normal text-[13px]">Code</th>
                          <th className="px-5 py-3.5 text-right font-normal text-[13px]">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedBinDetail.stockItems.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-4 text-gray-400 text-[13px]">{i + 1}</td>
                            <td className="px-5 py-4 text-gray-500 text-[13px]">{item.product}</td>
                            <td className="px-5 py-4 text-gray-400 text-[13px]">{item.productCode}</td>
                            <td className="px-5 py-4 text-gray-700 font-medium text-[13px] text-right">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-gray-100 rounded-lg p-5 text-center text-gray-400 text-sm">
                    No stock assigned to this shelf.
                  </div>
                )}
              </div>

              {/* Active pick & pack orders */}
              <div>
                <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Active Orders
                </h3>
                {selectedBinDetail && selectedBinDetail.orders.length > 0 ? (
                  <div className="border border-gray-200 shadow-sm rounded-lg p-0.5 bg-white overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-[#4a0b79] text-white">
                        <tr>
                          <th className="px-5 py-3.5 text-left font-normal text-[13px]">#</th>
                          <th className="px-5 py-3.5 text-left font-normal text-[13px]">Order</th>
                          <th className="px-5 py-3.5 text-left font-normal text-[13px]">Product</th>
                          <th className="px-5 py-3.5 text-left font-normal text-[13px]">Code</th>
                          <th className="px-5 py-3.5 text-left font-normal text-[13px]">Picker</th>
                          <th className="px-5 py-3.5 text-right font-normal text-[13px]">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedBinDetail.orders.flatMap((order, oi) =>
                          order.items.map((item, ii) => (
                            <tr key={`${oi}-${ii}`} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-5 py-4 text-gray-400 text-[13px]">{oi * 100 + ii + 1}</td>
                              <td className="px-5 py-4 text-gray-500 text-[13px]">{order.orderNumber}</td>
                              <td className="px-5 py-4 text-gray-500 text-[13px]">{item.product}</td>
                              <td className="px-5 py-4 text-gray-400 text-[13px]">{item.productCode}</td>
                              <td className="px-5 py-4 text-gray-500 text-[13px]">{order.picker}</td>
                              <td className="px-5 py-4 text-gray-500 text-[13px] text-right">{item.quantity}</td>
                            </tr>
                          )),
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-gray-100 rounded-lg p-5 text-center text-gray-400 text-sm">
                    No active pick &amp; pack orders at this location.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add-zone thresholds modal — shown before the 6 shelves are created */}
      {zoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 relative shadow-2xl">
            <button
              onClick={() => setZoneModalOpen(false)}
              disabled={isPending}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors disabled:opacity-50"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Add Zone {nextZone}
            </h2>
            <p className="text-[13px] text-gray-500 mb-6">
              Set the stock amounts that define each shelf&rsquo;s status. These apply to
              all 6 shelves in the new zone and drive their colour automatically as stock
              changes.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">
                  Full at (stock ≥)
                </label>
                <input
                  type="number"
                  min="0"
                  value={fullThreshold}
                  onChange={(e) => setFullThreshold(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#ad1df4] focus:ring-1 focus:ring-[#ad1df4]/20"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">
                  Partial at (stock ≥)
                </label>
                <input
                  type="number"
                  min="0"
                  value={partialThreshold}
                  onChange={(e) => setPartialThreshold(e.target.value)}
                  placeholder="e.g. 40"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#ad1df4] focus:ring-1 focus:ring-[#ad1df4]/20"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">
                  Empty at (stock ≤)
                </label>
                <input
                  type="number"
                  min="0"
                  value={emptyThreshold}
                  onChange={(e) => setEmptyThreshold(e.target.value)}
                  placeholder="e.g. 0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#ad1df4] focus:ring-1 focus:ring-[#ad1df4]/20"
                />
              </div>
            </div>

            {modalError && <p className="text-red-500 text-xs mt-4">{modalError}</p>}

            <div className="flex justify-end gap-3 mt-7">
              <button
                onClick={() => setZoneModalOpen(false)}
                disabled={isPending}
                className="px-5 py-2 rounded-md text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateZone}
                disabled={isPending}
                className="px-6 py-2 rounded-md text-sm font-semibold text-white bg-[#ad1df4] hover:bg-[#9b19dc] transition-colors disabled:opacity-60"
              >
                {isPending ? "Creating…" : "Create Zone"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
