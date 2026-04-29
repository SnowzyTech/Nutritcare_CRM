"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";

const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

const labelClass = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";

export default function AddAgentPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    companyAgentName: "",
    address: "",
    status: "",
    phone1: "",
    phone2: "",
    phone3: "",
    picksFromOffice: "",
    country: "",
    statesCovered: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleReset = () => {
    setForm({
      companyAgentName: "",
      address: "",
      status: "",
      phone1: "",
      phone2: "",
      phone3: "",
      picksFromOffice: "",
      country: "",
      statesCovered: "",
    });
  };

  const handleSave = () => {
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

      {/* Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        {/* Header row */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Agent</h1>
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
              onClick={handleSave}
              className="px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors"
            >
              Save agent
            </button>
          </div>
        </div>

        {/* Form Grid */}
        <div className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Company/Agents Name</label>
              <input
                type="text"
                name="companyAgentName"
                value={form.companyAgentName}
                onChange={handleChange}
                placeholder="Type in here"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Type in here"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <div className="relative">
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="" disabled>Select an Option</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ▾
                </span>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Phone 1 (No Country Code)</label>
              <input
                type="tel"
                name="phone1"
                value={form.phone1}
                onChange={handleChange}
                placeholder="Phone Number MUST be unique, for each agent"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone 2</label>
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
              <label className={labelClass}>Phone 3</label>
              <input
                type="tel"
                name="phone3"
                value={form.phone3}
                onChange={handleChange}
                placeholder="Type in here"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Does this agent pick product from office stock?</label>
              <div className="relative">
                <select
                  name="picksFromOffice"
                  value={form.picksFromOffice}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="" disabled>Select an Option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
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
            <div>
              <label className={labelClass}>Select States Covered by Agent</label>
              <input
                type="text"
                name="statesCovered"
                value={form.statesCovered}
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
