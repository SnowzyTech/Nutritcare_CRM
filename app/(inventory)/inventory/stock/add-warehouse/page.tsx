"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";

const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

const labelClass =
  "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";

export default function AddWarehousePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    warehouseName: "",
    warehouseAddress: "",
    warehousePhone: "",
    warehouseEmail: "",
    moreInformation: "",
    country: "",
    managerName: "",
    managerTelephone: "",
    managerEmail: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClose = () => router.back();
  const handleSubmit = () => {
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

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Warehouse</h1>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">New</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-md text-sm font-semibold text-gray-500 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSubmit}
              className="px-7 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Warehouse Name</label>
              <input
                type="text"
                name="warehouseName"
                value={form.warehouseName}
                onChange={handleChange}
                placeholder="Type in here"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Warehouse Address</label>
              <input
                type="text"
                name="warehouseAddress"
                value={form.warehouseAddress}
                onChange={handleChange}
                placeholder="Phone Number MUST be unique, for each agent"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Warehouse Phone Number</label>
              <input
                type="tel"
                name="warehousePhone"
                value={form.warehousePhone}
                onChange={handleChange}
                placeholder="Type in here"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Warehouse Email</label>
              <input
                type="email"
                name="warehouseEmail"
                value={form.warehouseEmail}
                onChange={handleChange}
                placeholder="Type in here"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>More Information</label>
              <div className="relative">
                <select
                  name="moreInformation"
                  value={form.moreInformation}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="" disabled>Select an Option</option>
                  <option value="main">Main Warehouse</option>
                  <option value="secondary">Secondary Warehouse</option>
                  <option value="transit">Transit Hub</option>
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

          {/* Row 4 — Manager Name (half width) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Warehouse Managers Name</label>
              <input
                type="text"
                name="managerName"
                value={form.managerName}
                onChange={handleChange}
                placeholder="Type in here"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 5 — Manager Telephone (half width) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Warehouse Managers Telephone</label>
              <input
                type="tel"
                name="managerTelephone"
                value={form.managerTelephone}
                onChange={handleChange}
                placeholder="Type in here"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 6 — Manager Email (half width) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Warehouse Managers Email</label>
              <input
                type="email"
                name="managerEmail"
                value={form.managerEmail}
                onChange={handleChange}
                placeholder="Type in here"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
