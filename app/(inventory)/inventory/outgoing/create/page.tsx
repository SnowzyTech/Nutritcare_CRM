"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, ArrowUpDown, ChevronDown, ArrowLeft, Plus, MessageCircle, Check, Trash2 } from "lucide-react";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";
const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

export default function CreateOutgoingPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    state: "",
    country: "",
    date: "",
    product: "",
    supplierReference: "",
    toAgent: "",
    quantityToSend: "",
    notes: "",
  });

  const [isAgentToAgent, setIsAgentToAgent] = useState(false);
  const [bulks, setBulks] = useState<{ id: number; product: string; quantity: string }[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddBulk = () => {
    setBulks((prev) => [...prev, { id: Date.now(), product: "", quantity: "" }]);
  };

  const handleRemoveBulk = (id: number) => {
    setBulks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleBulkChange = (id: number, field: "product" | "quantity", value: string) => {
    setBulks((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-10 relative">
      {/* Floating Chat Icon */}
      <button className="absolute -top-4 right-0 w-12 h-12 bg-[#F6E8FF] rounded-full flex items-center justify-center text-[#9D00FF] shadow-sm hover:bg-[#ebd5fa] transition-colors z-50">
        <MessageCircle className="w-6 h-6 fill-current" />
      </button>

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#9D00FF] transition-colors mb-5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Outgoing Stock
      </button>

      {/* Toolbar */}
      <div className="flex items-center gap-5 mb-8">
        <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-[#9D00FF] transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* Two-column layout: title left, form right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left: Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Out</h1>
          <p className="text-sm text-gray-400 mt-0.5">Voucher</p>
        </div>

        {/* Right: Form fields */}
        <div className="space-y-4">
          {/* State* */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-48 shrink-0">
              State*
            </label>
            <div className="relative flex-1">
              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="" disabled>Select an Option</option>
                <option value="lagos">Lagos</option>
                <option value="abuja">Abuja</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Country* */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-48 shrink-0">
              Country*
            </label>
            <div className="relative flex-1">
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="" disabled>Select an Option</option>
                <option value="nigeria">Nigeria</option>
                <option value="ghana">Ghana</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Date* */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-48 shrink-0">
              Date*
            </label>
            <input
              type="text"
              name="date"
              value={form.date}
              onChange={handleChange}
              placeholder="Type in here"
              className={`${inputClass} flex-1`}
            />
          </div>

          {/* Product* */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-48 shrink-0">
              Product*
            </label>
            <div className="relative flex-1">
              <select
                name="product"
                value={form.product}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="" disabled>Select an Option</option>
                <option value="balm">Balm</option>
                <option value="shred_belly">Shred Belly</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Custom Checkbox */}
          <div className="flex items-center gap-3 py-3">
            <button
              type="button"
              onClick={() => setIsAgentToAgent(!isAgentToAgent)}
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                isAgentToAgent 
                  ? "border-[#9D00FF] text-[#9D00FF]" 
                  : "border-gray-300 text-transparent"
              }`}
            >
              {isAgentToAgent && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </button>
            <span className="text-sm text-gray-800 font-medium">
              Are you sending this product from one Agent to another Agent?
            </span>
          </div>

          {/* Supplier Reference */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-bold text-gray-800 w-48 shrink-0">
              Supplier Reference
            </label>
            <input
              type="text"
              name="supplierReference"
              value={form.supplierReference}
              onChange={handleChange}
              placeholder="Type in here"
              className={`${inputClass} flex-1`}
            />
          </div>

          {/* To Agent */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-bold text-gray-800 w-48 shrink-0">
              To Agent
            </label>
            <div className="relative flex-1">
              <select
                name="toAgent"
                value={form.toAgent}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="" disabled>Select an Option</option>
                <option value="john">John</option>
                <option value="austin">Austin</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Quantity To Send */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-bold text-gray-800 w-48 shrink-0">
              Quantity To Send
            </label>
            <input
              type="number"
              name="quantityToSend"
              value={form.quantityToSend}
              onChange={handleChange}
              placeholder="Type in here"
              className={`${inputClass} flex-1`}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 my-8" />

      {/* Dynamic Bulks */}
      {bulks.length > 0 && (
        <div className="mb-6 space-y-6">
          {bulks.map((bulk, index) => (
            <div key={bulk.id} className="space-y-4 relative group">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Additional Item {index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBulk(bulk.id)}
                  className="p-1 text-red-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-amber-500 w-48 shrink-0">
                  Product*
                </label>
                <div className="relative flex-1">
                  <select
                    value={bulk.product}
                    onChange={(e) => handleBulkChange(bulk.id, "product", e.target.value)}
                    className={selectClass}
                  >
                    <option value="" disabled>Select an Option</option>
                    <option value="balm">Balm</option>
                    <option value="shred_belly">Shred Belly</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm font-bold text-gray-800 w-48 shrink-0">
                  Quantity To Send
                </label>
                <input
                  type="number"
                  value={bulk.quantity}
                  onChange={(e) => handleBulkChange(bulk.id, "quantity", e.target.value)}
                  placeholder="Type in here"
                  className={`${inputClass} flex-1`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Bulks */}
      <div className="mb-8">
        <button
          type="button"
          onClick={handleAddBulk}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Bulks
        </button>
      </div>

      <div className="border-t border-gray-100 my-8" />

      {/* Notes */}
      <div className="mb-8">
        <label className="block text-xs font-semibold text-gray-800 mb-2">Notes</label>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Type in here"
            rows={4}
            className="w-full px-4 py-3 text-sm text-gray-600 placeholder:text-gray-300 outline-none resize-none bg-white"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-md text-sm font-semibold text-gray-500 bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => router.back()}
          className="px-7 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
