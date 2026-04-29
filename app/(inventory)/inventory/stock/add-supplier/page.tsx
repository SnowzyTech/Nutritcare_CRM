"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";

const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

const labelClass = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";

export default function AddSupplierPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    supplierName: "",
    phone1: "",
    phone2: "",
    state: "",
    address: "",
    country: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleReset = () => {
    setForm({
      supplierName: "",
      phone1: "",
      phone2: "",
      state: "",
      address: "",
      country: "",
    });
  };

  const handleAdd = () => {
    // TODO: wire to API
    router.back();
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#9D00FF] transition-colors mb-5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Stock
      </button>

      {/* Outer card matching mockup */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        {/* Header row */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Supplier</h1>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">New</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-md text-sm font-semibold text-gray-500 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleAdd}
              className="px-7 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Form Grid */}
        <div className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Suppliere&apos;s Name</label>
              <input
                type="text"
                name="supplierName"
                value={form.supplierName}
                onChange={handleChange}
                placeholder="Type in here"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Supplier&apos;s Phone Number</label>
              <input
                type="tel"
                name="phone1"
                value={form.phone1}
                onChange={handleChange}
                placeholder="Phone Number MUST be unique, for each agent"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Supplier&apos;s Phone Number 2</label>
              <input
                type="tel"
                name="phone2"
                value={form.phone2}
                onChange={handleChange}
                placeholder="Type in here"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="Type in here"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Suppliers Address</label>
              <div className="relative">
                <select
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="" disabled>Select an Option</option>
                  <option value="owerri">Owerri</option>
                  <option value="lagos">Lagos</option>
                  <option value="abuja">Abuja</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ▾
                </span>
              </div>
            </div>
            <div>
              <label className={labelClass}>Select Country</label>
              <div className="relative">
                <select
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="" disabled>Select an Option</option>
                  <option value="nigeria">Nigeria</option>
                  <option value="ghana">Ghana</option>
                  <option value="kenya">Kenya</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ▾
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
