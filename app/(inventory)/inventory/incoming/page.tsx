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
  RefreshCw,
} from "lucide-react";
import { incomingStockData } from "@/lib/mock-data/incoming-stock";

// Use the shared mock data
const mockIncomingStock = incomingStockData;


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
      <div
        className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-3 px-20 py-12"
      >
        {/* Icon: box + pen */}
        <div className="relative w-20 h-20 flex items-center justify-center mb-1">
          <Package
            className="w-16 h-16 text-gray-200"
            strokeWidth={1}
          />
          <PenLine
            className="w-6 h-6 text-gray-300 absolute bottom-1 right-0"
            strokeWidth={1.5}
          />
        </div>

        <h2 className="text-base font-bold text-gray-800">Stock In</h2>
        <p className="text-xs text-gray-400">Create Stock in</p>

        <button
          onClick={onAdd}
          className="mt-1 px-5 py-2 rounded-md text-xs font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors"
        >
          Click to add Stock
        </button>
      </div>
    </div>
  );
}

// ─── Data Table ───────────────────────────────────────────────────────────────
const thClass =
  "text-left text-[11px] font-semibold text-gray-500 py-2.5 pr-4 whitespace-nowrap";
const tdClass = "text-[12px] text-gray-600 py-2.5 pr-4 whitespace-nowrap";

function DataTable({ rows, onRowClick }: { rows: typeof mockIncomingStock; onRowClick: (id: number) => void }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr style={{ backgroundColor: "#F0EBFF" }}>
            <th className="py-2.5 pr-3 pl-2 w-6">
              <input type="checkbox" className="accent-[#9D00FF]" />
            </th>
            <th className={thClass}>DATE</th>
            <th className={thClass}>SI ID</th>
            <th className={thClass}>Supplier</th>
            <th className={thClass}>Warehouse</th>
            <th className={thClass}>Supplier Ref.</th>
            <th className={thClass}>Product</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>CREATED TIME</th>
            <th className={thClass}>Added By</th>
            <th className={thClass}>Action</th>
            <th className="py-2.5 pr-2">
              <Search className="w-3.5 h-3.5 text-gray-400 ml-auto" />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick(row.id)}
              className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors cursor-pointer"
            >
              <td className="py-2.5 pr-3 pl-2">
                <input type="checkbox" className="accent-[#9D00FF]" />
              </td>
              <td className={tdClass}>{row.date}</td>
              <td className={tdClass}>{row.siId}</td>
              <td className={tdClass}>{row.supplier}</td>
              <td className={tdClass}>
                <span className="text-[#9D00FF] hover:underline cursor-pointer">
                  {row.warehouse}
                </span>
              </td>
              <td className={tdClass}>
                <span className="text-[#9D00FF] hover:underline cursor-pointer">
                  {row.supplierRef}
                </span>
              </td>
              <td className={tdClass}>{row.product}</td>
              <td className={tdClass}>
                <span
                  className={
                    row.status === "Draft"
                      ? "text-amber-500 font-medium"
                      : "text-gray-600"
                  }
                >
                  {row.status}
                </span>
              </td>
              <td className={tdClass}>{row.createdTime}</td>
              <td className={tdClass}>{row.addedBy}</td>
              <td className={tdClass}>{row.action}</td>
              <td className="py-2.5 pr-2" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function IncomingStockPage() {
  const router = useRouter();
  const [hasData, setHasData] = useState(true);
  const [search, setSearch] = useState("");

  const filtered = mockIncomingStock.filter(
    (r) =>
      r.supplier.toLowerCase().includes(search.toLowerCase()) ||
      r.warehouse.toLowerCase().includes(search.toLowerCase()) ||
      r.siId.toLowerCase().includes(search.toLowerCase()) ||
      r.supplierRef.includes(search)
  );

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col">
      {/* Toolbar always visible */}
      <Toolbar
        onAdd={() => router.push("/inventory/incoming/create")}
        search={search}
        onSearch={setSearch}
      />

      {hasData ? (
        <>
          <DataTable rows={filtered} onRowClick={(id) => router.push(`/inventory/incoming/${id}`)} />

          {/* Back button — bottom right */}
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setHasData(false)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#9D00FF] transition-colors"
            >
              <span className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center">
                <RefreshCw className="w-3 h-3" />
              </span>
              Back
            </button>
          </div>
        </>
      ) : (
        <EmptyState onAdd={() => router.push("/inventory/incoming/create")} />
      )}
    </div>
  );
}
