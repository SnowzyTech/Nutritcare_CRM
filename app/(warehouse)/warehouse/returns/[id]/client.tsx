"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { ReturnItem } from "@/lib/mock-data/warehouse";
import { ArrowLeft, Search, Trash2, Printer, X } from "lucide-react";
import { format } from "date-fns";

interface Props {
  item: ReturnItem;
}

// Mock product line items for the detail view
const mockProductDetails = [
  { product: "Shred Belly", productCode: "1252385252", unit: 150, quantity: 200 },
];

export default function ReturnDetailClient({ item }: Props) {
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reversalReason, setReversalReason] = useState("");
  const [isReversed, setIsReversed] = useState(false);
  const [reversalInfo, setReversalInfo] = useState<{
    dateReversed: string;
    reversedBy: string;
    reason: string;
  } | null>(null);

  const rsId = `RS-${item.id.padStart(6, "0")}`;
  const currentStatus = isReversed ? "Reversed" : "Recorded";

  const statusColor =
    currentStatus === "Recorded"
      ? "bg-[#059669] text-white"
      : "bg-[#F59E0B] text-white";

  const handleReverse = () => {
    if (!reversalReason.trim()) return;
    const now = new Date();
    setReversalInfo({
      dateReversed: format(now, "dd-MM-yyyy"),
      reversedBy: "Yusuf",
      reason: reversalReason,
    });
    setIsReversed(true);
    setReversalReason("");
    setShowReverseModal(false);
  };

  return (
    <>
      <div className="bg-[#FAFAFA] min-h-screen">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
          <Link
            href="/warehouse/returns"
            className="flex items-center gap-2 text-gray-600 text-[14px] font-medium hover:text-gray-900 transition-colors"
          >
            <div className="w-[22px] h-[22px] rounded-full border-2 border-gray-600 flex items-center justify-center">
              <ArrowLeft className="w-3 h-3 stroke-[3]" />
            </div>
            Back
          </Link>

          <div className="relative w-[400px]">
            <Search className="w-[16px] h-[16px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="search"
              className="w-full bg-gray-50 border-none rounded-lg py-2.5 pl-10 pr-4 text-[14px] text-gray-500 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#9747FF]"
            />
          </div>
        </div>

        <div className="px-8 py-8">
          <div className="flex gap-12 items-start">
            {/* Left — Title & Status */}
            <div className="flex-shrink-0">
              <h1 className="text-[22px] font-semibold text-gray-800">Stock In</h1>
              <p className="text-[13px] text-gray-400 mt-0.5">Voucher</p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-wide ${statusColor}`}
              >
                {currentStatus}
              </span>
            </div>

            {/* Right — Detail Fields */}
            <div className="flex-1 flex justify-end">
              <div className="w-full max-w-[480px] bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-[13px]">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium w-[180px]">RS-ID:</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{rsId}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium">Agent/Warehouse:</td>
                      <td className="px-5 py-3 text-gray-800 font-medium uppercase">{item.agentWarehouse}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium">Quantity Returned</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{item.qtyReturned}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium">Status</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{item.damaged === "Yes" ? "Damaged" : "Good"}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium">Recorded By:</td>
                      <td className="px-5 py-3 text-gray-800 font-medium uppercase">{item.addedBy}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-gray-500 font-medium">Date:</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{item.date}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Product Table */}
          <div className="mt-10 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-[#4A0E78] text-white">
                  <th className="px-4 py-2.5 text-[11px] font-medium text-left">Product</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-left">Product Code</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-right">Unit</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-right w-28">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {mockProductDetails.map((p, index) => (
                  <tr key={index} className="border-b border-gray-100 bg-white">
                    <td className="px-4 py-3 text-[12px] text-gray-600">{p.product}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-500">{p.productCode}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-600 text-right">{p.unit}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-600 text-right">{p.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Note */}
          <div className="mt-8">
            <h3 className="text-[13px] font-semibold text-gray-700 mb-2">Note</h3>
            <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 min-h-[60px]">
              <p className="text-[13px] text-gray-500">{item.remarks || "—"}</p>
            </div>
          </div>

          {/* Reversal Info (shown after reversing) */}
          {isReversed && reversalInfo && (
            <div className="mt-8 flex items-end justify-between">
              <div className="space-y-2">
                <div className="flex gap-6">
                  <span className="text-[13px] font-semibold text-gray-700 w-[160px]">Date Reversed:</span>
                  <span className="text-[13px] text-gray-600">{reversalInfo.dateReversed}</span>
                </div>
                <div className="flex gap-6">
                  <span className="text-[13px] font-semibold text-gray-700 w-[160px]">Reversed By:</span>
                  <span className="text-[13px] text-gray-600">{reversalInfo.reversedBy}</span>
                </div>
                <div className="flex gap-6">
                  <span className="text-[13px] font-semibold text-gray-700 w-[160px]">Reversal Reason:</span>
                  <span className="text-[13px] text-gray-600">{reversalInfo.reason}</span>
                </div>
              </div>

              <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-[13px] font-medium px-5 h-[38px] rounded-md transition-colors">
                <Printer className="w-4 h-4" />
                PDF/Print
              </button>
            </div>
          )}

          {/* Action Buttons (shown when NOT reversed) */}
          {!isReversed && (
            <div className="flex items-center justify-end gap-3 mt-10">
              <button
                onClick={() => setShowReverseModal(true)}
                className="bg-[#F59E0B] hover:bg-[#D97706] text-white text-[13px] font-medium px-6 h-[38px] rounded-md transition-colors"
              >
                Reverse
              </button>
              <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-[13px] font-medium px-5 h-[38px] rounded-md transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-[13px] font-medium px-5 h-[38px] rounded-md transition-colors">
                <Printer className="w-4 h-4" />
                PDF/Print
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Reverse Modal ────────────────────────────────────── */}
      {showReverseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowReverseModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[520px] mx-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Close */}
            <button
              onClick={() => setShowReverseModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 pt-8">
              {/* Order Details Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-[13px]">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium w-[160px]">RS-ID:</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{rsId}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium">Agent/Warehouse</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{item.agentWarehouse}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium">Product</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{item.productName}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium">Quantity Returned</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{item.qtyReturned}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-gray-500 font-medium">Date</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{item.date}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Product Table in Modal */}
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-gray-500 font-medium">Product</th>
                      <th className="px-4 py-2 text-right text-gray-500 font-medium w-24">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockProductDetails.map((p, index) => (
                      <tr key={index} className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-gray-600">{p.product}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-right">{p.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reversal Reason */}
              <div className="mt-6">
                <label className="text-[13px] font-medium text-gray-700 block mb-2">
                  <span className="text-gray-800">Reversal</span>{" "}
                  <span className="text-gray-400">Reason</span>
                </label>
                <textarea
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="Type in here"
                  className="w-full h-[100px] border border-gray-200 rounded-md px-4 py-3 text-[13px] text-gray-600 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] resize-none"
                />
              </div>

              {/* Confirmation Text */}
              <p className="mt-5 text-[14px] text-[#F59E0B] font-medium">
                Do you want to reverse Stock ?
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-5 pb-2">
                <button
                  onClick={() => setShowReverseModal(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white text-[13px] font-medium px-6 h-[38px] rounded-md transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleReverse}
                  disabled={!reversalReason.trim()}
                  className="bg-[#9747FF] hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-medium px-6 h-[38px] rounded-md transition-colors"
                >
                  Reverse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
