"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftCircle, Search, Trash2, Printer, MessageCircle, Check } from "lucide-react";
import type { ReturnedMovementDetail } from "@/modules/inventory/services/inventory.service";
import {
  updateReturnedMovementAction,
  deleteReturnedMovementAction,
} from "@/modules/inventory/actions/stock.action";

export function ReturnedDetailClient({ record }: { record: ReturnedMovementDetail }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editDamaged, setEditDamaged] = useState(record.damaged);
  const [editRemarks, setEditRemarks] = useState(record.remarks);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirmEdit = () => {
    setActionError(null);
    startTransition(async () => {
      const result = await updateReturnedMovementAction(record.id, editDamaged, editRemarks);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setIsEditModalOpen(false);
      router.refresh();
    });
  };

  const handleConfirmDelete = () => {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteReturnedMovementAction(record.id);
      if (result.error) {
        setActionError(result.error);
        setIsDeleteModalOpen(false);
        return;
      }
      router.push("/inventory/returned");
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-[1400px] mx-auto relative pb-10">
      <button className="absolute -top-4 right-0 w-12 h-12 bg-[#F6E8FF] rounded-full flex items-center justify-center text-[#9D00FF] shadow-sm hover:bg-[#ebd5fa] transition-colors z-50 print:hidden">
        <MessageCircle className="w-6 h-6 fill-current" />
      </button>

      {/* Top toolbar */}
      <div className="flex items-center gap-5 mb-12 print:hidden">
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
        <div className="w-[100px]" />
      </div>

      {/* Two-column: title/status left, detail card right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returned Stock</h1>
          <p className="text-sm text-gray-400 mt-0.5 mb-3">Voucher</p>
          <span className="inline-block px-3 py-1 text-[11px] font-bold text-teal-600 bg-teal-100/80 rounded-sm tracking-widest uppercase">
            RETURNED
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-100 px-6 py-5 space-y-3">
          {[
            { label: "RS-ID:", value: record.rsId },
            { label: "Agent:", value: record.agent.toUpperCase() },
            { label: "Quantity Returned:", value: String(record.qtyReturned) },
            { label: "Status:", value: record.status },
            { label: "Recorded By:", value: record.addedBy.toUpperCase() },
            { label: "Date:", value: record.date },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-sm font-bold text-gray-700 w-44 shrink-0">{label}</span>
              <span className="text-sm font-medium text-gray-600">{value}</span>
            </div>
          ))}
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
            {record.products
              .filter(
                (row) =>
                  !search ||
                  row.product.toLowerCase().includes(search.toLowerCase()) ||
                  row.productCode.toLowerCase().includes(search.toLowerCase())
              )
              .map((row) => (
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

      {/* Footer */}
      <div className="flex items-start justify-between">
        <div className="max-w-xl">
          {record.status === "Damaged" && record.remarks && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-lg px-6 py-5">
              <h3 className="text-sm font-bold text-amber-800 mb-2">Reason for Damage:</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{record.remarks}</p>
            </div>
          )}
          {actionError && (
            <p className="text-red-500 text-sm font-medium mt-2">{actionError}</p>
          )}
        </div>

        <div className="flex gap-3 shrink-0 ml-8 print:hidden">
          <button
            onClick={() => { setActionError(null); setEditDamaged(record.damaged); setEditRemarks(record.remarks); setIsEditModalOpen(true); }}
            disabled={isPending}
            className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-amber-400 hover:bg-amber-500 transition-colors disabled:opacity-60"
          >
            Edit
          </button>
          <button
            onClick={() => { setActionError(null); setIsDeleteModalOpen(true); }}
            disabled={isPending}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Printer className="w-4 h-4" /> PDF/Print
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Edit Returned Stock</h2>
              <div className="border border-gray-200 rounded-md overflow-hidden mb-6 flex flex-col">
                <div className="flex border-b border-gray-200">
                  <div className="w-1/2 p-3.5 text-sm text-gray-600 border-r border-gray-200">RS-ID:</div>
                  <div className="w-1/2 p-3.5 text-sm text-gray-800">{record.rsId}</div>
                </div>
                <div className="flex border-b border-gray-200">
                  <div className="w-1/2 p-3.5 text-sm text-gray-600 border-r border-gray-200">Agent:</div>
                  <div className="w-1/2 p-3.5 text-sm text-gray-800">{record.agent}</div>
                </div>
                <div className="flex">
                  <div className="w-1/2 p-3.5 text-sm text-gray-600 border-r border-gray-200">Date:</div>
                  <div className="w-1/2 p-3.5 text-sm text-gray-800">{record.date}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setEditDamaged(!editDamaged)}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                    editDamaged
                      ? "border-[#9D00FF] text-[#9D00FF]"
                      : "border-gray-300 text-transparent"
                  }`}
                >
                  {editDamaged && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </button>
                <span className="text-sm font-medium text-gray-900">Damaged</span>
              </div>

              {editDamaged && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Reason for Damage
                  </label>
                  <textarea
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="Briefly describe the damage..."
                    className="w-full border border-gray-200 rounded-md p-4 text-sm outline-none focus:border-[#9D00FF] resize-none h-28 text-gray-700 placeholder:text-gray-300 transition-colors bg-white"
                  />
                </div>
              )}

              {actionError && (
                <p className="text-red-500 text-sm font-medium mb-4">{actionError}</p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => { setIsEditModalOpen(false); setActionError(null); }}
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-gray-400 hover:bg-gray-500 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmEdit}
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors disabled:opacity-60"
                >
                  {isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Returned Movement</h2>
              <p className="text-sm text-gray-600 mb-1">
                Are you sure you want to delete <span className="font-semibold">{record.rsId}</span>?
              </p>
              <p className="text-sm text-red-500 font-medium mb-6">This action cannot be undone.</p>
              {actionError && (
                <p className="text-red-500 text-sm font-medium mb-4">{actionError}</p>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => { setIsDeleteModalOpen(false); setActionError(null); }}
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-gray-400 hover:bg-gray-500 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
