"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftCircle, Search, Trash2, Printer, MessageCircle } from "lucide-react";
import { transferStockData } from "@/lib/mock-data/transfer-stock";

export default function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { id } = use(params);

  // Look up this specific record by ID
  const record = transferStockData.find((r) => r.id === Number(id));

  const [localStatus, setLocalStatus] = useState(record?.status || "");
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState("");
  const [savedReversalReason, setSavedReversalReason] = useState("");

  const handleConfirmReverse = () => {
    setLocalStatus("REVERSED");
    setSavedReversalReason(reversalReason);
    setIsReverseModalOpen(false);
  };

  // Fallback if somehow not found
  if (!record) {
    return (
      <div className="max-w-[1400px] mx-auto py-20 text-center text-gray-400">
        <p>Record not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-[#9D00FF] underline"
        >
          Go back
        </button>
      </div>
    );
  }

  // Handle dynamic styling for the status badge
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "RECORDED":
        return "bg-green-500 text-white";
      case "DRAFT":
        return "bg-teal-200/60 text-teal-700";
      case "REVERSED":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto relative pb-10">
      {/* Floating Chat Icon */}
      <button className="absolute -top-4 right-0 w-12 h-12 bg-[#F6E8FF] rounded-full flex items-center justify-center text-[#9D00FF] shadow-sm hover:bg-[#ebd5fa] transition-colors z-50">
        <MessageCircle className="w-6 h-6 fill-current" />
      </button>

      {/* Top toolbar */}
      <div className="flex items-center gap-5 mb-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#9D00FF] transition-colors"
        >
          <ArrowLeftCircle className="w-5 h-5" />
          Back
        </button>

        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 text-gray-400 w-[400px]">
            <Search className="w-4 h-4 shrink-0" />
            <input
              type="text"
              placeholder="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm text-gray-600 bg-transparent w-full placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Placeholder to balance the space for centering */}
        <div className="w-[100px]" />
      </div>

      {/* Two-column: title/status left, detail card right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left: Title + status badge */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Transfer</h1>
          <p className="text-sm text-gray-400 mt-0.5 mb-3">Voucher</p>
          <span
            className={`inline-block px-3 py-1 text-[11px] font-bold rounded-sm tracking-widest uppercase ${getBadgeStyle(
              localStatus
            )}`}
          >
            {localStatus}
          </span>
        </div>

        {/* Right: Info card */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 px-6 py-5 space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-700 w-56 shrink-0">ST-ID:</span>
            <span className="text-sm font-medium text-gray-600">{record.transferId}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-700 w-56 shrink-0">Source Warehouse/Agent:</span>
            <span className="text-sm font-medium text-gray-600">{record.sourceWarehouseAgent.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-700 w-56 shrink-0">Target Warehouse/Agent:</span>
            <span className="text-sm font-medium text-gray-600">{record.targetWarehouseAgent.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-700 w-56 shrink-0">Transfer Reference:</span>
            <span className="text-sm font-medium text-gray-600">{record.transferReference}</span>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-sm font-bold text-gray-700 w-56 shrink-0 mt-0.5">Recorded By:</span>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-600 uppercase">{record.addedBy.toUpperCase()}</span>
              <span className="text-sm font-medium text-gray-500">{record.date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-8 shadow-sm">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#3D0066" }}>
              <th className="text-left text-xs font-semibold text-white py-3 px-6">Product</th>
              <th className="text-center text-xs font-semibold text-white py-3 px-6">Product Code</th>
              <th className="text-center text-xs font-semibold text-white py-3 px-6">Unit</th>
              <th className="text-right text-xs font-semibold text-white py-3 px-6">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {record.products.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 bg-white">
                <td className="py-4 px-6 text-xs font-medium text-gray-600">{row.product}</td>
                <td className="py-4 px-6 text-xs text-gray-500 text-center">{row.productCode}</td>
                <td className="py-4 px-6 text-xs text-gray-500 text-center">{row.unit}</td>
                <td className="py-4 px-6 text-xs text-gray-500 text-right">{row.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Area: Reversal Info & Action buttons */}
      <div className="flex items-start justify-between">
        {/* Left: Reversal Details (Only visible if REVERSED) */}
        <div className="max-w-xl">
          {localStatus === "REVERSED" && (
            <div className="space-y-4 pt-2">
              <div className="bg-red-50/50 border border-red-100 rounded-lg px-6 py-5">
                <h3 className="text-sm font-bold text-red-800 mb-2">Reversal Reason:</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {savedReversalReason || "No reason provided."}
                </p>
              </div>

              <div className="flex gap-10 px-2">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Date Reversed
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date().toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Reversed By
                  </p>
                  <p className="text-sm font-medium text-gray-900">Yusuf Adeyemi</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Action buttons */}
        <div className="flex justify-end gap-3 shrink-0 ml-8">
          {/* Dynamic primary action button based on Status */}
          {localStatus === "DRAFT" && (
            <button className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-amber-400 hover:bg-amber-500 transition-colors">
              Edit
            </button>
          )}
          {localStatus === "RECORDED" && (
            <button 
              onClick={() => setIsReverseModalOpen(true)}
              className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-amber-400 hover:bg-amber-500 transition-colors"
            >
              Reverse
            </button>
          )}

          {/* Delete */}
          <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          {/* PDF/Print */}
          <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            <Printer className="w-4 h-4" />
            PDF/Print
          </button>
        </div>
      </div>

      {/* REVERSAL MODAL */}
      {isReverseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-10">
            
            {/* Info Table */}
            <div className="border border-gray-300 rounded-sm overflow-hidden mb-6">
              <div className="grid grid-cols-2 border-b border-gray-300 last:border-b-0 text-[15px]">
                <div className="p-4 text-gray-600 border-r border-gray-300">ST-ID:</div>
                <div className="p-4 text-gray-700">{record.transferId}</div>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-300 last:border-b-0 text-[15px]">
                <div className="p-4 text-gray-600 border-r border-gray-300">Source Warehouse/Agent:</div>
                <div className="p-4 text-gray-700">{record.sourceWarehouseAgent}</div>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-300 last:border-b-0 text-[15px]">
                <div className="p-4 text-gray-600 border-r border-gray-300">Target Warehouse/Agent:</div>
                <div className="p-4 text-gray-700">{record.targetWarehouseAgent}</div>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-300 last:border-b-0 text-[15px]">
                <div className="p-4 text-gray-600 border-r border-gray-300">Date Transferred:</div>
                <div className="p-4 text-gray-700">{record.date}</div>
              </div>
            </div>

            {/* Reversal Reason Textarea */}
            <div className="mb-8">
              <label className="block text-[13px] text-gray-800 mb-2 font-medium">
                <span className="font-semibold">Reversal</span> Reason
              </label>
              <textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="Type in here"
                rows={5}
                className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-700 placeholder:text-gray-200 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 resize-none"
              />
            </div>

            {/* Confirmation Text */}
            <h3 className="text-amber-500 text-lg font-medium mb-6">
              Do you want to reverse Stock ?
            </h3>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setIsReverseModalOpen(false)}
                className="px-8 py-2.5 rounded-md text-[15px] font-bold text-white bg-gray-400 hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleConfirmReverse}
                disabled={!reversalReason.trim()}
                className="px-8 py-2.5 rounded-md text-[15px] font-bold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reverse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
