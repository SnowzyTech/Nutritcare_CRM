"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, ArrowUpDown, ChevronDown, MessageCircle, ArrowLeft } from "lucide-react";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";
const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

export default function CreateStockTransferPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    source: "",
    target: "",
    date: "",
    reference: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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
        Back to Stock Transfer
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
          <h1 className="text-2xl font-bold text-gray-900">Stock Transfer</h1>
          <p className="text-sm text-gray-400 mt-0.5">Voucher</p>
        </div>

        {/* Right: Form fields */}
        <div className="space-y-4">
          {/* Source Warehouse/Agent* */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-56 shrink-0">
              Source Warehouse/Agent *
            </label>
            <div className="relative flex-1">
              <select
                name="source"
                value={form.source}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="" disabled>Select an Option</option>
                <option value="pamtech">PAMTECH</option>
                <option value="owerri">Owerri, Oricho</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Target Warehouse/Agent* */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-56 shrink-0">
              Target Warehouse /Agent*
            </label>
            <div className="relative flex-1">
              <select
                name="target"
                value={form.target}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="" disabled>Select an Option</option>
                <option value="austin">AUSTIN</option>
                <option value="imo">Owerri, Imo</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Date* */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-56 shrink-0">
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

          {/* Transfer Reference* */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-56 shrink-0">
              Transfer Reference*
            </label>
            <div className="relative flex-1">
              <select
                name="reference"
                value={form.reference}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="" disabled>Select an Option</option>
                <option value="12345">12345</option>
                <option value="12346">12346</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
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
          className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-gray-300 hover:bg-gray-400 transition-colors"
        >
          Save Draft
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
