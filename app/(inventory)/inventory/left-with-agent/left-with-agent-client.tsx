"use client";

import React, { useState } from "react";
import { Filter, Search, MessageCircle } from "lucide-react";
import type { AgentStockRow } from "@/modules/inventory/services/inventory.service";

const thClass = "text-center text-[11px] font-semibold text-gray-500 py-3 px-4 whitespace-nowrap";
const tdClass = "text-center text-[12px] text-gray-600 py-3 px-4 whitespace-nowrap";

export function LeftWithAgentClient({ initialRows }: { initialRows: AgentStockRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = initialRows.filter(
    (r) =>
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.agentName.toLowerCase().includes(search.toLowerCase()) ||
      r.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col relative pb-10">
      <button className="absolute -top-4 right-0 w-12 h-12 bg-[#F6E8FF] rounded-full flex items-center justify-center text-[#9D00FF] shadow-sm hover:bg-[#ebd5fa] transition-colors z-50">
        <MessageCircle className="w-6 h-6 fill-current" />
      </button>

      <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-8 mt-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white w-[300px]">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search product, agent or state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-[13px] text-gray-600 bg-transparent w-full"
            />
          </div>
          <button
            onClick={() => setSearch("")}
            className="px-6 py-2 rounded-lg text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
          <button className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#9D00FF] transition-colors ml-4">
            <Filter className="w-[18px] h-[18px]" strokeWidth={2.5} /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="w-full border border-gray-100 rounded-lg overflow-x-auto mb-8">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr style={{ backgroundColor: "#F9F6FC" }}>
                <th className="py-3 pl-4 pr-2 w-10 text-left">
                  <input type="checkbox" className="accent-[#9D00FF]" />
                </th>
                <th className={thClass}>#</th>
                <th className={thClass}>Product Name</th>
                <th className={thClass}>State</th>
                <th className={thClass}>Agent Name</th>
                <th className={thClass}>Quantity Sent</th>
                <th className={thClass}>Qty Returned</th>
                <th className={thClass}>Qty Left</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-gray-400">
                    No agent stock data found.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 pl-4 pr-2 w-10 text-left">
                      <input type="checkbox" className="accent-[#9D00FF]" />
                    </td>
                    <td className={tdClass}>{i + 1}</td>
                    <td className={tdClass}>{row.productName}</td>
                    <td className={tdClass}>{row.state}</td>
                    <td className={tdClass}>{row.agentName}</td>
                    <td className={tdClass}>{row.qtySent}</td>
                    <td className={tdClass}>{row.qtySold}</td>
                    <td className={tdClass}>{row.qtyLeft}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end items-center gap-2">
          <button className="px-5 py-1.5 rounded-md text-[13px] font-bold text-white bg-gray-300 hover:bg-gray-400 transition-colors cursor-not-allowed">
            Previous
          </button>
          <button className="px-6 py-1.5 rounded-md text-[13px] font-bold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors">
            1
          </button>
          <button className="px-7 py-1.5 rounded-md text-[13px] font-bold text-white bg-gray-300 hover:bg-gray-400 transition-colors cursor-not-allowed">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
