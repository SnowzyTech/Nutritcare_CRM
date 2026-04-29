"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Filter,
  PlusCircle,
  ArrowUpDown,
  Search,
  Package,
  PenLine,
  ArrowLeftCircle,
  MessageCircle,
  Trash2,
  Printer,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockStockAdjustment = [
  {
    id: 1,
    adjustmentId: "SA-000001",
    date: "Today",
    warehouse: "Owerri,Oricho",
    product: "50",
    warehouseManager: "Chima Chucks",
    status: "RECORDED",
    addedBy: "Yusuf Adeyemi",
  },
  {
    id: 2,
    adjustmentId: "SA-000001", // Duplicated ID in the mockup
    date: "24 Feb 2026",
    warehouse: "Owerri,Oricho",
    product: "12",
    warehouseManager: "Chima Chucks",
    status: "DRAFT",
    addedBy: "Yusuf Adeyemi",
  },
];

// ─── Toolbar (always visible) ─────────────────────────────────────────────────
function Toolbar({
  onAdd,
  search,
  onSearch,
}: {
  onAdd: () => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-5 mb-4">
      {/* Filter */}
      <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-[#9D00FF] transition-colors">
        <Filter className="w-4 h-4" />
        Filter
      </button>

      {/* Add New */}
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#9D00FF] transition-colors"
      >
        Add New
        <PlusCircle className="w-4 h-4" />
      </button>

      {/* Sort */}
      <button className="text-gray-400 hover:text-gray-600 transition-colors">
        <ArrowUpDown className="w-4 h-4" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="flex items-center gap-1.5 text-gray-400">
        <Search className="w-4 h-4 shrink-0" />
        <input
          type="text"
          placeholder="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="outline-none text-sm text-gray-600 bg-transparent w-28 placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ minHeight: "60vh" }}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex flex-col items-center gap-3 px-20 py-12 min-w-[360px]">
        {/* Icon: box + pen */}
        <div className="relative w-20 h-20 flex items-center justify-center mb-1">
          <Package className="w-16 h-16 text-gray-200" strokeWidth={1} />
          <PenLine className="w-6 h-6 text-gray-300 absolute bottom-1 right-0" strokeWidth={1.5} />
        </div>

        <h2 className="text-base font-bold text-gray-800">Stock Adjustment</h2>
        <p className="text-xs text-gray-400">Create stock adjustment</p>

        <button
          onClick={onAdd}
          className="mt-1 px-6 py-2 rounded-md text-xs font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors"
        >
          Create New
        </button>
      </div>
    </div>
  );
}

// ─── Data Table ───────────────────────────────────────────────────────────────
const thClass = "text-left text-[11px] font-semibold text-gray-500 py-2.5 pr-4 whitespace-nowrap";
const tdClass = "text-[12px] text-gray-600 py-2.5 pr-4 whitespace-nowrap";

function DataTable({ rows }: { rows: typeof mockStockAdjustment }) {
  return (
    <div className="w-full">
      {/* Action row */}
      <div className="flex items-center gap-3 mb-4 mt-6">
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          <Trash2 className="w-4 h-4 text-gray-500" />
          Delete
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          <Printer className="w-4 h-4 text-gray-500" />
          Excel/Print
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr style={{ backgroundColor: "#F9F6FC" }}>
              <th className="py-2.5 pr-3 pl-2 w-6">
                <input type="checkbox" className="accent-[#9D00FF]" />
              </th>
              <th className={thClass}>ID</th>
              <th className={thClass}>DATE</th>
              <th className={thClass}>Warehouse</th>
              <th className={thClass}>Product</th>
              <th className={thClass}>Warehouse Manager</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Added By:</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                <td className="py-2.5 pr-3 pl-2">
                  <input type="checkbox" className="accent-[#9D00FF]" />
                </td>
                <td className={tdClass}>{row.adjustmentId}</td>
                <td className={tdClass}>{row.date}</td>
                <td className={tdClass}>{row.warehouse}</td>
                <td className={tdClass}>{row.product}</td>
                <td className={tdClass}>{row.warehouseManager}</td>
                <td className={tdClass}>{row.status}</td>
                <td className={tdClass}>{row.addedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StockAdjustmentPage() {
  const [hasData, setHasData] = useState(true);
  const [search, setSearch] = useState("");

  const filtered = mockStockAdjustment.filter(
    (r) =>
      r.adjustmentId.toLowerCase().includes(search.toLowerCase()) ||
      r.warehouse.toLowerCase().includes(search.toLowerCase()) ||
      r.warehouseManager.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col relative">
      {/* Floating Chat Icon */}
      <button className="absolute -top-4 right-0 w-12 h-12 bg-[#F6E8FF] rounded-full flex items-center justify-center text-[#9D00FF] shadow-sm hover:bg-[#ebd5fa] transition-colors z-50">
        <MessageCircle className="w-6 h-6 fill-current" />
      </button>

      {/* Toolbar always visible */}
      <Toolbar
        onAdd={() => setHasData(true)}
        search={search}
        onSearch={setSearch}
      />

      {hasData ? (
        <>
          <DataTable rows={filtered} />

          {/* Back button — bottom right */}
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setHasData(false)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#9D00FF] transition-colors"
            >
              <ArrowLeftCircle className="w-5 h-5" />
              Back
            </button>
          </div>
        </>
      ) : (
        <EmptyState onAdd={() => setHasData(true)} />
      )}
    </div>
  );
}
