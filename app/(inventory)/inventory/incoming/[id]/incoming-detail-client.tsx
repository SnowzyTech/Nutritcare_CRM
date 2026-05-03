"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Search, Trash2, Printer } from "lucide-react";
import type { IncomingMovementDetail } from "@/modules/inventory/services/inventory.service";

export function IncomingDetailClient({ record }: { record: IncomingMovementDetail }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState("");
  const [localStatus, setLocalStatus] = useState(record.status);
  const [dateReversed, setDateReversed] = useState("");
  const [savedReversalReason, setSavedReversalReason] = useState("");

  const handleConfirmReverse = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    setDateReversed(`${dd}-${mm}-${yyyy}`);
    setSavedReversalReason(reversalReason);
    setLocalStatus("Reversed");
    setIsReverseModalOpen(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Top toolbar */}
      <div className="flex items-center gap-5 mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#9D00FF] transition-colors"
        >
          <span className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center">
            <RefreshCw className="w-3 h-3" />
          </span>
          Back
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-gray-400">
          <Search className="w-4 h-4 shrink-0" />
          <input
            type="text"
            placeholder="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none text-sm text-gray-600 bg-transparent w-28 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Two-column: title/status left, detail card right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock In</h1>
          <p className="text-sm text-gray-400 mt-0.5 mb-3">Voucher</p>
          <span
            className={`inline-block px-3 py-1 text-xs font-bold text-white rounded-sm tracking-wide ${
              localStatus === "Draft"
                ? "bg-amber-400"
                : localStatus === "Reversed"
                ? "bg-red-500"
                : "bg-amber-500"
            }`}
          >
            {localStatus.toUpperCase()}
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-100 px-6 py-5 space-y-3">
          {[
            { label: "SI-ID:", value: record.siId },
            { label: "Warehouse:", value: record.warehouse.toUpperCase() },
            { label: "Supplier:", value: record.supplier.toUpperCase() },
            { label: "Supplier Reference", value: record.supplierRef },
            { label: "Recorded By:", value: record.recordedBy.toUpperCase() },
            { label: "Date Received:", value: record.dateReceived },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-sm font-bold text-gray-700 w-44 shrink-0">{label}</span>
              <span className="text-sm font-semibold text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Product table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#3D0066" }}>
              <th className="text-left text-xs font-semibold text-white py-3 px-4 w-12">#</th>
              <th className="text-center text-xs font-semibold text-white py-3 px-4">Product</th>
              <th className="text-center text-xs font-semibold text-white py-3 px-4">Product Code</th>
              <th className="text-right text-xs font-semibold text-white py-3 px-4">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {record.products.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-600">{row.id}</td>
                <td className="py-3 px-4 text-sm text-gray-600 text-center">{row.product}</td>
                <td className="py-3 px-4 text-sm text-gray-600 text-center">{row.productCode}</td>
                <td className="py-3 px-4 text-sm text-gray-600 text-right">{row.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-start justify-between">
        <div>
          {localStatus === "Reversed" && (
            <div className="bg-gray-50/80 rounded-xl px-6 py-5 space-y-4 min-w-[380px]">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-600 w-36 shrink-0">Date Reversed:</span>
                <span className="text-sm font-medium text-gray-600">{dateReversed}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-600 w-36 shrink-0">Reversal Reason:</span>
                <span className="text-sm font-medium text-gray-600">{savedReversalReason}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {localStatus !== "Reversed" && (
            <button
              onClick={() => setIsReverseModalOpen(true)}
              className="px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-amber-400 hover:bg-amber-500 transition-colors"
            >
              Reverse
            </button>
          )}
          <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            <Printer className="w-4 h-4" /> PDF/Print
          </button>
        </div>
      </div>

      {/* Reversal Modal */}
      {isReverseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-8">
              <div className="border border-gray-200 rounded-md overflow-hidden mb-6 flex flex-col">
                <div className="flex border-b border-gray-200">
                  <div className="w-1/2 p-3.5 text-sm text-gray-600 border-r border-gray-200">SI-ID:</div>
                  <div className="w-1/2 p-3.5 text-sm text-gray-800">{record.siId}</div>
                </div>
                <div className="flex border-b border-gray-200">
                  <div className="w-1/2 p-3.5 text-sm text-gray-600 border-r border-gray-200">Warehouse:</div>
                  <div className="w-1/2 p-3.5 text-sm text-gray-800">{record.warehouse}</div>
                </div>
                <div className="flex border-b border-gray-200">
                  <div className="w-1/2 p-3.5 text-sm text-gray-600 border-r border-gray-200">Supplier:</div>
                  <div className="w-1/2 p-3.5 text-sm text-gray-800">{record.supplier}</div>
                </div>
                <div className="flex">
                  <div className="w-1/2 p-3.5 text-sm text-gray-600 border-r border-gray-200">Date Received:</div>
                  <div className="w-1/2 p-3.5 text-sm text-gray-800">{record.dateReceived}</div>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Reversal <span className="font-normal text-gray-500">Reason</span>
                </label>
                <textarea
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="Type in here"
                  className="w-full border border-gray-200 rounded-md p-4 text-sm outline-none focus:border-[#9D00FF] resize-none h-36 text-gray-700 placeholder:text-gray-300 transition-colors bg-white"
                />
              </div>
              <p className="text-amber-500 font-semibold mb-6">Do you want to reverse Stock?</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsReverseModalOpen(false)}
                  className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-gray-400 hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleConfirmReverse}
                  className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors"
                >
                  Reverse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
