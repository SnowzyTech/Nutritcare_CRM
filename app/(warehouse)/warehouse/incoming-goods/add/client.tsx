"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { CalendarIcon, ArrowLeft, Building2, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // Warehouse manager inputs
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [shelfLocationId, setShelfLocationId] = useState("");
  const [fullQty, setFullQty] = useState("");
  const [partialQty, setPartialQty] = useState("");
  const [emptyQty, setEmptyQty] = useState("");
  const [isReserved, setIsReserved] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);
  const [notes, setNotes] = useState("");

  const selectedShelf = shelfLocations.find((s) => s.id === shelfLocationId) ?? null;

  // Reset shelf qty inputs when shelf changes
  useEffect(() => {
    setFullQty("");
    setPartialQty("");
    setEmptyQty("");
  }, [shelfLocationId]);

  const filteredVouchers = recordedVouchers.filter(
    (v) =>
      v.referenceNumber.toLowerCase().includes(siSearch.toLowerCase()) ||
      (v.supplierName ?? "").toLowerCase().includes(siSearch.toLowerCase())
  );

  function handleSelectVoucher(v: RecordedVoucher) {
    setSelectedVoucher(v);
    setSiSearch(v.referenceNumber);
    setShowSiDropdown(false);
  }

  function handleClearVoucher() {
    setSelectedVoucher(null);
    setSiSearch("");
    setShelfLocationId("");
    setFullQty("");
    setPartialQty("");
    setEmptyQty("");
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

  // Derive occupancy status from the three inputs
  function deriveOccupancyStatus(): string | null {
    const f = parseInt(fullQty) || 0;
    const p = parseInt(partialQty) || 0;
    const e = parseInt(emptyQty) || 0;
    if (f === 0 && p === 0 && e === 0) return null;
    if (f > 0 && p === 0 && e === 0) return "FULL";
    if (e > 0 && f === 0 && p === 0) return "EMPTY";
    return "PARTIAL";
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    if (!selectedVoucher) return setError("Please select a voucher SI-ID first");
    if (!date) return setError("Date is required");

    const totalShelfQty = (parseInt(fullQty) || 0) + (parseInt(partialQty) || 0) + (parseInt(emptyQty) || 0);
    const occupancyStatus = deriveOccupancyStatus();

    const fd = new FormData();
    fd.set("stockMovementId", selectedVoucher.id);
    fd.set("date", date.toISOString());
    fd.set("notes", notes);
    if (shelfLocationId) fd.set("shelfLocationId", shelfLocationId);
    if (totalShelfQty > 0) fd.set("shelfQuantity", String(totalShelfQty));
    if (occupancyStatus) fd.set("occupancyStatus", occupancyStatus);
    fd.set("isReserved", isReserved ? "true" : "false");
    fd.set("isDamaged", isDamaged ? "true" : "false");

    startTransition(async () => {
      const result = await confirmIncomingReceiptAction(null, fd);
      if (result?.error) setError(result.error);
    });
  }

  const numInputClass =
    "w-[72px] h-[30px] border border-gray-200 rounded-md px-2 text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold text-gray-800">Stock In</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Voucher</p>
        </div>

        {/* Warehouse badge */}
        <div className="flex items-center gap-3 mb-8 px-4 py-3 bg-purple-50 border border-purple-100 rounded-lg w-fit">
          <Building2 className="w-4 h-4 text-[#9747FF]" />
          <span className="text-[13px] text-[#9747FF] font-medium">Warehouse: {warehouseName}</span>
        </div>

        <div className="flex gap-8">
          {/* Left column — Full/Partial/Empty inputs + Reserved/Damaged */}
          <div className="flex-shrink-0 w-[220px] pt-2 space-y-5">

            {/* Full / Partial / Empty */}
            <div className="space-y-2.5">
              {[
                { label: "Full", value: fullQty, set: setFullQty },
                { label: "Partial", value: partialQty, set: setPartialQty },
                { label: "Empty", value: emptyQty, set: setEmptyQty },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    readOnly
                    checked={!!(parseInt(value) > 0)}
                    className="w-3.5 h-3.5 accent-[#9747FF] pointer-events-none"
                  />
                  <span className="text-[13px] text-gray-600 w-[52px]">{label}</span>
                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder="0"
                    className={numInputClass}
                  />
                </div>
              ))}
            </div>

            {/* Reserved / Damaged */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReserved(!isReserved)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 h-[30px] rounded-md text-[12px] font-medium border transition-colors",
                    isReserved
                      ? "bg-[#9747FF] text-white border-[#9747FF]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#9747FF]"
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
                      : "bg-white text-gray-500 border-gray-200 hover:border-red-400"
                  )}
                >
                  {isDamaged ? "Yes" : "No"}
                </button>
                <span className="text-[13px] text-gray-600">Damaged</span>
              </div>
            </div>
          </div>

          {/* Right column — form fields */}
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
                        : "border-gray-200 text-gray-700"
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
                            {v.supplierName ?? "No supplier"} · {v.items.length} product{v.items.length !== 1 ? "s" : ""}
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

            {/* Auto-populated supplier info */}
            {selectedVoucher && (
              <>
                <div className="flex items-center gap-4">
                  <span className="text-[12px] font-medium text-gray-400 w-[150px] text-right">Supplier</span>
                  <span className="text-[13px] text-gray-600 flex-1">
                    {selectedVoucher.supplierName ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[12px] font-medium text-gray-400 w-[150px] text-right">Supplier Reference</span>
                  <span className="text-[13px] text-gray-600 flex-1">
                    {selectedVoucher.supplierReference ?? "—"}
                  </span>
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
                      !date ? "text-gray-300" : "text-gray-700"
                    )}
                  >
                    {date ? format(date, "PPP") : "Type in here"}
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Shelf Location */}
            <div className="flex items-center gap-4">
              <label className="text-[12px] font-medium text-amber-600 w-[150px] text-right">
                Shelves <span className="text-red-500">*</span>
              </label>
              <Select value={shelfLocationId} onValueChange={(v) => v && setShelfLocationId(v)}>
                <SelectTrigger className="flex-1 max-w-[280px] h-[36px] border-gray-200 text-[13px] text-gray-400 focus:ring-[#9747FF] focus:border-[#9747FF]">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px]">
                  {shelfLocations.length === 0 ? (
                    <div className="px-3 py-2 text-[13px] text-gray-400">No locations found</div>
                  ) : (
                    shelfLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id} className="text-[13px]">
                        {loc.locationCode}
                        <span className="ml-2 text-[11px] text-gray-400">
                          ({loc.currentStock} units{loc.maxCapacity ? ` / ${loc.maxCapacity}` : ""})
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedShelf && (
              <div className="flex items-center gap-4">
                <span className="w-[150px]" />
                <span className="text-[11px] text-gray-400">
                  Current stock: <span className="font-medium text-gray-600">{selectedShelf.currentStock}</span>
                  {selectedShelf.maxCapacity ? ` of ${selectedShelf.maxCapacity} capacity` : ""}
                </span>
              </div>
            )}

            {/* Change voucher */}
            {selectedVoucher && (
              <div className="flex items-center gap-4">
                <span className="w-[150px]" />
                <button
                  type="button"
                  onClick={handleClearVoucher}
                  className="text-[11px] text-red-400 hover:text-red-600 underline"
                >
                  Change voucher
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Products table — read-only */}
        {selectedVoucher && (
          <div className="mt-10 border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-white px-4 py-2.5 border-b border-gray-100">
              <span className="text-[12px] text-gray-400">
                Products · {selectedVoucher.referenceNumber}
              </span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#4A0E78] text-white">
                  <th className="px-4 py-2.5 text-[11px] font-medium text-left w-12">#</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-left">Product</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-left w-36">Product Code</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-right w-32">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {selectedVoucher.items.map((item, i) => (
                  <tr key={item.productId} className="border-b border-gray-100 bg-white last:border-0">
                    <td className="px-4 py-2.5 text-[12px] text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 text-[13px] text-gray-700">{item.productName}</td>
                    <td className="px-4 py-2.5 text-[12px] text-gray-500">{item.productCode}</td>
                    <td className="px-4 py-2.5 text-[13px] text-gray-700 text-right">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

        {/* Action Buttons */}
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
            disabled={isPending || !selectedVoucher}
            className="bg-[#9747FF] text-white hover:bg-[#7C3AED] text-[13px] font-medium px-6 h-[36px] rounded-md disabled:opacity-60"
          >
            {isPending ? "Confirming…" : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
