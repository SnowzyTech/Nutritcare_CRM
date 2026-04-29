"use client";

import React, { useState } from "react";
import { Filter, Search, MessageCircle } from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockLeftWithAgent = [
  { id: 12, productName: "Vitorep", state: "Owerri, Imo", agentName: "Chima Chuks", qtySent: 98, qtySold: 90, qtyLeft: 8 },
  { id: 16, productName: "Proxact", state: "Owerri, Imo", agentName: "Akintade Sharon", qtySent: 110, qtySold: 80, qtyLeft: 30 },
  { id: 46, productName: "Balm", state: "Owerri, Imo", agentName: "Chima Chuks", qtySent: 50, qtySold: 32, qtyLeft: 18 },
  { id: 38, productName: "Balm", state: "Owerri, Imo", agentName: "Chima Chuks", qtySent: 250, qtySold: 200, qtyLeft: 50 },
  { id: 26, productName: "Shred Belly", state: "Egbeda Lagos", agentName: "Kenneth Dano", qtySent: 60, qtySold: 45, qtyLeft: 15 },
  { id: 21, productName: "Balm", state: "Jabi, Abuja", agentName: "John Doe", qtySent: 95, qtySold: 60, qtyLeft: 35 },
  { id: 80, productName: "Shred Belly", state: "Owerri, Imo", agentName: "Chima Chuks", qtySent: 74, qtySold: 53, qtyLeft: 21 },
  { id: 13, productName: "Trim & Tone", state: "Egbeda Lagos", agentName: "Kenneth Dano", qtySent: 15, qtySold: 15, qtyLeft: 0 },
  { id: 12, productName: "Proxact", state: "Owerri, Imo", agentName: "Chima Chuks", qtySent: 110, qtySold: 70, qtyLeft: 40 },
  { id: 17, productName: "Trim & Tone", state: "Owerri, Imo", agentName: "Chima Chuks", qtySent: 20, qtySold: 12, qtyLeft: 8 },
];

export default function StockLeftWithAgentPage() {
  const [search, setSearch] = useState("");

  const filtered = mockLeftWithAgent.filter((r) =>
    r.productName.toLowerCase().includes(search.toLowerCase()) ||
    r.agentName.toLowerCase().includes(search.toLowerCase()) ||
    r.state.toLowerCase().includes(search.toLowerCase())
  );

  const thClass = "text-center text-[11px] font-semibold text-gray-500 py-3 px-4 whitespace-nowrap";
  const tdClass = "text-center text-[12px] text-gray-600 py-3 px-4 whitespace-nowrap";

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col relative pb-10">
      {/* Floating Chat Icon */}
      <button className="absolute -top-4 right-0 w-12 h-12 bg-[#F6E8FF] rounded-full flex items-center justify-center text-[#9D00FF] shadow-sm hover:bg-[#ebd5fa] transition-colors z-50">
        <MessageCircle className="w-6 h-6 fill-current" />
      </button>

      {/* White Container wrapping everything */}
      <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-8 mt-4">
        {/* Top Toolbar */}
        <div className="flex items-center gap-3 mb-8">
          {/* Search Box */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white w-[300px]">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder=""
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-[13px] text-gray-600 bg-transparent w-full"
            />
          </div>

          {/* Clear Button */}
          <button
            onClick={() => setSearch("")}
            className="px-6 py-2 rounded-lg text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>

          {/* Filter */}
          <button className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#9D00FF] transition-colors ml-4">
            <Filter className="w-[18px] h-[18px]" strokeWidth={2.5} />
            Filter
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
              <th className={thClass}>ID</th>
              <th className={thClass}>Product Name</th>
              <th className={thClass}>State</th>
              <th className={thClass}>Agent Name</th>
              <th className={thClass}>Quantity Sent</th>
              <th className={thClass}>Qty Sold</th>
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
                <td className={tdClass}>{row.state}</td>
                <td className={tdClass}>{row.agentName}</td>
                <td className={tdClass}>{row.qtySent}</td>
                <td className={tdClass}>{row.qtySold}</td>
                <td className={tdClass}>{row.qtyLeft}</td>
              </tr>
            ))}
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
