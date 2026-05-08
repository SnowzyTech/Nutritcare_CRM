"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CalendarIcon, ChevronDown, Filter, ArrowUpDown, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const warehouses = [
  "Pamtech",
  "Abuja Warehouse",
  "Lagos Warehouse",
  "Owerri Warehouse",
  "Kano Warehouse",
  "Enugu Warehouse",
];

const suppliers = [
  "Austin",
  "NutriLabs Ltd",
  "FitPharma Co.",
  "WellSource Inc.",
  "MegaVita Corp.",
  "HealthFirst Supplies",
];

const shelves = [
  "A1", "A2", "A3", "A4", "A5", "A6",
  "B1", "B2", "B3", "B4", "B5", "B6",
  "C1", "C2", "C3", "C4", "C5", "C6",
  "D1", "D2", "D3", "D4", "D5", "D6",
];

const mockProducts = [
  { name: "NutriShake Vanilla", code: "NS-VAN-001" },
  { name: "NutriShake Chocolate", code: "NS-CHO-002" },
  { name: "Trim & Tone", code: "TT-001" },
  { name: "Balm Recovery", code: "BR-001" },
  { name: "Shred Belly", code: "SB-001" },
  { name: "Protein Plus", code: "PP-001" },
];

type ProductRow = {
  id: number;
  product: string;
  productCode: string;
  quantity: string;
};

export default function AddIncomingGoodsClient() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [warehouse, setWarehouse] = useState("");
  const [supplier, setSupplier] = useState("");
  const [supplierRef, setSupplierRef] = useState("");
  const [shelve, setShelve] = useState("");
  const [notes, setNotes] = useState("");
  const [reserved, setReserved] = useState(false);
  const [damaged, setDamaged] = useState(false);
  const [fullCount, setFullCount] = useState<string>("");
  const [partialCount, setPartialCount] = useState<string>("");
  const [emptyCount, setEmptyCount] = useState<string>("");
  const [products, setProducts] = useState<ProductRow[]>([
    { id: 1, product: "", productCode: "", quantity: "" },
  ]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState<number | null>(null);

  const filteredProducts = mockProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSelectProduct = (product: typeof mockProducts[0], index: number) => {
    const updated = [...products];
    updated[index] = { ...updated[index], product: product.name, productCode: product.code };
    setProducts(updated);
    setProductSearch("");
    setShowProductDropdown(false);
    setActiveProductIndex(null);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updated = [...products];
    updated[index] = { ...updated[index], quantity: value };
    setProducts(updated);
  };

  const addProductRow = () => {
    setProducts([...products, { id: products.length + 1, product: "", productCode: "", quantity: "" }]);
  };

  const removeProductRow = (index: number) => {
    if (products.length <= 1) return;
    setProducts(products.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white min-h-screen">
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
          <button className="flex items-center gap-2 text-gray-500 text-[14px] font-medium hover:text-gray-700">
            <Filter className="w-[18px] h-[18px]" />
            Filter
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <ArrowUpDown className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold text-gray-800">Stock In</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Voucher</p>
        </div>

        <div className="flex gap-12">
          {/* Left Side - Condition & Toggles */}
          <div className="flex-shrink-0 space-y-4 pt-2">
            {/* Condition Inputs */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={fullCount}
                  onChange={(e) => setFullCount(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-[60px] h-[32px] border border-gray-200 rounded px-2 text-[12px] text-gray-600 text-center placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[12px] font-medium text-gray-600">Full</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={partialCount}
                  onChange={(e) => setPartialCount(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-[60px] h-[32px] border border-gray-200 rounded px-2 text-[12px] text-gray-600 text-center placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[12px] font-medium text-gray-600">Partial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={emptyCount}
                  onChange={(e) => setEmptyCount(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-[60px] h-[32px] border border-gray-200 rounded px-2 text-[12px] text-gray-600 text-center placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[12px] font-medium text-gray-600">Empty</span>
              </div>
            </div>

            {/* Reserved Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex border border-gray-200 rounded overflow-hidden">
                <button
                  onClick={() => setReserved(false)}
                  className={cn(
                    "px-3 py-1.5 text-[12px] font-medium transition-colors",
                    !reserved ? "bg-[#9747FF] text-white" : "bg-white text-gray-500"
                  )}
                >
                  No
                </button>
                <button
                  onClick={() => setReserved(true)}
                  className={cn(
                    "px-3 py-1.5 text-[12px] font-medium transition-colors",
                    reserved ? "bg-[#9747FF] text-white" : "bg-white text-gray-500"
                  )}
                >
                  Yes
                </button>
              </div>
              <span className="text-[13px] text-gray-600">Reserved</span>
            </div>

            {/* Damaged Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex border border-gray-200 rounded overflow-hidden">
                <button
                  onClick={() => setDamaged(false)}
                  className={cn(
                    "px-3 py-1.5 text-[12px] font-medium transition-colors",
                    !damaged ? "bg-[#9747FF] text-white" : "bg-white text-gray-500"
                  )}
                >
                  No
                </button>
                <button
                  onClick={() => setDamaged(true)}
                  className={cn(
                    "px-3 py-1.5 text-[12px] font-medium transition-colors",
                    damaged ? "bg-[#9747FF] text-white" : "bg-white text-gray-500"
                  )}
                >
                  Yes
                </button>
              </div>
              <span className="text-[13px] text-gray-600">Damaged</span>
            </div>
          </div>

          {/* Right Side - Form Fields */}
          <div className="flex-1 space-y-5">
            {/* Warehouse */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-amber-600 w-[160px] text-right">
                Warehouse<span className="text-red-500">*</span>
              </label>
              <Select value={warehouse} onValueChange={(v) => v && setWarehouse(v)}>
                <SelectTrigger className="w-full max-w-[320px] h-[36px] border-gray-200 text-[13px] text-gray-400 focus:ring-[#9747FF] focus:border-[#9747FF]">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w} value={w} className="text-[13px]">
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-gray-500 w-[160px] text-right">
                Supplier
              </label>
              <Select value={supplier} onValueChange={(v) => v && setSupplier(v)}>
                <SelectTrigger className="w-full max-w-[320px] h-[36px] border-gray-200 text-[13px] text-gray-400 focus:ring-[#9747FF] focus:border-[#9747FF]">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s} value={s} className="text-[13px]">
                      {s}
                    </SelectItem>
                  ))}
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
                      "w-full max-w-[320px] h-[36px] border border-gray-200 rounded-md px-3 text-[13px] flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] cursor-pointer",
                      !date && "text-gray-400"
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

            {/* Shelves */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-amber-600 w-[160px] text-right">
                Shelves<span className="text-red-500">*</span>
              </label>
              <Select value={shelve} onValueChange={(v) => v && setShelve(v)}>
                <SelectTrigger className="w-full max-w-[320px] h-[36px] border-gray-200 text-[13px] text-gray-400 focus:ring-[#9747FF] focus:border-[#9747FF]">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent>
                  {shelves.map((s) => (
                    <SelectItem key={s} value={s} className="text-[13px]">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="mt-10 border border-gray-200 rounded-lg shadow-sm overflow-visible">
          <div className="bg-white px-4 py-2.5 border-b border-gray-100">
            <span className="text-[12px] text-gray-400">Product</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-[#4A0E78] text-white">
                <th className="px-4 py-2.5 text-[11px] font-medium text-left w-12">#</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-left">Product</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-left">Product Code</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-right w-32">Quantity</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-center w-16"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((row, index) => (
                <React.Fragment key={row.id}>
                  <tr className="border-b border-gray-100 bg-white">
                    <td className="px-4 py-2.5 text-[12px] text-gray-500">{index + 1}</td>
                    <td className="px-2 py-2.5 relative">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.product || (activeProductIndex === index ? productSearch : "")}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setActiveProductIndex(index);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => {
                            setActiveProductIndex(index);
                            setShowProductDropdown(true);
                          }}
                          placeholder="Search for a Product"
                          className="w-full h-[32px] border border-gray-200 rounded-md px-3 text-[12px] text-gray-500 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] pr-8"
                        />
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {showProductDropdown && activeProductIndex === index && (
                        <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                          {filteredProducts.map((p) => (
                            <button
                              key={p.code}
                              onClick={() => handleSelectProduct(p, index)}
                              className="w-full text-left px-3 py-2 text-[12px] text-gray-600 hover:bg-purple-50 transition-colors"
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-gray-500">{row.productCode || "-"}</td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        placeholder="0"
                        className="w-full h-[32px] border border-gray-200 rounded-md px-3 text-[12px] text-gray-500 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] text-right"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {products.length > 1 && (
                        <button
                          onClick={() => removeProductRow(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Remove product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <button
              onClick={addProductRow}
              className="text-[12px] text-[#9747FF] font-medium hover:underline"
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-8">
          <label className="text-[12px] font-medium text-gray-600 block mb-2">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type in here"
            className="w-full h-[80px] border border-gray-200 rounded-md px-3 py-2.5 text-[13px] text-gray-400 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-8">
          <Button
            className="bg-gray-200 text-gray-600 hover:bg-gray-300 text-[13px] font-medium px-5 h-[36px] rounded-md"
          >
            Save as Draft
          </Button>
          <Button
            className="bg-[#9747FF] text-white hover:bg-[#7C3AED] text-[13px] font-medium px-6 h-[36px] rounded-md"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
