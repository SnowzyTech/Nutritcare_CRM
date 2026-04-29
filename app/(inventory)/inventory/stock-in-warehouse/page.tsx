"use client";

import React, { useState } from "react";
import {
  Filter,
  Search,
  MessageCircle,
  ChevronDown,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockLeftInOffice = [
  { id: 16, productName: "Proxact", warehouse: "Lagos HQ", qtyRecorded: 110, qtyLeft: 30 },
  { id: 32, productName: "Shred Belly", warehouse: "Abuja Warehouse", qtyRecorded: 52, qtyLeft: 25 },
  { id: 42, productName: "Balm", warehouse: "Port Harcourt Depot", qtyRecorded: 45, qtyLeft: 40 },
  { id: 2, productName: "Trim & Tone", warehouse: "Lagos HQ", qtyRecorded: 67, qtyLeft: 10 },
  { id: 23, productName: "Vitorep", warehouse: "Kano Store", qtyRecorded: 98, qtyLeft: 5 },
  { id: 322, productName: "Balm", warehouse: "Enugu Hub", qtyRecorded: 30, qtyLeft: 15 },
  { id: 98, productName: "Shred Belly", warehouse: "Lagos HQ", qtyRecorded: 52, qtyLeft: 25 },
  { id: 65, productName: "Balm", warehouse: "Abuja Warehouse", qtyRecorded: 45, qtyLeft: 40 },
  { id: 10, productName: "Trim & Tone", warehouse: "Port Harcourt Depot", qtyRecorded: 87, qtyLeft: 10 },
  { id: 13, productName: "Balm", warehouse: "Kano Store", qtyRecorded: 96, qtyLeft: 5 },
];

export default function StockLeftInOfficePage() {
  const [search, setSearch] = useState("");
  const [actionLabel, setActionLabel] = useState("");

  const filtered = mockLeftInOffice.filter((r) =>
    r.productName.toLowerCase().includes(search.toLowerCase()) ||
    r.warehouse.toLowerCase().includes(search.toLowerCase())
  );

  const thClass = "text-center text-[11px] font-semibold text-gray-500 py-3 px-4 whitespace-nowrap";
  const tdClass = "text-center text-[12px] text-gray-600 py-3 px-4 whitespace-nowrap";

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col relative pb-10">
      {/* Floating Chat Icon */}
      <button className="absolute -top-4 right-0 w-12 h-12 bg-[#F6E8FF] rounded-full flex items-center justify-center text-[#9D00FF] shadow-sm hover:bg-[#ebd5fa] transition-colors z-50">
        <MessageCircle className="w-6 h-6 fill-current" />
      </button>

      {/* Top Toolbar */}
      <div className="flex items-center justify-between mb-6">
        {/* Left Side: Select Action */}
        <div className="flex items-center gap-3">
          <div className="relative w-36">
            <select
              value={actionLabel}
              onChange={(e) => setActionLabel(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-[13px] text-gray-400 appearance-none bg-white outline-none focus:border-[#9D00FF] cursor-pointer"
            >
              <option value="" disabled>Select Action</option>
              <option value="export">Export</option>
              <option value="delete">Delete</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <button className="px-5 py-1.5 rounded-md text-[13px] font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors">
            Go
          </button>
        </div>

        {/* Right Side: Search & Filter */}
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-1.5 bg-white w-64">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder=""
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm text-gray-600 bg-transparent w-full"
            />
          </div>

          {/* Clear Button */}
          <button
            onClick={() => setSearch("")}
            className="px-6 py-1.5 rounded-md text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>

          {/* Filter */}
          <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#9D00FF] transition-colors ml-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full border border-gray-100 rounded-md overflow-x-auto bg-white shadow-sm mb-6">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr style={{ backgroundColor: "#F9F6FC" }}>
              <th className="py-3 pl-4 pr-2 w-10 text-left">
                <input type="checkbox" className="accent-[#9D00FF]" />
              </th>
              <th className={thClass}>ID</th>
              <th className={thClass}>Product Name</th>
              <th className={thClass}>Warehouse</th>
              <th className={thClass}>Quantity Recorded</th>
              <th className={thClass}>Qty Left</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors">
                <td className="py-3 pl-4 pr-2 w-10 text-left">
                  <input type="checkbox" className="accent-[#9D00FF]" />
                </td>
                <td className={tdClass}>{row.id}</td>
                <td className={tdClass}>{row.productName}</td>
                <td className={tdClass}>{row.warehouse}</td>
                <td className={tdClass}>{row.qtyRecorded}</td>
                <td className={tdClass}>{row.qtyLeft}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-2">
        <button className="px-4 py-1.5 rounded-md text-[13px] font-semibold text-white bg-gray-300 cursor-not-allowed">
          Previous
        </button>
        <button className="px-4 py-1.5 rounded-md text-[13px] font-semibold text-white bg-[#9D00FF]">
          1
        </button>
        <button className="px-6 py-1.5 rounded-md text-[13px] font-semibold text-white bg-gray-300 cursor-not-allowed">
          Next
        </button>
      </div>
    </div>
  );
}
