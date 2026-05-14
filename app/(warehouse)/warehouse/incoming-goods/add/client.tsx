"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarIcon, ChevronDown, Filter, ArrowUpDown, ArrowLeft, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { FormSupplier, FormProduct } from "@/modules/warehouse/services/warehouse.service";
import { createIncomingMovementAction } from "@/modules/warehouse/actions/incoming.action";

type ProductRow = {
  rowId: number;
  productId: string;
  productName: string;
  productCode: string;
  quantity: string;
};

type ShelfLocation = { id: string; locationCode: string };

interface Props {
  suppliers: FormSupplier[];
  products: FormProduct[];
  warehouseName: string;
  shelfLocations: ShelfLocation[];
}

export default function AddIncomingGoodsClient({ suppliers, products, warehouseName, shelfLocations }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [supplierId, setSupplierId] = useState("");
  const [supplierRef, setSupplierRef] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");

  const [shelfLocationId, setShelfLocationId] = useState("");
  const [shelfQuantity, setShelfQuantity] = useState("");
  const [isReserved, setIsReserved] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);

  const [productRows, setProductRows] = useState<ProductRow[]>([
    { rowId: 1, productId: "", productName: "", productCode: "", quantity: "" },
  ]);
  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSelectProduct = (product: FormProduct, index: number) => {
    const updated = [...productRows];
    updated[index] = { ...updated[index], productId: product.id, productName: product.name, productCode: product.sku };
    setProductRows(updated);
    setProductSearch("");
    setShowDropdown(false);
    setActiveRowIndex(null);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updated = [...productRows];
    updated[index] = { ...updated[index], quantity: value };
    setProductRows(updated);
  };

  const addProductRow = () => {
    setProductRows([
      ...productRows,
      { rowId: productRows.length + 1, productId: "", productName: "", productCode: "", quantity: "" },
    ]);
  };

  const removeProductRow = (index: number) => {
    if (productRows.length <= 1) return;
    setProductRows(productRows.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validItems = productRows.filter(
      (r) => r.productId && r.quantity && parseInt(r.quantity) > 0
    );

    if (!date) return setError("Date is required");
    if (validItems.length === 0) return setError("At least one product with quantity is required");

    const fd = new FormData();
    if (supplierId) fd.set("supplierId", supplierId);
    fd.set("supplierReference", supplierRef);
    fd.set("date", date.toISOString());
    fd.set("notes", notes);
    if (shelfLocationId) fd.set("shelfLocationId", shelfLocationId);
    if (shelfQuantity) fd.set("shelfQuantity", shelfQuantity);
    fd.set("isReserved", isReserved ? "true" : "false");
    fd.set("isDamaged", isDamaged ? "true" : "false");
    fd.set(
      "items",
      JSON.stringify(validItems.map((r) => ({ productId: r.productId, quantity: parseInt(r.quantity) })))
    );

    startTransition(async () => {
      const result = await createIncomingMovementAction(null, fd);
      if (result?.error) setError(result.error);
    });
  };

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
        <div className="flex items-center gap-4 ml-auto">
          <button type="button" className="flex items-center gap-2 text-gray-500 text-[14px] font-medium hover:text-gray-700">
            <Filter className="w-[18px] h-[18px]" />
            Filter
          </button>
          <button type="button" className="text-gray-400 hover:text-gray-600">
            <ArrowUpDown className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold text-gray-800">Stock In</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Voucher</p>
        </div>

        {/* Warehouse badge — read-only */}
        <div className="flex items-center gap-3 mb-8 px-4 py-3 bg-purple-50 border border-purple-100 rounded-lg w-fit">
          <Building2 className="w-4 h-4 text-[#9747FF]" />
          <span className="text-[13px] text-[#9747FF] font-medium">Warehouse: {warehouseName}</span>
        </div>

        <div className="flex gap-12">
          {/* Left side spacer */}
          <div className="flex-shrink-0 w-8" />

          {/* Right — Form Fields */}
          <div className="flex-1 space-y-5 max-w-[640px]">
            {/* Supplier */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-gray-500 w-[160px] text-right">
                Supplier
              </label>
              <Select value={supplierId} onValueChange={(v) => v && setSupplierId(v)}>
                <SelectTrigger className="w-full max-w-[320px] h-[36px] border-gray-200 text-[13px] text-gray-400 focus:ring-[#9747FF] focus:border-[#9747FF]">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px]">
                  {suppliers.length === 0 ? (
                    <div className="px-3 py-2 text-[13px] text-gray-400">No suppliers found</div>
                  ) : (
                    suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-[13px]">
                        {s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier Reference */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-gray-700 w-[160px] text-right">
                Supplier Reference
              </label>
              <input
                type="text"
                value={supplierRef}
                onChange={(e) => setSupplierRef(e.target.value)}
                placeholder="Type in here"
                className="w-full max-w-[320px] h-[36px] border border-gray-200 rounded-md px-3 text-[13px] text-gray-400 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF]"
              />
            </div>

            {/* Date */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-amber-600 w-[160px] text-right">
                Date<span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger>
                  <div
                    className={cn(
                      "w-full max-w-[320px] h-[36px] border border-gray-200 rounded-md px-3 text-[13px] flex items-center justify-between focus:outline-none cursor-pointer",
                      !date ? "text-gray-300" : "text-gray-700"
                    )}
                  >
                    {date ? format(date, "PPP") : "Select a date"}
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
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-gray-500 w-[160px] text-right">
                Shelf Location
              </label>
              <Select value={shelfLocationId} onValueChange={(v) => v && setShelfLocationId(v)}>
                <SelectTrigger className="w-full max-w-[320px] h-[36px] border-gray-200 text-[13px] text-gray-400 focus:ring-[#9747FF] focus:border-[#9747FF]">
                  <SelectValue placeholder="Select a shelf location" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px]">
                  {shelfLocations.length === 0 ? (
                    <div className="px-3 py-2 text-[13px] text-gray-400">No locations found</div>
                  ) : (
                    shelfLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id} className="text-[13px]">
                        {loc.locationCode}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Shelf Quantity */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-gray-700 w-[160px] text-right">
                Shelf Quantity
              </label>
              <input
                type="number"
                min="0"
                value={shelfQuantity}
                onChange={(e) => setShelfQuantity(e.target.value)}
                placeholder="0"
                className="w-full max-w-[320px] h-[36px] border border-gray-200 rounded-md px-3 text-[13px] text-gray-500 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Reserved */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-gray-700 w-[160px] text-right">
                Reserved
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsReserved(true)}
                  className={cn(
                    "px-5 h-[36px] rounded-md text-[12px] font-medium border transition-colors",
                    isReserved
                      ? "bg-[#9747FF] text-white border-[#9747FF]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#9747FF]"
                  )}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsReserved(false)}
                  className={cn(
                    "px-5 h-[36px] rounded-md text-[12px] font-medium border transition-colors",
                    !isReserved
                      ? "bg-[#9747FF] text-white border-[#9747FF]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#9747FF]"
                  )}
                >
                  No
                </button>
              </div>
            </div>

            {/* Damaged */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-gray-700 w-[160px] text-right">
                Damaged
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsDamaged(true)}
                  className={cn(
                    "px-5 h-[36px] rounded-md text-[12px] font-medium border transition-colors",
                    isDamaged
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-red-400"
                  )}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsDamaged(false)}
                  className={cn(
                    "px-5 h-[36px] rounded-md text-[12px] font-medium border transition-colors",
                    !isDamaged
                      ? "bg-[#9747FF] text-white border-[#9747FF]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#9747FF]"
                  )}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="mt-10 border border-gray-200 rounded-lg shadow-sm overflow-visible">
          <div className="bg-white px-4 py-2.5 border-b border-gray-100">
            <span className="text-[12px] text-gray-400">Products</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-[#4A0E78] text-white">
                <th className="px-4 py-2.5 text-[11px] font-medium text-left w-12">#</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-left">Product</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-left w-36">Product Code</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-right w-32">Quantity</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-center w-16"></th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((row, index) => (
                <tr key={row.rowId} className="border-b border-gray-100 bg-white">
                  <td className="px-4 py-2.5 text-[12px] text-gray-500">{index + 1}</td>
                  <td className="px-2 py-2.5 relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={row.productName || (activeRowIndex === index ? productSearch : "")}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setActiveRowIndex(index);
                          setShowDropdown(true);
                          const updated = [...productRows];
                          updated[index] = { ...updated[index], productId: "", productName: "", productCode: "" };
                          setProductRows(updated);
                        }}
                        onFocus={() => {
                          setActiveRowIndex(index);
                          setShowDropdown(true);
                        }}
                        placeholder="Search for a Product"
                        className="w-full h-[32px] border border-gray-200 rounded-md px-3 text-[12px] text-gray-500 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF]"
                      />
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {showDropdown && activeRowIndex === index && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="px-3 py-2 text-[12px] text-gray-400">No products found</div>
                        ) : (
                          filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onMouseDown={() => handleSelectProduct(p, index)}
                              className="w-full text-left px-3 py-2 text-[12px] text-gray-600 hover:bg-purple-50 transition-colors"
                            >
                              {p.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-500">{row.productCode || "—"}</td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      placeholder="0"
                      className="w-full h-[32px] border border-gray-200 rounded-md px-3 text-[12px] text-gray-500 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {productRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProductRow(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <button
              type="button"
              onClick={addProductRow}
              className="text-[12px] text-[#9747FF] font-medium hover:underline"
            >
              + Add Product
            </button>
          </div>
        </div>

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
          <Button
            type="button"
            onClick={() => router.push("/warehouse/incoming-goods")}
            className="bg-gray-200 text-gray-600 hover:bg-gray-300 text-[13px] font-medium px-5 h-[36px] rounded-md"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#9747FF] text-white hover:bg-[#7C3AED] text-[13px] font-medium px-6 h-[36px] rounded-md disabled:opacity-60"
          >
            {isPending ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
