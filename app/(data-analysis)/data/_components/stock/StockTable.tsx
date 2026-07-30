"use client";

import React, { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Package } from "lucide-react";
import type { Paged } from "@/modules/data-analysis/services/stock-analysis.service";

// Generic table for the /data/stock list sections. Replaces five near-identical
// hand-rolled tables; sorting and pagination write to the URL so the server
// query stays the single source of truth.

export type StockColumn<T> = {
  key: string;
  label: string;
  align?: "left" | "right";
  /** Sortable columns map to the service's `sort` keys. */
  sortKey?: "date" | "qty" | "status";
  render: (row: T) => React.ReactNode;
};

type Props<T> = {
  data: Paged<T>;
  columns: StockColumn<T>[];
  rowKey: (row: T) => string;
  /** Row click target, e.g. `/data/stock/incoming/${row.id}`. */
  rowHref?: (row: T) => string;
  emptyTitle: string;
  emptyMessage: string;
  /** Label for the record count, e.g. "movements". */
  unitLabel?: string;
};

const thClass =
  "text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide py-2.5 px-4 whitespace-nowrap";
const tdClass = "text-[12px] text-gray-600 py-2.5 px-4 whitespace-nowrap";

export function StockTable<T>({
  data,
  columns,
  rowKey,
  rowHref,
  emptyTitle,
  emptyMessage,
  unitLabel = "records",
}: Props<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeSort = searchParams.get("sort") ?? "date";
  const activeDir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  const push = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => {
      router.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
    });
  };

  const toggleSort = (key: string) => {
    // Same column → flip direction; new column → start descending.
    const dir = activeSort === key && activeDir === "desc" ? "asc" : "desc";
    push({ sort: key, dir, page: null });
  };

  if (data.total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 px-8 py-16">
        <Package className="w-14 h-14 text-gray-200" strokeWidth={1} />
        <h2 className="text-base font-bold text-gray-800 mt-1">{emptyTitle}</h2>
        <p className="text-xs text-gray-400 text-center max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  const first = (data.page - 1) * data.pageSize + 1;
  const last = Math.min(data.page * data.pageSize, data.total);

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-opacity ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((c) => {
                const isActive = c.sortKey && activeSort === c.sortKey;
                return (
                  <th
                    key={c.key}
                    className={`${thClass} ${c.align === "right" ? "text-right" : ""} ${
                      c.sortKey ? "cursor-pointer select-none hover:text-[#8B2FE8]" : ""
                    }`}
                    onClick={c.sortKey ? () => toggleSort(c.sortKey!) : undefined}
                  >
                    <span
                      className={`inline-flex items-center gap-1 ${
                        c.align === "right" ? "justify-end" : ""
                      } ${isActive ? "text-[#8B2FE8]" : ""}`}
                    >
                      {c.label}
                      {isActive &&
                        (activeDir === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        ))}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={rowHref ? () => router.push(rowHref(row)) : undefined}
                className={`hover:bg-gray-50/60 transition-colors ${rowHref ? "cursor-pointer" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`${tdClass} ${c.align === "right" ? "text-right" : ""}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p className="text-[11px] font-medium text-gray-400">
          Showing <span className="font-bold text-gray-600">{first}</span>–
          <span className="font-bold text-gray-600">{last}</span> of{" "}
          <span className="font-bold text-gray-600">{data.total.toLocaleString()}</span> {unitLabel}
        </p>
        {data.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={data.page <= 1}
              onClick={() => push({ page: String(data.page - 1) })}
              className="flex items-center gap-1 text-[11px] font-bold text-gray-600 border border-gray-200 rounded-lg px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#8B2FE8] hover:text-[#8B2FE8] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="text-[11px] font-bold text-gray-500">
              {data.page} / {data.totalPages}
            </span>
            <button
              disabled={data.page >= data.totalPages}
              onClick={() => push({ page: String(data.page + 1) })}
              className="flex items-center gap-1 text-[11px] font-bold text-gray-600 border border-gray-200 rounded-lg px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#8B2FE8] hover:text-[#8B2FE8] transition-colors"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Shared status pill used across the stock sections. */
export function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const tone =
    s.includes("revers") || s.includes("reject") || s.includes("fail")
      ? "bg-rose-50 text-rose-600"
      : s.includes("draft")
        ? "bg-amber-50 text-amber-700"
        : s.includes("pending")
          ? "bg-amber-50 text-amber-700"
          : s.includes("transit") || s.includes("qc")
            ? "bg-blue-50 text-blue-600"
            : s.includes("shelved") || s.includes("received") || s.includes("complet") || s.includes("recorded")
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-600";
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase whitespace-nowrap ${tone}`}>
      {status}
    </span>
  );
}
