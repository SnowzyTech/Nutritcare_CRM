"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, ArrowUpDown, ChevronDown, ArrowLeft, MessageCircle, Check } from "lucide-react";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";
const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

export default function CreateReturnedStockPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    state: "",
    country: "",
    date: "",
    product: "",
    quantity: "",
    agent: "",
    remarks: "",
    notes: "",
  });

  const [isDamaged, setIsDamaged] = useState(false);

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
        Back to Returned Stock
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
          <h1 className="text-2xl font-bold text-gray-900">Returned Stock</h1>
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

          {/* Custom Checkbox - Damaged */}
          <div className="flex items-center gap-3 py-3">
            <button
              type="button"
              onClick={() => setIsDamaged(!isDamaged)}
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                isDamaged 
                  ? "border-[#9D00FF] text-[#9D00FF]" 
                  : "border-gray-300 text-transparent"
              }`}
            >
              {isDamaged && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </button>
            <span className="text-[15px] text-gray-900 font-medium">
              Damaged
            </span>
          </div>

          {/* Conditionally Rendered Reason for Damage */}
          {isDamaged && (
            <div className="flex items-center gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
              <label className="text-sm font-bold text-gray-800 w-48 shrink-0">
                Reason for Damage*
              </label>
              <input
                type="text"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Briefly describe the damage..."
                className={`${inputClass} flex-1 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20`}
              />
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-bold text-gray-800 w-48 shrink-0">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              placeholder="Type in here"
              className={`${inputClass} flex-1`}
            />
          </div>

          {/* Agent */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-bold text-gray-800 w-48 shrink-0">
              Agent
            </label>
            <div className="relative flex-1">
              <select
                name="agent"
                value={form.agent}
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
