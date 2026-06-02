"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { AdjustmentDetail } from "@/modules/inventory/services/inventory.service";
import {
  approveAdjustmentAction,
  rejectAdjustmentAction,
} from "@/modules/inventory/actions/stock.action";

export function AdjustmentApprovalClient({ record }: { record: AdjustmentDetail }) {
  const router = useRouter();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPendingApproval = record.status === "Pending Approval";

  const handleApprove = () => {
    setActionError(null);
    startTransition(async () => {
      const result = await approveAdjustmentAction(record.id);
      if (result.error) {
        setActionError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Stock adjustment approved — warehouse stock updated");
      router.push("/admin/inventory");
    });
  };

  const handleConfirmReject = () => {
    setActionError(null);
    startTransition(async () => {
      const result = await rejectAdjustmentAction(record.id, rejectionReason);
      if (result.error) {
        setActionError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Stock adjustment rejected");
      setIsRejectModalOpen(false);
      router.push("/admin/inventory");
    });
  };

  const statusColor =
    record.status === "Pending Approval"
      ? "#f97316"
      : record.status === "Recorded"
      ? "#10b981"
      : record.status === "Rejected"
      ? "#dc2626"
      : "#f59e0b";

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Top toolbar */}
      <div className="flex items-center gap-5 mb-8">
        <button
          onClick={() => router.push("/admin/inventory")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#3D0066] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Approvals
        </button>
      </div>

      {/* Two-column: title/status left, detail card right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Adjustment Review</h1>
          <p className="text-sm text-gray-400 mt-0.5 mb-3">Admin Approval</p>
          <span
            style={{ backgroundColor: statusColor }}
            className="inline-block px-3 py-1 text-xs font-bold text-white rounded-sm tracking-wide"
          >
            {record.status.toUpperCase()}
          </span>
          {isPendingApproval && (
            <p className="text-sm text-orange-600 font-medium mt-2">
              This adjustment is waiting for your approval before stock levels are updated.
            </p>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-100 px-6 py-5 space-y-3">
          {[
            { label: "SA-ID:", value: record.saId },
            { label: "Warehouse:", value: record.warehouse.toUpperCase() },
            { label: "Manager:", value: record.warehouseManager.toUpperCase() },
            { label: "Reason:", value: record.reason },
            { label: "Submitted By:", value: record.recordedBy.toUpperCase() },
            { label: "Date:", value: record.date },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-sm font-bold text-gray-700 w-36 shrink-0">{label}</span>
              <span className="text-sm font-semibold text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Items table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#3D0066" }}>
              <th className="text-left text-xs font-semibold text-white py-3 px-4 w-12">#</th>
              <th className="text-left text-xs font-semibold text-white py-3 px-4">Product</th>
              <th className="text-left text-xs font-semibold text-white py-3 px-4">Product Code</th>
              <th className="text-center text-xs font-semibold text-white py-3 px-4">Expected Qty</th>
              <th className="text-center text-xs font-semibold text-white py-3 px-4">Actual Qty</th>
              <th className="text-right text-xs font-semibold text-white py-3 px-4">Variance</th>
            </tr>
          </thead>
          <tbody>
            {record.items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-600">{item.id}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{item.product}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{item.productCode}</td>
                <td className="py-3 px-4 text-sm text-gray-600 text-center">{item.quantityBefore}</td>
                <td className="py-3 px-4 text-sm text-gray-600 text-center">{item.quantityAfter}</td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`text-sm font-semibold ${
                      item.variance > 0
                        ? "text-emerald-600"
                        : item.variance < 0
                        ? "text-red-500"
                        : "text-gray-500"
                    }`}
                  >
                    {item.variance > 0 ? `+${item.variance}` : item.variance}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {record.notes && (
        <div className="bg-gray-50/80 rounded-xl px-6 py-4 mb-8">
          <span className="text-sm font-bold text-gray-700">Notes: </span>
          <span className="text-sm text-gray-600">{record.notes}</span>
        </div>
      )}

      {/* Action footer */}
      <div className="flex items-center justify-between">
        <div>
          {actionError && (
            <p className="text-red-500 text-sm font-medium">{actionError}</p>
          )}
        </div>

        {isPendingApproval && (
          <div className="flex gap-3">
            <button
              onClick={() => { setActionError(null); setIsRejectModalOpen(true); }}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              <CheckCircle className="w-4 h-4" />
              {isPending ? "Approving…" : "Approve"}
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Reject Stock Adjustment</h2>
              <p className="text-sm text-gray-500 mb-4">
                Provide a reason so the Inventory Manager knows what to fix.
              </p>

              <div className="border border-gray-200 rounded-md overflow-hidden mb-6">
                <div className="flex border-b border-gray-200">
                  <div className="w-1/2 p-3.5 text-sm text-gray-600 border-r border-gray-200">SA-ID:</div>
                  <div className="w-1/2 p-3.5 text-sm text-gray-800">{record.saId}</div>
                </div>
                <div className="flex">
                  <div className="w-1/2 p-3.5 text-sm text-gray-600 border-r border-gray-200">Warehouse:</div>
                  <div className="w-1/2 p-3.5 text-sm text-gray-800">{record.warehouse}</div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Rejection <span className="font-normal text-gray-500">Reason</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why you are rejecting this adjustment…"
                  className="w-full border border-gray-200 rounded-md p-4 text-sm outline-none focus:border-[#3D0066] resize-none h-36 text-gray-700 placeholder:text-gray-300 transition-colors bg-white"
                />
              </div>

              {actionError && (
                <p className="text-red-500 text-sm font-medium mb-4">{actionError}</p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => { setIsRejectModalOpen(false); setActionError(null); }}
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-gray-400 hover:bg-gray-500 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {isPending ? "Rejecting…" : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
