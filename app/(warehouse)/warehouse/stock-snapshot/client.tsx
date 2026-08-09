"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Package,
  Boxes,
  LayoutGrid,
  AlertTriangle,
  ChevronRight,
  Inbox,
} from "lucide-react";
import type { WarehouseStockSnapshot } from "@/modules/warehouse/services/warehouse.service";

const occupancyColour: Record<string, string> = {
  FULL: "bg-[#059669]/10 text-[#059669]",
  PARTIAL: "bg-[#F59E0B]/10 text-[#B45309]",
  RESERVED: "bg-[#DC2626]/10 text-[#DC2626]",
  EMPTY: "bg-gray-100 text-gray-400",
  DAMAGE: "bg-[#9CA3AF]/20 text-gray-500",
};

const occupancyLabel: Record<string, string> = {
  FULL: "Full",
  PARTIAL: "Partial",
  RESERVED: "Reserved",
  EMPTY: "Empty",
  DAMAGE: "Damage",
};

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  tone?: "default" | "warn" | "alert";
}) {
  const toneClasses =
    tone === "alert"
      ? "bg-[#DC2626]/10 text-[#DC2626]"
      : tone === "warn"
        ? "bg-[#F59E0B]/10 text-[#B45309]"
        : "bg-[#F6E8FF] text-[#ad1df4]";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toneClasses}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function StockSnapshotClient({ snapshot }: { snapshot: WarehouseStockSnapshot }) {
  const [view, setView] = useState<"product" | "shelf">("product");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { totals, products, shelves, warehouseName } = snapshot;

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.shelves.some((s) => s.locationCode.toLowerCase().includes(q)),
    );
  }, [products, search]);

  // Shelf view lists only bins actually holding stock — an empty bin tells the
  // manager nothing he came here to learn.
  const filteredShelves = useMemo(() => {
    const occupied = shelves.filter((s) => s.totalQty > 0);
    const q = search.trim().toLowerCase();
    if (!q) return occupied;
    return occupied.filter(
      (s) =>
        s.locationCode.toLowerCase().includes(q) ||
        s.zone.toLowerCase().includes(q) ||
        s.items.some((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)),
    );
  }, [shelves, search]);

  const visibleUnits =
    view === "product"
      ? filteredProducts.reduce((s, p) => s + p.totalQty, 0)
      : filteredShelves.reduce((s, x) => s + x.totalQty, 0);

  const isEmpty = products.length === 0;

  return (
    <div className="max-w-[1400px] mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Snapshot</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Everything currently held at {warehouseName}, totalled by product and by shelf
        </p>
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 px-8 py-16">
          <Package className="w-14 h-14 text-gray-200" strokeWidth={1} />
          <h2 className="text-base font-bold text-gray-800 mt-1">No stock on hand</h2>
          <p className="text-xs text-gray-400 text-center max-w-sm">
            Nothing is recorded against this warehouse yet. Received goods appear here once they
            are booked in.
          </p>
        </div>
      ) : (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatTile
              label="Total Units"
              value={totals.totalUnits.toLocaleString()}
              hint="Across the whole warehouse"
              icon={Boxes}
            />
            <StatTile
              label="Distinct Products"
              value={totals.distinctProducts.toLocaleString()}
              hint="SKUs with stock on hand"
              icon={Package}
            />
            <StatTile
              label="Shelves in Use"
              value={`${totals.shelvesInUse}/${totals.totalShelves}`}
              hint="Bins currently holding stock"
              icon={LayoutGrid}
            />
            <StatTile
              label="Awaiting Put-away"
              value={totals.unshelvedUnits.toLocaleString()}
              hint="Booked in, not yet on a shelf"
              icon={Inbox}
              tone={totals.unshelvedUnits > 0 ? "warn" : "default"}
            />
            <StatTile
              label="Low Stock"
              value={totals.lowStockCount.toLocaleString()}
              hint="At or below reorder level"
              icon={AlertTriangle}
              tone={totals.lowStockCount > 0 ? "alert" : "default"}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
              {(["product", "shelf"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setView(v);
                    setExpanded(new Set());
                  }}
                  className={`px-3.5 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                    view === v ? "bg-[#ad1df4] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {v === "product" ? "By Product" : "By Shelf"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus-within:border-[#ad1df4] w-72">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  view === "product" ? "Search product, SKU, category…" : "Search shelf or product…"
                }
                className="outline-none text-[12px] text-gray-700 bg-transparent w-full placeholder:text-gray-400"
              />
            </div>

            <span className="ml-auto text-[12px] text-gray-400">
              {view === "product"
                ? `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"}`
                : `${filteredShelves.length} shelf${filteredShelves.length === 1 ? "" : "s"}`}{" "}
              · {visibleUnits.toLocaleString()} units
            </span>
          </div>

          {/* By product */}
          {view === "product" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[820px]">
                  <thead>
                    <tr className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      <th className="px-5 py-2.5 w-8" />
                      <th className="px-5 py-2.5">Product</th>
                      <th className="px-5 py-2.5">Category</th>
                      <th className="px-5 py-2.5 text-center">Shelves</th>
                      <th className="px-5 py-2.5 text-right">On Shelf</th>
                      <th className="px-5 py-2.5 text-right">Awaiting Put-away</th>
                      <th className="px-5 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-gray-400 text-[12px] py-10">
                          No products match that search.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const open = expanded.has(p.productId);
                        return (
                          <React.Fragment key={p.productId}>
                            <tr
                              onClick={() => toggle(p.productId)}
                              className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                            >
                              <td className="px-5 py-3">
                                <ChevronRight
                                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                                    open ? "rotate-90" : ""
                                  }`}
                                />
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] font-semibold text-gray-800">
                                    {p.name}
                                  </span>
                                  {p.isLow && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#DC2626]/10 text-[#DC2626]">
                                      LOW
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {p.sku}
                                  {p.unit ? ` · ${p.unit}` : ""}
                                </p>
                              </td>
                              <td className="px-5 py-3 text-[12px] text-gray-500">{p.category}</td>
                              <td className="px-5 py-3 text-center text-[12px] text-gray-500">
                                {p.shelves.length || "—"}
                              </td>
                              <td className="px-5 py-3 text-right text-[12px] text-gray-600">
                                {p.shelvedQty.toLocaleString()}
                              </td>
                              <td className="px-5 py-3 text-right text-[12px]">
                                {p.unshelvedQty > 0 ? (
                                  <span className="font-semibold text-[#B45309]">
                                    {p.unshelvedQty.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-right text-[13px] font-bold text-gray-900">
                                {p.totalQty.toLocaleString()}
                              </td>
                            </tr>

                            {open && (
                              <tr className="bg-[#FAF7FE]">
                                <td />
                                <td colSpan={6} className="px-5 py-3">
                                  {p.shelves.length === 0 ? (
                                    <p className="text-[11px] text-gray-400">
                                      Not on any shelf yet — all {p.totalQty.toLocaleString()} units
                                      are awaiting put-away.
                                    </p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {p.shelves.map((s) => (
                                        <span
                                          key={s.locationId}
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#ad1df4]/20 bg-white px-2.5 py-1"
                                        >
                                          <span className="text-[11px] font-bold text-[#ad1df4]">
                                            {s.locationCode}
                                          </span>
                                          <span className="text-[11px] text-gray-500">
                                            {s.qty.toLocaleString()}
                                          </span>
                                        </span>
                                      ))}
                                      {p.unshelvedQty > 0 && (
                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/5 px-2.5 py-1">
                                          <span className="text-[11px] font-bold text-[#B45309]">
                                            Unshelved
                                          </span>
                                          <span className="text-[11px] text-gray-500">
                                            {p.unshelvedQty.toLocaleString()}
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                  {filteredProducts.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-100">
                        <td />
                        <td className="px-5 py-3 text-[12px] font-bold text-gray-700">
                          {search ? "Total (filtered)" : "Total"}
                        </td>
                        <td />
                        <td />
                        <td className="px-5 py-3 text-right text-[12px] font-semibold text-gray-600">
                          {filteredProducts.reduce((s, p) => s + p.shelvedQty, 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right text-[12px] font-semibold text-[#B45309]">
                          {filteredProducts.reduce((s, p) => s + p.unshelvedQty, 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right text-[13px] font-bold text-gray-900">
                          {visibleUnits.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* By shelf */}
          {view === "shelf" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredShelves.length === 0 ? (
                <div className="md:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm py-12 text-center">
                  <p className="text-[12px] text-gray-400">No shelves match that search.</p>
                </div>
              ) : (
                filteredShelves.map((s) => (
                  <div
                    key={s.locationId}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                  >
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                      <div>
                        <p className="text-[13px] font-bold text-gray-900">{s.locationCode}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Zone {s.zone} · {s.items.length} product{s.items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          occupancyColour[s.occupancyStatus] ?? "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {occupancyLabel[s.occupancyStatus] ?? s.occupancyStatus}
                      </span>
                    </div>

                    <div className="px-5 py-2.5 bg-[#FAF7FE] flex items-baseline justify-between">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                        Units on shelf
                      </span>
                      <span className="text-[15px] font-bold text-[#ad1df4]">
                        {s.totalQty.toLocaleString()}
                        {s.maxCapacity != null && (
                          <span className="text-[11px] font-medium text-gray-400">
                            {" "}
                            / {s.maxCapacity.toLocaleString()}
                          </span>
                        )}
                      </span>
                    </div>

                    <ul className="divide-y divide-gray-50 flex-1">
                      {s.items.map((i) => (
                        <li key={i.productId} className="flex items-center gap-3 px-5 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-gray-800 truncate">
                              {i.name}
                            </p>
                            <p className="text-[10px] text-gray-400">{i.sku}</p>
                          </div>
                          <span className="text-[12px] font-bold text-gray-900 shrink-0">
                            {i.qty.toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
