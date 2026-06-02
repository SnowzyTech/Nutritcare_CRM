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
  MessageCircle,
  Trash2,
  Printer,
} from "lucide-react";
import type { AdjustmentRow } from "@/modules/inventory/services/inventory.service";

const thClass = "text-left text-[11px] font-semibold text-gray-500 py-2.5 pr-4 whitespace-nowrap";
const tdClass = "text-[12px] text-gray-600 py-2.5 pr-4 whitespace-nowrap";

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ minHeight: "60vh" }}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex flex-col items-center gap-3 px-20 py-12 min-w-[360px]">
        <div className="relative w-20 h-20 flex items-center justify-center mb-1">
          <Package className="w-16 h-16 text-gray-200" strokeWidth={1} />
          <PenLine className="w-6 h-6 text-gray-300 absolute bottom-1 right-0" strokeWidth={1.5} />
        </div>
        <h2 className="text-base font-bold text-gray-800">Stock Adjustment</h2>
        <p className="text-xs text-gray-400">No adjustments recorded yet.</p>
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

export function AdjustmentClient({ initialRows }: { initialRows: AdjustmentRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = initialRows.filter(
    (r) =>
      r.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.warehouse.toLowerCase().includes(search.toLowerCase()) ||
      r.warehouseManager.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase()) ||
      r.addedBy.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col relative">
      <button className="absolute -top-4 right-0 w-12 h-12 bg-[#F6E8FF] rounded-full flex items-center justify-center text-[#9D00FF] shadow-sm hover:bg-[#ebd5fa] transition-colors z-50">
        <MessageCircle className="w-6 h-6 fill-current" />
      </button>

      {/* Toolbar */}
      <div className="flex items-center gap-5 mb-4">
        <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-[#9D00FF] transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
        <button
          onClick={() => router.push("/inventory/adjustment/create")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#9D00FF] transition-colors"
        >
          Add New
          <PlusCircle className="w-4 h-4" />
        </button>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowUpDown className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-gray-400">
          <Search className="w-4 h-4 shrink-0" />
          <input
            type="text"
            placeholder="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none text-sm text-gray-600 bg-transparent w-28 placeholder:text-gray-400"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState onAdd={() => router.push("/inventory/adjustment/create")} />
      ) : (
        <div className="w-full">
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
                <tr style={{ backgroundColor: "#F0EBFF" }}>
                  <th className="py-2.5 pr-3 pl-2 w-6">
                    <input type="checkbox" className="accent-[#9D00FF]" />
                  </th>
                  <th className={thClass}>ID</th>
                  <th className={thClass}>DATE</th>
                  <th className={thClass}>Warehouse</th>
                  <th className={thClass}>Products</th>
                  <th className={thClass}>Warehouse Manager</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Added By</th>
                  <th className="py-2.5 pr-2">
                    <Search className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/inventory/adjustment/${row.id}`)}
                    className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 pr-3 pl-2">
                      <input type="checkbox" className="accent-[#9D00FF]" onClick={(e) => e.stopPropagation()} />
                    </td>
                    <td className={tdClass}>{row.referenceNumber}</td>
                    <td className={tdClass}>{row.date}</td>
                    <td className={tdClass}>
                      <span className="text-[#9D00FF] hover:underline cursor-pointer">{row.warehouse}</span>
                    </td>
                    <td className={tdClass}>{row.products}</td>
                    <td className={tdClass}>{row.warehouseManager}</td>
                    <td className={tdClass}>
                      <span
                        className={
                          row.status === "Draft"
                            ? "text-amber-500 font-medium"
                            : row.status === "Reversed"
                            ? "text-red-500 font-medium"
                            : row.status === "Pending Approval"
                            ? "text-orange-500 font-medium"
                            : row.status === "Rejected"
                            ? "text-red-600 font-medium"
                            : "text-gray-600"
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className={tdClass}>{row.addedBy}</td>
                    <td className="py-2.5 pr-2" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
