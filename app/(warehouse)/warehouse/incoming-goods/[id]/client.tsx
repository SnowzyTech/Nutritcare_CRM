"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { IncomingGoodDetail } from "@/modules/warehouse/services/warehouse.service";
import { ArrowLeft, Search, Trash2, Printer, X } from "lucide-react";
import {
  deleteIncomingMovementAction,
  reverseIncomingMovementWarehouseAction,
} from "@/modules/warehouse/actions/incoming.action";

interface Props {
  good: IncomingGoodDetail;
}

export default function IncomingGoodDetailClient({ good }: Props) {
  const router = useRouter();
  const [isPendingReverse, startReverseTransition] = useTransition();
  const [isPendingDelete, startDeleteTransition] = useTransition();

  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reversalReason, setReversalReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isReversed = good.movementStatus === "REVERSED";

  const statusColor =
    good.movementStatus === "RECORDED"
      ? "bg-[#059669] text-white"
      : good.movementStatus === "DRAFT"
      ? "bg-gray-400 text-white"
      : good.movementStatus === "REVERSED"
      ? "bg-[#F59E0B] text-white"
      : "bg-blue-500 text-white";

  const handleReverse = () => {
    if (!reversalReason.trim()) return;
    setError(null);
    startReverseTransition(async () => {
      const result = await reverseIncomingMovementWarehouseAction(good.id, reversalReason);
      if (result?.error) {
        setError(result.error);
      } else {
        setShowReverseModal(false);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this stock in record? This cannot be undone.")) return;
    setError(null);
    startDeleteTransition(async () => {
      const result = await deleteIncomingMovementAction(good.id);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <>
      <div className="bg-[#FAFAFA] min-h-screen">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
          <Link
            href="/warehouse/incoming-goods"
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
                {good.statusLabel}
              </span>
            </div>

            {/* Right — Detail Fields */}
            <div className="flex-1 flex justify-end">
              <div className="w-full max-w-[480px] bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-[13px]">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium w-[180px]">SI-ID:</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{good.siId}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium">Warehouse:</td>
                      <td className="px-5 py-3 text-gray-800 font-medium uppercase">{good.warehouseName}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium">Supplier:</td>
                      <td className="px-5 py-3 text-gray-800 font-medium uppercase">{good.supplier}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium">Supplier Reference</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{good.supplierRef}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium">Recorded By:</td>
                      <td className="px-5 py-3 text-gray-800 font-medium uppercase">{good.recordedBy}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-gray-500 font-medium">Date Received:</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{good.dateReceived}</td>
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
                  <th className="px-4 py-2.5 text-[11px] font-medium text-left w-12">#</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-left">Product</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-left">Product Code</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-right w-32">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {good.products.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 bg-white">
                    <td className="px-4 py-3 text-[12px] text-gray-500">{item.id}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-600">{item.product}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-500">{item.productCode}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-600 text-right">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="text-red-500 text-[13px] mt-4">{error}</p>}

          {/* Reversal Info */}
          {isReversed && (
            <div className="mt-8 flex items-end justify-between">
              <div className="space-y-2">
                {good.dateReversed && (
                  <div className="flex gap-6">
                    <span className="text-[13px] font-semibold text-gray-700 w-[160px]">Date Reversed:</span>
                    <span className="text-[13px] text-gray-600">{good.dateReversed}</span>
                  </div>
                )}
                {good.reversalReason && (
                  <div className="flex gap-6">
                    <span className="text-[13px] font-semibold text-gray-700 w-[160px]">Reversal Reason:</span>
                    <span className="text-[13px] text-gray-600">{good.reversalReason}</span>
                  </div>
                )}
              </div>

              <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-[13px] font-medium px-5 h-[38px] rounded-md transition-colors">
                <Printer className="w-4 h-4" />
                PDF/Print
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {!isReversed && (
            <div className="flex items-center justify-end gap-3 mt-10">
              <button
                onClick={() => setShowReverseModal(true)}
                className="bg-[#F59E0B] hover:bg-[#D97706] text-white text-[13px] font-medium px-6 h-[38px] rounded-md transition-colors"
              >
                Reverse
              </button>
              <button
                onClick={handleDelete}
                disabled={isPendingDelete}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60 text-gray-600 text-[13px] font-medium px-5 h-[38px] rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {isPendingDelete ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-[13px] font-medium px-5 h-[38px] rounded-md transition-colors"
              >
                <Printer className="w-4 h-4" />
                PDF/Print
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reverse Modal */}
      {showReverseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowReverseModal(false)}
          />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[520px] mx-4 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowReverseModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 pt-8">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-[13px]">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium w-[160px]">SI-ID:</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{good.siId}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium">Warehouse</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{good.warehouseName}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-500 font-medium">Supplier</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{good.supplier}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-gray-500 font-medium">Date Received</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{good.dateReceived}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-gray-500 font-medium">Product</th>
                      <th className="px-4 py-2 text-right text-gray-500 font-medium w-24">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {good.products.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-gray-600">{item.product}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-right">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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

              {error && <p className="text-red-500 text-[13px] mt-2">{error}</p>}

              <p className="mt-5 text-[14px] text-[#F59E0B] font-medium">
                Do you want to reverse Stock?
              </p>

              <div className="flex items-center gap-3 mt-5 pb-2">
                <button
                  onClick={() => setShowReverseModal(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white text-[13px] font-medium px-6 h-[38px] rounded-md transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleReverse}
                  disabled={!reversalReason.trim() || isPendingReverse}
                  className="bg-[#9747FF] hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-medium px-6 h-[38px] rounded-md transition-colors"
                >
                  {isPendingReverse ? "Reversing…" : "Reverse"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
