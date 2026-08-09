"use client";

import React, { useMemo, useState } from "react";
import { Search, Package, Warehouse as WarehouseIcon, Truck } from "lucide-react";

// Master/detail balance browser shared by "Stock in Warehouse" and "Stock Left
// with Agent" — same interaction as the inventory module's
// stock-in-warehouse-client / left-with-agent-client, generalized over the two
// shapes. Used by both the data-analyst and logistics-manager dashboards.
//
// These are BALANCES: read from StockLevel, not derived from movement history.

export type BalanceNode = {
  id: string;
  name: string;
  /** Manager name for warehouses, state for agents. */
  meta: string;
  totalProducts: number;
  totalQty: number;
  items: { productId: string; productName: string; qty: number }[];
};

type Props = {
  nodes: BalanceNode[];
  kind: "warehouse" | "agent";
  title: string;
  subtitle: string;
  metaLabel: string;
  emptyMessage: string;
  /**
   * Root classes. Defaults to self-padding for layouts whose <main> has none
   * (data-analyst); layouts that already pad their main (logistics) pass a
   * variant without `p-8`.
   */
  className?: string;
};

export function StockBalanceExplorer({
  nodes,
  kind,
  title,
  subtitle,
  metaLabel,
  emptyMessage,
  className = "p-8 max-w-[1400px] mx-auto pb-16",
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(nodes[0]?.id ?? null);
  const [nodeSearch, setNodeSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const Icon = kind === "warehouse" ? WarehouseIcon : Truck;

  const filteredNodes = useMemo(() => {
    const q = nodeSearch.trim().toLowerCase();
    if (!q) return nodes;
    return nodes.filter((n) => n.name.toLowerCase().includes(q) || n.meta.toLowerCase().includes(q));
  }, [nodes, nodeSearch]);

  const selected = nodes.find((n) => n.id === selectedId) ?? null;

  const filteredItems = useMemo(() => {
    if (!selected) return [];
    const q = itemSearch.trim().toLowerCase();
    if (!q) return selected.items;
    return selected.items.filter((i) => i.productName.toLowerCase().includes(q));
  }, [selected, itemSearch]);

  const grandTotal = nodes.reduce((s, n) => s + n.totalQty, 0);

  return (
    <div className={className}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
      </div>

      {nodes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 px-8 py-16">
          <Package className="w-14 h-14 text-gray-200" strokeWidth={1} />
          <h2 className="text-base font-bold text-gray-800 mt-1">No stock on hand</h2>
          <p className="text-xs text-gray-400 text-center max-w-sm">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">
                {kind === "warehouse" ? "Warehouses" : "Agents"} Holding Stock
              </p>
              <p className="text-2xl font-bold text-gray-900">{nodes.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">
                Total Units
              </p>
              <p className="text-2xl font-bold text-gray-900">{grandTotal.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">
                Distinct Products
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(nodes.flatMap((n) => n.items.map((i) => i.productId))).size}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Master list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:border-[#8B2FE8]">
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={nodeSearch}
                    onChange={(e) => setNodeSearch(e.target.value)}
                    placeholder={kind === "warehouse" ? "Search warehouses…" : "Search agents…"}
                    className="outline-none text-[12px] text-gray-700 bg-transparent w-full placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="divide-y divide-gray-50 max-h-[560px] overflow-y-auto">
                {filteredNodes.length === 0 ? (
                  <p className="text-center text-gray-400 text-[12px] py-8">No matches.</p>
                ) : (
                  filteredNodes.map((n) => {
                    const isActive = n.id === selectedId;
                    return (
                      <button
                        key={n.id}
                        onClick={() => {
                          setSelectedId(n.id);
                          setItemSearch("");
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          isActive ? "bg-[#8B2FE8]/5 border-l-2 border-l-[#8B2FE8]" : "hover:bg-gray-50/60"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <Icon
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isActive ? "text-[#8B2FE8]" : "text-gray-300"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-[12px] font-bold truncate ${
                                isActive ? "text-[#8B2FE8]" : "text-gray-800"
                              }`}
                            >
                              {n.name}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                              {metaLabel}: {n.meta}
                            </p>
                            <p className="text-[10px] font-semibold text-gray-500 mt-1">
                              {n.totalProducts} product{n.totalProducts === 1 ? "" : "s"} ·{" "}
                              {n.totalQty.toLocaleString()} units
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {!selected ? (
                <p className="text-center text-gray-400 text-sm py-16">
                  Select {kind === "warehouse" ? "a warehouse" : "an agent"} to view its stock.
                </p>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100">
                    <div>
                      <h3 className="text-[13px] font-bold text-gray-900">{selected.name}</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {metaLabel}: {selected.meta} · {selected.totalQty.toLocaleString()} units
                        across {selected.totalProducts} product
                        {selected.totalProducts === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:border-[#8B2FE8] shrink-0">
                      <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <input
                        type="text"
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        placeholder="Search product…"
                        className="outline-none text-[12px] text-gray-700 bg-transparent w-32 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="max-h-[520px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0">
                        <tr className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          <th className="px-6 py-2.5 w-10">#</th>
                          <th className="px-6 py-2.5">Product</th>
                          <th className="px-6 py-2.5 text-right">Qty on Hand</th>
                          <th className="px-6 py-2.5 text-right">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center text-gray-400 text-[12px] py-10">
                              No products match that search.
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map((item, i) => (
                            <tr key={item.productId}>
                              <td className="px-6 py-3 text-[12px] text-gray-400">{i + 1}</td>
                              <td className="px-6 py-3 text-[12px] font-semibold text-gray-800">
                                {item.productName}
                              </td>
                              <td className="px-6 py-3 text-[12px] font-bold text-gray-900 text-right">
                                {item.qty.toLocaleString()}
                              </td>
                              <td className="px-6 py-3 text-[12px] text-gray-400 text-right">
                                {selected.totalQty > 0
                                  ? `${((item.qty / selected.totalQty) * 100).toFixed(1)}%`
                                  : "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
