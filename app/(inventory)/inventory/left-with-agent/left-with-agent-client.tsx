"use client";

import React, { useState } from "react";
import { Search, X, Package, Users } from "lucide-react";
import type { AgentStockSummary } from "@/modules/inventory/services/inventory.service";

export function LeftWithAgentClient({ agents }: { agents: AgentStockSummary[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AgentStockSummary | null>(null);

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col relative pb-10">
      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-white w-72">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search agent or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none text-sm text-gray-600 bg-transparent w-full"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="px-4 py-2 rounded-md text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-sm text-gray-400">{filtered.length} agent{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Agent list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Users className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No agents with stock found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelected(agent)}
              className="text-left bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[#9D00FF]/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#F6E8FF] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#9D00FF]" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F6E8FF] text-[#9D00FF]">
                  {agent.totalProducts} SKU{agent.totalProducts !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="font-bold text-gray-800 text-sm mb-1 group-hover:text-[#9D00FF] transition-colors">
                {agent.name}
              </p>
              <p className="text-xs text-gray-400 mb-4">{agent.state}</p>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Qty with agent</span>
                <span className="text-sm font-bold text-gray-700">{agent.totalQty.toLocaleString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F6E8FF] flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#9D00FF]" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-sm">{selected.name}</h2>
                  <p className="text-xs text-gray-400">State: {selected.state}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary bar */}
            <div className="flex items-center gap-6 px-6 py-3 bg-[#F9F6FC]">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Products</p>
                <p className="text-lg font-bold text-gray-800">{selected.totalProducts}</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Qty with Agent</p>
                <p className="text-lg font-bold text-[#9D00FF]">{selected.totalQty.toLocaleString()}</p>
              </div>
            </div>

            {/* Items table */}
            <div className="overflow-y-auto flex-1">
              {selected.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Package className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No stock items found</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#F9F6FC]">
                    <tr>
                      <th className="text-left text-[11px] font-semibold text-gray-500 px-6 py-3">#</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 px-6 py-3">Product</th>
                      <th className="text-center text-[11px] font-semibold text-gray-500 px-6 py-3">Qty Sent</th>
                      <th className="text-center text-[11px] font-semibold text-gray-500 px-6 py-3">Qty Left</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selected.items.map((item, i) => (
                      <tr key={item.productId} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-3.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-6 py-3.5 font-medium text-gray-700">{item.productName}</td>
                        <td className="px-6 py-3.5 text-center text-gray-500">{item.qtySent.toLocaleString()}</td>
                        <td className="px-6 py-3.5 text-center">
                          <span className="font-bold text-[#9D00FF]">{item.qtyLeft.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
