"use client";

import React, { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import type { StockFilterOptions } from "@/modules/data-analysis/services/stock-analysis.service";

// Filters live in the URL rather than component state: the queries run
// server-side, and a filtered view stays shareable and survives a refresh.

export type FilterField = "product" | "warehouse" | "agent" | "supplier" | "status";

type Props = {
  options: StockFilterOptions;
  /** Which facet selects to show — varies by section. */
  fields: FilterField[];
  /** Which status vocabulary the Status select should offer. */
  statusKind?: "movement" | "transfer" | "adjustment";
  searchPlaceholder?: string;
};

const PRESETS: { label: string; days: number | null }[] = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: null },
];

const selectClass =
  "text-[12px] text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#8B2FE8] max-w-[170px] truncate";
const labelClass = "text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block";

function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function StockFilterBar({
  options,
  fields,
  statusKind = "movement",
  searchPlaceholder = "Search reference, product, agent…",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const get = (k: string) => searchParams.get(k) ?? "";

  /** Write params to the URL; any filter change resets pagination to page 1. */
  const apply = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in changes)) next.delete("page");
    startTransition(() => {
      router.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
    });
  };

  const applyPreset = (days: number | null) => {
    if (days === null) return apply({ from: null, to: null });
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    apply({ from: toInputDate(from), to: toInputDate(to) });
  };

  const statusOptions =
    statusKind === "transfer"
      ? options.transferStatuses
      : statusKind === "adjustment"
        ? options.adjustmentStatuses
        : options.movementStatuses;

  const activeCount = [
    "from",
    "to",
    "productId",
    "warehouseId",
    "agentId",
    "supplierId",
    "status",
    "q",
  ].filter((k) => get(k) !== "").length;

  const facet = (
    key: string,
    label: string,
    opts: { id: string; name: string }[],
    allLabel: string,
  ) => (
    <div key={key}>
      <label className={labelClass}>{label}</label>
      <select className={selectClass} value={get(key)} onChange={(e) => apply({ [key]: e.target.value })}>
        <option value="">{allLabel}</option>
        {opts.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 transition-opacity ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#8B2FE8]" />
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Filters</span>
        {activeCount > 0 && (
          <span className="text-[10px] font-bold text-white bg-[#8B2FE8] rounded-full px-1.5 py-0.5">
            {activeCount}
          </span>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.days)}
              className="text-[10px] font-bold text-gray-500 hover:text-white hover:bg-[#8B2FE8] border border-gray-200 hover:border-[#8B2FE8] rounded-md px-2 py-1 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
        {activeCount > 0 && (
          <button
            onClick={() =>
              apply({
                from: null,
                to: null,
                productId: null,
                warehouseId: null,
                agentId: null,
                supplierId: null,
                status: null,
                q: null,
              })
            }
            className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 ml-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className={labelClass}>From</label>
          <input
            type="date"
            value={get("from")}
            onChange={(e) => apply({ from: e.target.value })}
            className={selectClass}
          />
        </div>
        <div>
          <label className={labelClass}>To</label>
          <input
            type="date"
            value={get("to")}
            onChange={(e) => apply({ to: e.target.value })}
            className={selectClass}
          />
        </div>

        {fields.includes("product") && facet("productId", "Product", options.products, "All products")}
        {fields.includes("warehouse") &&
          facet("warehouseId", "Warehouse", options.warehouses, "All warehouses")}
        {fields.includes("agent") && facet("agentId", "Agent", options.agents, "All agents")}
        {fields.includes("supplier") && facet("supplierId", "Supplier", options.suppliers, "All suppliers")}
        {fields.includes("status") && facet("status", "Status", statusOptions, "All statuses")}

        <div className="flex-1 min-w-[200px]">
          <label className={labelClass}>Search</label>
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:border-[#8B2FE8]">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              defaultValue={get("q")}
              placeholder={searchPlaceholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") apply({ q: (e.target as HTMLInputElement).value });
              }}
              onBlur={(e) => {
                if (e.target.value !== get("q")) apply({ q: e.target.value });
              }}
              className="outline-none text-[12px] text-gray-700 bg-transparent w-full placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
