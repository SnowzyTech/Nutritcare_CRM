"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Trash2, Printer, RotateCcw } from "lucide-react";
import type { OutgoingMovementDetail } from "@/modules/inventory/services/inventory.service";
import {
  deleteOutgoingMovementAction,
  reverseOutgoingMovementWarehouseAction,
} from "@/modules/warehouse/actions/outgoing.action";

interface Props {
  item: OutgoingMovementDetail;
}

export default function OutgoingDetailClient({ item }: Props) {
  const router = useRouter();
  const [isPendingDelete, startDelete] = useTransition();
  const [isPendingReverse, startReverse] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReverseDialog, setShowReverseDialog] = useState(false);
  const [reverseReason, setReverseReason] = useState("");

  const isReversed = item.status === "Reversed";

  const statusColor =
    item.status === "Received"
      ? "bg-[#059669] text-white"
      : item.status === "Reversed"
      ? "bg-red-500 text-white"
      : item.status === "Not Received"
      ? "bg-amber-500 text-white"
      : "bg-gray-400 text-white";

  const handleDelete = () => {
    setError(null);
    startDelete(async () => {
      const result = await deleteOutgoingMovementAction(item.id);
      if (result?.error) {
        setError(result.error);
        setShowDeleteDialog(false);
      }
    });
  };

  const handleReverse = () => {
    startReverse(async () => {
      const result = await reverseOutgoingMovementWarehouseAction(item.id, reverseReason);
      if (result?.error) {
        setError(result.error);
      } else {
        setShowReverseDialog(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
        <Link
          href="/warehouse/outgoing"
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
            <h1 className="text-[22px] font-semibold text-gray-800">Stock Out</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Voucher</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-wide ${statusColor}`}>
              {item.status}
            </span>
          </div>

          {/* Right — Detail Fields */}
          <div className="flex-1 flex justify-end">
            <div className="w-full max-w-[500px] bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-[13px]">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 text-gray-500 font-medium w-[180px]">SO ID:</td>
                    <td className="px-5 py-3 text-gray-800 font-medium">{item.soId}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 text-gray-500 font-medium">State / Agent:</td>
                    <td className="px-5 py-3 text-[#9747FF] font-medium uppercase">
                      {item.state} / {item.agent}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 text-gray-500 font-medium">Country:</td>
                    <td className="px-5 py-3 text-gray-800 font-medium">{item.country}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 text-gray-500 font-medium">Supplier Ref:</td>
                    <td className="px-5 py-3 text-gray-800 font-medium">{item.supplierReference}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 text-gray-500 font-medium">Added By:</td>
                    <td className="px-5 py-3 text-gray-800 font-medium uppercase">{item.addedBy}</td>
                  </tr>
                  <tr className={isReversed ? "border-b border-gray-100" : ""}>
                    <td className="px-5 py-3 text-gray-500 font-medium">Date:</td>
                    <td className="px-5 py-3 text-gray-800 font-medium">{item.date}</td>
                  </tr>
                  {isReversed && (
                    <>
                      <tr className="border-b border-gray-100">
                        <td className="px-5 py-3 text-gray-500 font-medium">Date Reversed:</td>
                        <td className="px-5 py-3 text-gray-800 font-medium">{item.dateReversed}</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 text-gray-500 font-medium">Reversal Reason:</td>
                        <td className="px-5 py-3 text-gray-700 font-medium italic">{item.reversalReason ?? "—"}</td>
                      </tr>
                    </>
                  )}
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
                <th className="px-4 py-2.5 text-[11px] font-medium text-right">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {item.products.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 bg-white last:border-0">
                  <td className="px-4 py-3 text-[12px] text-gray-500">{p.id}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-600">{p.product}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-500">{p.productCode}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-600 text-right">{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        <div className="mt-8">
          <h3 className="text-[13px] font-semibold text-gray-700 mb-2">Notes</h3>
          <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 min-h-[60px]">
            <p className="text-[13px] text-gray-500 whitespace-pre-wrap">
              {/* notes comes from the movement's notes field; not currently in OutgoingMovementDetail — show dash */}
              —
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-[13px] mt-4">{error}</p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-10">
          {!isReversed && (
            <button
              onClick={() => setShowReverseDialog(true)}
              disabled={isPendingReverse}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-amber-50 hover:border-amber-300 text-gray-600 hover:text-amber-700 text-[13px] font-medium px-5 h-[38px] rounded-md transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reverse
            </button>
          )}
          <button
            onClick={() => { setError(null); setShowDeleteDialog(true); }}
            disabled={isPendingDelete}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-300 text-gray-600 hover:text-red-600 text-[13px] font-medium px-5 h-[38px] rounded-md transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-[13px] font-medium px-5 h-[38px] rounded-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            PDF / Print
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[420px]">
            <h2 className="text-[16px] font-semibold text-gray-800 mb-2">Delete Movement</h2>
            <p className="text-[13px] text-gray-500 mb-1">
              Are you sure you want to delete <span className="font-semibold">{item.soId}</span>?
            </p>
            <p className="text-[13px] text-red-500 font-medium mb-6">This action cannot be undone.</p>
            {error && (
              <p className="text-red-500 text-[13px] font-medium mb-4">{error}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteDialog(false); setError(null); }}
                disabled={isPendingDelete}
                className="px-5 h-[36px] rounded-md text-[13px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPendingDelete}
                className="px-5 h-[36px] rounded-md text-[13px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isPendingDelete ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reverse Dialog */}
      {showReverseDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[420px]">
            <h2 className="text-[16px] font-semibold text-gray-800 mb-2">Reverse Movement</h2>
            <p className="text-[13px] text-gray-500 mb-4">
              This will mark the movement as reversed. Provide an optional reason below.
            </p>
            <textarea
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="Reason for reversal (optional)"
              className="w-full h-[80px] border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-600 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowReverseDialog(false); setReverseReason(""); }}
                className="px-5 h-[36px] rounded-md text-[13px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReverse}
                disabled={isPendingReverse}
                className="px-5 h-[36px] rounded-md text-[13px] font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {isPendingReverse ? "Reversing…" : "Confirm Reverse"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
