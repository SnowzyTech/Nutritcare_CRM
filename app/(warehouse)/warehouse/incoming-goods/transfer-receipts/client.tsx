"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Package, ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { InTransitTransferRow } from "@/modules/warehouse/services/warehouse.service";
import { receiveStockTransferAction } from "@/modules/warehouse/actions/receive-transfer.action";

type ShelfEntry = { productId: string; locationId: string; quantity: number };

type ShelfAssignmentState = Record<string, { locationId: string; quantity: number }[]>;

function ReceiveModal({
  transfer,
  onClose,
  onSuccess,
}: {
  transfer: InTransitTransferRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // shelfAssignments: productId → [{locationId, quantity}]
  const [shelfAssignments, setShelfAssignments] = useState<ShelfAssignmentState>(() => {
    const initial: ShelfAssignmentState = {};
    for (const item of transfer.items) {
      initial[item.productId] = [{ locationId: "", quantity: item.requiredQty }];
    }
    return initial;
  });

  function addRow(productId: string) {
    setShelfAssignments((prev) => ({
      ...prev,
      [productId]: [...(prev[productId] ?? []), { locationId: "", quantity: 0 }],
    }));
  }

  function removeRow(productId: string, idx: number) {
    setShelfAssignments((prev) => {
      const rows = prev[productId] ?? [];
      if (rows.length <= 1) return prev;
      return { ...prev, [productId]: rows.filter((_, i) => i !== idx) };
    });
  }

  function updateRow(productId: string, idx: number, field: "locationId" | "quantity", value: string | number) {
    setShelfAssignments((prev) => {
      const rows = [...(prev[productId] ?? [])];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, [productId]: rows };
    });
  }

  function getTotalAssigned(productId: string): number {
    return (shelfAssignments[productId] ?? []).reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  }

  function handleSubmit() {
    setError(null);
    const entries: ShelfEntry[] = [];
    for (const item of transfer.items) {
      const rows = shelfAssignments[item.productId] ?? [];
      const total = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
      if (total !== item.requiredQty) {
        setError(`Shelf quantities for "${item.productName}" must total ${item.requiredQty} (currently ${total})`);
        return;
      }
      for (const row of rows) {
        if (!row.locationId) {
          setError(`Please select a shelf location for each row of "${item.productName}"`);
          return;
        }
        if ((Number(row.quantity) || 0) <= 0) {
          setError(`Quantity must be greater than 0 for each shelf row`);
          return;
        }
        entries.push({ productId: item.productId, locationId: row.locationId, quantity: Number(row.quantity) });
      }
    }

    startTransition(async () => {
      const result = await receiveStockTransferAction(transfer.id, entries, notes || undefined);
      if (!result.success) {
        setError(result.error ?? "Failed to receive transfer");
        toast.error(result.error ?? "Failed to receive transfer");
      } else {
        toast.success("Transfer received and shelved successfully");
        onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Receive Transfer</h2>
          <p className="text-xs text-gray-400 mt-1">
            Ref: <span className="font-semibold text-gray-600">{transfer.referenceNumber}</span>
            {" · "}From: <span className="font-semibold text-gray-600">{transfer.sourceWarehouseName}</span>
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {transfer.items.map((item) => {
            const rows = shelfAssignments[item.productId] ?? [];
            const assigned = getTotalAssigned(item.productId);
            const remaining = item.requiredQty - assigned;
            return (
              <div key={item.productId} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{item.productName}</p>
                    <p className="text-xs text-gray-400">{item.productCode} · Required: {item.requiredQty}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    remaining === 0
                      ? "bg-green-50 text-green-600"
                      : remaining > 0
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-600"
                  }`}>
                    {remaining === 0 ? "Fully assigned" : remaining > 0 ? `${remaining} unassigned` : `Over by ${-remaining}`}
                  </span>
                </div>

                <div className="space-y-2">
                  {rows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <select
                        value={row.locationId}
                        onChange={(e) => updateRow(item.productId, idx, "locationId", e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#9747FF]"
                      >
                        <option value="">Select shelf</option>
                        {item.availableShelves.map((shelf) => (
                          <option key={shelf.locationId} value={shelf.locationId}>
                            {shelf.locationCode}
                            {shelf.availableQty > 0 ? ` (${shelf.availableQty} in stock)` : " (empty)"}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) => updateRow(item.productId, idx, "quantity", parseInt(e.target.value) || 0)}
                        className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 text-center focus:outline-none focus:ring-1 focus:ring-[#9747FF]"
                        placeholder="Qty"
                      />
                      {rows.length > 1 && (
                        <button
                          onClick={() => removeRow(item.productId, idx)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addRow(item.productId)}
                    className="flex items-center gap-1 text-xs text-[#9747FF] hover:text-purple-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add another shelf
                  </button>
                </div>
              </div>
            );
          })}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any remarks about this receipt…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#9747FF] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 bg-[#9747FF] hover:bg-purple-700 text-white font-bold h-10 rounded-lg disabled:opacity-50"
          >
            {isPending ? "Receiving…" : "Confirm Receipt & Shelve"}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="px-6 h-10 rounded-lg border-gray-200 text-gray-500 font-medium disabled:opacity-50"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TransferReceiptsClient({
  transfers,
  hasWarehouse,
}: {
  transfers: InTransitTransferRow[];
  hasWarehouse: boolean;
}) {
  const [receivingTransfer, setReceivingTransfer] = useState<InTransitTransferRow | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!hasWarehouse) {
    return (
      <div className="flex flex-col h-full bg-[#FAFAFA] min-h-screen items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center gap-4 w-[480px] text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400" />
          <h2 className="text-[18px] font-semibold text-gray-700">No Warehouse Assigned</h2>
          <p className="text-[13px] text-gray-400 leading-relaxed">
            Your account is not linked to a warehouse. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {receivingTransfer && (
        <ReceiveModal
          transfer={receivingTransfer}
          onClose={() => setReceivingTransfer(null)}
          onSuccess={() => setReceivingTransfer(null)}
        />
      )}

      <div className="flex flex-col h-full bg-[#FAFAFA] min-h-screen">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-8 py-5">
          <Link
            href="/warehouse/incoming-goods"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Incoming Goods
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-700">Receive Stock Transfers</span>
        </div>

        <div className="px-8 pb-8">
          {transfers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center w-full min-h-[340px]">
              <Package className="w-12 h-12 text-gray-200 mb-4" />
              <h2 className="text-[18px] font-semibold text-gray-500 mb-2">No Pending Transfers</h2>
              <p className="text-[13px] text-gray-400 text-center max-w-sm">
                There are no in-transit stock transfers addressed to your warehouse right now.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                {transfers.length} transfer{transfers.length !== 1 ? "s" : ""} awaiting receipt
              </p>
              {transfers.map((t) => {
                const isExpanded = expandedId === t.id;
                return (
                  <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-800">{t.referenceNumber}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ff] text-[#9747FF] border border-[#e9d5ff]">
                            In Transit
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          From: <span className="font-medium text-gray-500">{t.sourceWarehouseName}</span>
                          {t.scheduledTime && (
                            <> · Dispatched: <span className="font-medium text-gray-500">{t.scheduledTime}</span></>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : t.id)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <Button
                          onClick={() => setReceivingTransfer(t)}
                          className="bg-[#9747FF] hover:bg-purple-700 text-white text-xs font-bold px-5 h-8 rounded-lg"
                        >
                          Receive
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-400 uppercase font-semibold">
                              <th className="pb-2 text-left">Product</th>
                              <th className="pb-2 text-left">Code</th>
                              <th className="pb-2 text-right">Qty</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {t.items.map((item) => (
                              <tr key={item.productId}>
                                <td className="py-2 font-medium text-gray-700">{item.productName}</td>
                                <td className="py-2 text-gray-400">{item.productCode}</td>
                                <td className="py-2 text-right font-bold text-gray-700">{item.requiredQty}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
