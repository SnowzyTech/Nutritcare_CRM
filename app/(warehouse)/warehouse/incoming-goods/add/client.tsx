"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { CalendarIcon, ArrowLeft, Building2, Search, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { RecordedVoucher } from "@/modules/warehouse/services/warehouse.service";
import { confirmIncomingReceiptAction } from "@/modules/warehouse/actions/incoming.action";

type ShelfLocation = {
  id: string;
  locationCode: string;
  occupancyStatus: string;
  currentStock: number;
  maxCapacity: number | null;
};

// Per-product, per-shelf allocation row managed in state
type ShelfRow = {
  locationId: string;
  quantity: string; // string so input is controlled
};

type ProductAllocations = Record<string, ShelfRow[]>; // productId → rows

interface Props {
  recordedVouchers: RecordedVoucher[];
  warehouseName: string;
  shelfLocations: ShelfLocation[];
}

export default function AddIncomingGoodsClient({ recordedVouchers, warehouseName, shelfLocations }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // SI-ID search
  const [siSearch, setSiSearch] = useState("");
  const [showSiDropdown, setShowSiDropdown] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<RecordedVoucher | null>(null);
  const siInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isReserved, setIsReserved] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);
  const [notes, setNotes] = useState("");

  // Per-product shelf allocations: productId → [{locationId, quantity}]
  const [allocations, setAllocations] = useState<ProductAllocations>({});

  const filteredVouchers = recordedVouchers.filter(
    (v) =>
      v.referenceNumber.toLowerCase().includes(siSearch.toLowerCase()) ||
      (v.supplierName ?? "").toLowerCase().includes(siSearch.toLowerCase()),
  );

  function buildInitialAllocations(v: RecordedVoucher): ProductAllocations {
    const init: ProductAllocations = {};
    for (const item of v.items) {
      init[item.productId] = [{ locationId: "", quantity: "" }];
    }
    return init;
  }

  function handleSelectVoucher(v: RecordedVoucher) {
    setSelectedVoucher(v);
    setSiSearch(v.referenceNumber);
    setShowSiDropdown(false);
    setAllocations(buildInitialAllocations(v));
  }

  function handleClearVoucher() {
    setSelectedVoucher(null);
    setSiSearch("");
    setAllocations({});
    setIsReserved(false);
    setIsDamaged(false);
    setDate(undefined);
    setNotes("");
    setError(null);
    siInputRef.current?.focus();
  }

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        siInputRef.current &&
        !siInputRef.current.contains(e.target as Node)
      ) {
        setShowSiDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ── Allocation helpers ───────────────────────────────────────────────────────

  function addShelfRow(productId: string) {
    setAllocations((prev) => ({
      ...prev,
      [productId]: [...(prev[productId] ?? []), { locationId: "", quantity: "" }],
    }));
  }

  function removeShelfRow(productId: string, index: number) {
    setAllocations((prev) => {
      const rows = [...(prev[productId] ?? [])];
      rows.splice(index, 1);
      return { ...prev, [productId]: rows };
    });
  }

  function updateShelfRow(productId: string, index: number, field: "locationId" | "quantity", value: string) {
    setAllocations((prev) => {
      const rows = [...(prev[productId] ?? [])];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, [productId]: rows };
    });
  }

  function assignedQty(productId: string): number {
    return (allocations[productId] ?? []).reduce((s, r) => s + (parseInt(r.quantity) || 0), 0);
  }

  function allProductsCovered(): boolean {
    if (!selectedVoucher) return false;
    return selectedVoucher.items.every((item) => assignedQty(item.productId) === item.quantity);
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    if (!selectedVoucher) return setError("Please select a voucher SI-ID first");
    if (!date) return setError("Date is required");
    if (!allProductsCovered()) return setError("Shelf assignments must exactly match the voucher quantities for each product");

    // Build flat list of assignments
    const shelfAssignments: { productId: string; locationId: string; quantity: number }[] = [];
    for (const item of selectedVoucher.items) {
      for (const row of allocations[item.productId] ?? []) {
        if (row.locationId && parseInt(row.quantity) > 0) {
          shelfAssignments.push({ productId: item.productId, locationId: row.locationId, quantity: parseInt(row.quantity) });
        }
      }
    }
    if (shelfAssignments.some((a) => !a.locationId)) return setError("All shelf rows must have a location selected");

    const fd = new FormData();
    fd.set("stockMovementId", selectedVoucher.id);
    fd.set("date", date.toISOString());
    fd.set("notes", notes);
    fd.set("shelfAssignments", JSON.stringify(shelfAssignments));
    fd.set("isReserved", isReserved ? "true" : "false");
    fd.set("isDamaged", isDamaged ? "true" : "false");

    startTransition(async () => {
      const result = await confirmIncomingReceiptAction(null, fd);
      if (result?.error) setError(result.error);
    });
  }

  const shelfById = new Map(shelfLocations.map((s) => [s.id, s]));

  return (
    <div className="bg-white min-h-screen pb-10">
      {/* Top Bar */}
      <div className="flex items-center gap-4 px-8 py-6 border-b border-gray-100">
        <Link
          href="/warehouse/incoming-goods"
          className="flex items-center gap-2 text-gray-500 text-[14px] font-medium hover:text-gray-700 transition-colors"
        >
          <div className="w-[22px] h-[22px] rounded-full border-2 border-gray-500 flex items-center justify-center">
            <ArrowLeft className="w-3 h-3 stroke-[3]" />
          </div>
          Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold text-gray-800">Stock In</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Voucher</p>
        </div>

        <div className="flex items-center gap-3 mb-8 px-4 py-3 bg-purple-50 border border-purple-100 rounded-lg w-fit">
          <Building2 className="w-4 h-4 text-[#9747FF]" />
          <span className="text-[13px] text-[#9747FF] font-medium">Warehouse: {warehouseName}</span>
        </div>

        {/* Header fields */}
        <div className="flex gap-8 mb-8">
          {/* Left — Reserved / Damaged */}
          <div className="flex-shrink-0 w-[220px] pt-2 space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReserved(!isReserved)}
                className={cn(
                  "flex items-center gap-1.5 px-3 h-[30px] rounded-md text-[12px] font-medium border transition-colors",
                  isReserved
                    ? "bg-[#9747FF] text-white border-[#9747FF]"
                    : "bg-white text-gray-500 border-gray-200 hover:border-[#9747FF]",
                )}
              >
                {isReserved ? "Yes" : "No"}
              </button>
              <span className="text-[13px] text-gray-600">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDamaged(!isDamaged)}
                className={cn(
                  "flex items-center gap-1.5 px-3 h-[30px] rounded-md text-[12px] font-medium border transition-colors",
                  isDamaged
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-white text-gray-500 border-gray-200 hover:border-red-400",
                )}
              >
                {isDamaged ? "Yes" : "No"}
              </button>
              <span className="text-[13px] text-gray-600">Damaged</span>
            </div>
          </div>

          {/* Right — SI-ID, Supplier, Date */}
          <div className="flex-1 space-y-5 max-w-[500px]">
            {/* SI-ID Search */}
            <div className="flex items-start gap-4">
              <label className="text-[12px] font-medium text-amber-600 w-[150px] text-right pt-2">
                SI-ID <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={siInputRef}
                    type="text"
                    value={siSearch}
                    onChange={(e) => {
                      setSiSearch(e.target.value);
                      setShowSiDropdown(true);
                      if (selectedVoucher && e.target.value !== selectedVoucher.referenceNumber) {
                        setSelectedVoucher(null);
                      }
                    }}
                    onFocus={() => setShowSiDropdown(true)}
                    placeholder="Type or paste SI-ID (e.g. SI-ABC123)"
                    className={cn(
                      "w-full h-[36px] border rounded-md pl-9 pr-9 text-[13px] placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF]",
                      selectedVoucher
                        ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                        : "border-gray-200 text-gray-700",
                    )}
                  />
                  {selectedVoucher && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                {showSiDropdown && siSearch.length > 0 && !selectedVoucher && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto"
                  >
                    {filteredVouchers.length === 0 ? (
                      <div className="px-4 py-3 text-[12px] text-gray-400">
                        No recorded vouchers match &quot;{siSearch}&quot;
                      </div>
                    ) : (
                      filteredVouchers.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onMouseDown={() => handleSelectVoucher(v)}
                          className="w-full text-left px-4 py-2.5 hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="text-[13px] font-medium text-gray-800">{v.referenceNumber}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {v.supplierName ?? "No supplier"} · {v.items.length} product
                            {v.items.length !== 1 ? "s" : ""}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {recordedVouchers.length === 0 && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    No pending vouchers — inventory manager must register goods first.
                  </p>
                )}
              </div>
            </div>

            {selectedVoucher && (
              <>
                <div className="flex items-center gap-4">
                  <span className="text-[12px] font-medium text-gray-400 w-[150px] text-right">Supplier</span>
                  <span className="text-[13px] text-gray-600 flex-1">{selectedVoucher.supplierName ?? "—"}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[12px] font-medium text-gray-400 w-[150px] text-right">Supplier Reference</span>
                  <span className="text-[13px] text-gray-600 flex-1">{selectedVoucher.supplierReference ?? "—"}</span>
                </div>
              </>
            )}

            {/* Date */}
            <div className="flex items-center gap-4">
              <label className="text-[12px] font-medium text-amber-600 w-[150px] text-right">
                Date <span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger>
                  <div
                    className={cn(
                      "flex-1 max-w-[280px] h-[36px] border border-gray-200 rounded-md px-3 text-[13px] flex items-center justify-between focus:outline-none cursor-pointer",
                      !date ? "text-gray-300" : "text-gray-700",
                    )}
                  >
                    {date ? format(date, "PPP") : "Select date"}
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="rounded-md border" />
                </PopoverContent>
              </Popover>
            </div>

            {selectedVoucher && (
              <div className="flex items-center gap-4">
                <span className="w-[150px]" />
                <button type="button" onClick={handleClearVoucher} className="text-[11px] text-red-400 hover:text-red-600 underline">
                  Change voucher
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Per-product shelf assignment table ─────────────────────────────── */}
        {selectedVoucher && (
          <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden mt-2">
            <div className="bg-white px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[12px] text-gray-500 font-medium">
                Shelf Assignments · {selectedVoucher.referenceNumber}
              </span>
              <span className="text-[11px] text-gray-400">Assign each product to one or more shelves</span>
            </div>

            <table className="w-full">
              <thead>
                <tr className="bg-[#4A0E78] text-white">
                  <th className="px-4 py-2.5 text-[11px] font-medium text-left w-8">#</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-left">Product</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-center w-28">Required Qty</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-left">Shelf Assignments</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-center w-24">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {selectedVoucher.items.map((item, i) => {
                  const rows = allocations[item.productId] ?? [];
                  const assigned = assignedQty(item.productId);
                  const covered = assigned === item.quantity;
                  const over = assigned > item.quantity;

                  return (
                    <tr key={item.productId} className="border-b border-gray-100 bg-white last:border-0 align-top">
                      <td className="px-4 py-3 text-[12px] text-gray-500">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-[13px] text-gray-700 font-medium">{item.productName}</div>
                        <div className="text-[11px] text-gray-400">{item.productCode}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[13px] text-gray-700 font-semibold">{item.quantity}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          {rows.map((row, ri) => {
                            const selectedShelf = row.locationId ? shelfById.get(row.locationId) : null;
                            return (
                              <div key={ri} className="flex items-center gap-2">
                                {/* Shelf dropdown */}
                                <select
                                  value={row.locationId}
                                  onChange={(e) => updateShelfRow(item.productId, ri, "locationId", e.target.value)}
                                  className="h-[30px] border border-gray-200 rounded-md px-2 text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#9747FF] min-w-[110px]"
                                >
                                  <option value="">Select shelf</option>
                                  {shelfLocations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                      {loc.locationCode}
                                    </option>
                                  ))}
                                </select>

                                {/* Current stock info */}
                                {selectedShelf && (
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                    {selectedShelf.currentStock} units in
                                  </span>
                                )}

                                {/* Quantity input */}
                                <input
                                  type="number"
                                  min="1"
                                  max={item.quantity}
                                  value={row.quantity}
                                  onChange={(e) => updateShelfRow(item.productId, ri, "quantity", e.target.value)}
                                  placeholder="Qty"
                                  className="w-[60px] h-[30px] border border-gray-200 rounded-md px-2 text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#9747FF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />

                                {/* Remove row */}
                                {rows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeShelfRow(item.productId, ri)}
                                    className="text-red-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          {/* Add shelf row */}
                          <button
                            type="button"
                            onClick={() => addShelfRow(item.productId)}
                            className="flex items-center gap-1 text-[11px] text-[#9747FF] hover:text-[#7C3AED] transition-colors mt-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add shelf
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "text-[13px] font-semibold",
                            covered ? "text-emerald-600" : over ? "text-red-500" : "text-gray-500",
                          )}
                        >
                          {assigned}
                        </span>
                        {covered && <div className="text-[10px] text-emerald-500">✓ done</div>}
                        {over && <div className="text-[10px] text-red-400">over by {assigned - item.quantity}</div>}
                        {!covered && !over && assigned > 0 && (
                          <div className="text-[10px] text-gray-400">need {item.quantity - assigned} more</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Coverage summary */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                {selectedVoucher.items.filter((it) => assignedQty(it.productId) === it.quantity).length} of{" "}
                {selectedVoucher.items.length} products fully assigned
              </span>
              {allProductsCovered() && (
                <span className="text-[11px] text-emerald-600 font-medium">All products assigned ✓</span>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mt-8 mb-4">
          <label className="text-[12px] font-medium text-gray-600 block mb-2">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type in here"
            className="w-full h-[80px] border border-gray-200 rounded-md px-3 py-2.5 text-[13px] text-gray-400 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-[13px] mb-4">{error}</p>}

        <div className="flex items-center justify-end gap-3 mt-6">
          <Link href="/warehouse/incoming-goods">
            <Button
              type="button"
              className="bg-gray-200 text-gray-600 hover:bg-gray-300 text-[13px] font-medium px-5 h-[36px] rounded-md"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending || !selectedVoucher || !allProductsCovered()}
            className="bg-[#9747FF] text-white hover:bg-[#7C3AED] text-[13px] font-medium px-6 h-[36px] rounded-md disabled:opacity-60"
          >
            {isPending ? "Confirming…" : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
