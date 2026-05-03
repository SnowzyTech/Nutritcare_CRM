"use client";

import React, { useState } from "react";
import { Filter, Search, MessageCircle, ChevronDown } from "lucide-react";
import type { WarehouseStockRow } from "@/modules/inventory/services/inventory.service";

const thClass = "text-center text-[11px] font-semibold text-gray-500 py-3 px-4 whitespace-nowrap";
const tdClass = "text-center text-[12px] text-gray-600 py-3 px-4 whitespace-nowrap";

export function StockInWarehouseClient({ initialRows }: { initialRows: WarehouseStockRow[] }) {
  const [search, setSearch] = useState("");
  const [actionLabel, setActionLabel] = useState("");

  const filtered = initialRows.filter(
    (r) =>
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.warehouse.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col relative pb-10">
      <button className="absolute -top-4 right-0 w-12 h-12 bg-[#F6E8FF] rounded-full flex items-center justify-center text-[#9D00FF] shadow-sm hover:bg-[#ebd5fa] transition-colors z-50">
        <MessageCircle className="w-6 h-6 fill-current" />
      </button>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-1.5 bg-white w-64">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search product or warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm text-gray-600 bg-transparent w-full"
            />
          </div>
          <button
            onClick={() => setSearch("")}
            className="px-6 py-1.5 rounded-md text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
          <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#9D00FF] transition-colors ml-2">
            <Filter className="w-4 h-4" /> Filter
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
              <th className={thClass}>Product Name</th>
              <th className={thClass}>Warehouse</th>
              <th className={thClass}>Quantity Recorded</th>
              <th className={thClass}>Qty Left</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-sm text-gray-400">
                  No stock in warehouse data found.
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 pl-4 pr-2 w-10 text-left">
                    <input type="checkbox" className="accent-[#9D00FF]" />
                  </td>
                  <td className={tdClass}>{row.productName}</td>
                  <td className={tdClass}>{row.warehouse}</td>
                  <td className={tdClass}>{row.qtyRecorded}</td>
                  <td className={tdClass}>{row.qtyLeft}</td>
                </tr>
              ))
            )}
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
