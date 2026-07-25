"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Users,
  Filter,
  X,
  ExternalLink,
  TrendingUp,
  Award,
} from "lucide-react";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import type { SalesRepOverviewRow } from "@/modules/users/services/users.service";

type SortKey =
  | "name"
  | "total"
  | "delivered"
  | "kpi"
  | "generalPerformance"
  | "confirmed"
  | "upsellRate"
  | "cancelled";

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "name", label: "Name", numeric: false },
  { key: "total", label: "Orders", numeric: true },
  { key: "delivered", label: "Delivered", numeric: true },
  { key: "kpi", label: "KPI", numeric: true },
  { key: "confirmed", label: "Confirmed", numeric: true },
  { key: "upsellRate", label: "Upsell %", numeric: true },
  { key: "cancelled", label: "Cancelled", numeric: true },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function Trend({ value }: { value: string }) {
  if (value === "—") return <span className="text-slate-300 text-[0.7rem] font-semibold">—</span>;
  const up = value.startsWith("+");
  return (
    <span className={`text-[0.7rem] font-bold ${up ? "text-emerald-500" : "text-rose-500"}`}>
      {value}
    </span>
  );
}

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export default function SalesRepOverviewClient({
  rows,
  periodLabel,
}: {
  rows: SalesRepOverviewRow[];
  periodLabel: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("kpi");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Rows narrowed by the multi-select person filter (drives BOTH table + summary).
  const scoped = useMemo(
    () => (selectedIds.length ? rows.filter((r) => selectedIds.includes(r.id)) : rows),
    [rows, selectedIds]
  );

  // Table view additionally narrowed by the free-text search.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? scoped.filter(
          (r) => r.name.toLowerCase().includes(q) || (r.phone ?? "").includes(q)
        )
      : scoped;
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "name") {
        return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return sorted;
  }, [scoped, search, sortKey, sortDir]);

  // Department aggregate — computed over the scoped set so it reflects the
  // person filter (whole department by default, or a chosen subset).
  const summary = useMemo(() => {
    const headcount = scoped.length;
    const totalOrders = scoped.reduce((s, r) => s + r.total, 0);
    const delivered = scoped.reduce((s, r) => s + r.delivered, 0);
    const pending = scoped.reduce((s, r) => s + r.pending + r.confirmed, 0);
    const failed = scoped.reduce((s, r) => s + r.failed, 0);
    const cancelled = scoped.reduce((s, r) => s + r.cancelled, 0);
    const productsSold = scoped.reduce((s, r) => s + r.totalProductsSold, 0);
    const active = scoped.filter((r) => r.total > 0);
    const avgKpi = avg(active.map((r) => r.kpi));
    const ranked = [...active].sort((a, b) => b.kpi - a.kpi);
    return {
      headcount,
      totalOrders,
      delivered,
      pending,
      failed,
      cancelled,
      productsSold,
      avgKpi,
      activeCount: active.length,
      top: ranked[0] ?? null,
      bottom: ranked.length > 1 ? ranked[ranked.length - 1] : null,
    };
  }, [scoped]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const toggleId = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="max-w-[1280px] mx-auto font-inter text-slate-900 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sales Reps — Department Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Showing <span className="font-semibold text-slate-600">{periodLabel}</span>
            {selectedIds.length > 0 && (
              <span className="text-purple-500"> · {selectedIds.length} selected</span>
            )}
          </p>
        </div>
        <DateRangeFilter />
      </div>

      {/* Department summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-4">
        <SummaryCard icon={<Users size={15} />} label="Reps" value={summary.headcount} sub={`${summary.activeCount} active`} />
        <SummaryCard label="Total Orders" value={summary.totalOrders} sub={`${summary.productsSold} products sold`} highlight />
        <SummaryCard label="Delivered" value={summary.delivered} sub={`${summary.pending} pending`} />
        <SummaryCard label="Failed" value={summary.failed} />
        <SummaryCard label="Cancelled" value={summary.cancelled} />
        <SummaryCard icon={<Award size={15} />} label="Avg KPI" value={`${summary.avgKpi}%`} />
        <div className="rounded-2xl bg-gradient-to-br from-[#5b00a3] to-[#8B2FE8] text-white p-4 flex flex-col justify-between">
          <span className="text-[0.65rem] font-black uppercase tracking-widest opacity-80 flex items-center gap-1">
            <TrendingUp size={13} /> Top Performer
          </span>
          {summary.top ? (
            <div className="mt-2">
              <p className="text-sm font-bold leading-tight truncate">{summary.top.name}</p>
              <p className="text-[0.7rem] opacity-80">{summary.top.kpi}% KPI · {summary.top.total} orders</p>
            </div>
          ) : (
            <p className="text-sm font-medium opacity-70 mt-2">No activity</p>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {/* Person multi-select */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
              selectedIds.length
                ? "border-purple-300 bg-purple-50 text-purple-600"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Filter size={15} />
            {selectedIds.length ? `${selectedIds.length} rep${selectedIds.length > 1 ? "s" : ""}` : "Filter reps"}
            <ChevronDown size={14} />
          </button>
          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
              <div className="absolute z-20 mt-2 w-64 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg p-1">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-xs font-semibold text-slate-400">Select reps</span>
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      className="text-xs font-semibold text-purple-600 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {rows.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(r.id)}
                      onChange={() => toggleId(r.id)}
                      className="accent-purple-600"
                    />
                    <span className="text-sm text-slate-600 truncate">{r.name}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Selected chips */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedIds.map((id) => {
              const r = rows.find((x) => x.id === id);
              if (!r) return null;
              return (
                <span
                  key={id}
                  className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600"
                >
                  {r.name}
                  <button type="button" onClick={() => toggleId(id)} className="hover:text-rose-500">
                    <X size={13} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white min-w-[220px]">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none outline-none text-sm text-slate-600 bg-transparent w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white">
        <div className="grid grid-cols-[2fr_repeat(6,1fr)_40px] px-5 py-3 border-b border-slate-100 bg-slate-50">
          {COLUMNS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => toggleSort(c.key)}
              className={`flex items-center gap-1 text-[0.7rem] font-bold uppercase tracking-wider ${
                c.numeric ? "justify-center" : "justify-start"
              } ${sortKey === c.key ? "text-purple-600" : "text-slate-500"} hover:text-purple-600`}
            >
              {c.label}
              {sortKey === c.key ? (
                sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
              ) : (
                <ArrowUpDown size={11} className="opacity-40" />
              )}
            </button>
          ))}
          <span />
        </div>

        {visible.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No sales reps match this view.</div>
        ) : (
          visible.map((r, i) => {
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className={i % 2 ? "bg-slate-50/40" : "bg-white"}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full grid grid-cols-[2fr_repeat(6,1fr)_40px] px-5 py-3 items-center border-b border-slate-50 hover:bg-purple-50/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-100">
                      {r.avatarUrl ? (
                        <Image src={r.avatarUrl} alt={r.name} width={32} height={32} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[0.7rem] font-bold text-slate-500">
                          {initials(r.name)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{r.name}</p>
                      {r.team && <p className="text-[0.7rem] text-slate-400 truncate">{r.team}</p>}
                    </div>
                  </div>
                  <NumCell value={r.total} trend={r.trends.total} />
                  <NumCell value={r.delivered} trend={r.trends.delivered} />
                  <NumCell value={`${r.kpi}%`} trend={r.trends.kpi} strong />
                  <NumCell value={r.confirmed} trend={r.trends.confirmed} />
                  <NumCell value={`${r.upsellRate}%`} trend={r.trends.upsellRate} />
                  <NumCell value={r.cancelled} trend={r.trends.cancelled} />
                  <span className="flex justify-center text-slate-400">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-b border-slate-100 bg-slate-50/60">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniStat label="General Performance" value={`${r.generalPerformance}%`} trend={r.trends.generalPerformance} />
                      <MiniStat label="Products Sold (Delivered)" value={r.totalProductsSold} />
                      <MiniStat label="Distinct Customers" value={r.distinctCustomers} />
                      <MiniStat label="Reorder Rate" value={`${r.reorderRate}%`} />
                      <MiniStat label="Best Selling Product" value={r.bestProduct ?? "—"} />
                      <MiniStat label="Pending Orders" value={r.pending} />
                      <MiniStat label="Confirmed Orders" value={r.confirmed} trend={r.trends.confirmed} />
                      <MiniStat label="Failed" value={r.failed} />
                      <MiniStat label="Phone" value={r.phone ?? "—"} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/admin/staff/sales-rep/${r.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-purple-300 hover:text-purple-600 transition-colors"
                      >
                        <ExternalLink size={13} /> Full profile
                      </Link>
                      <Link
                        href={`/admin/staff/sales-rep/${r.id}/analytics`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
                      >
                        Full analytics
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? "border-purple-100 bg-purple-50/50" : "border-slate-100 bg-white"}`}>
      <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
        {icon} {label}
      </span>
      <p className="text-2xl font-black leading-none mt-2">{value}</p>
      {sub && <p className="text-[0.7rem] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function NumCell({ value, trend, strong }: { value: string | number; trend: string; strong?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <span className={`text-sm ${strong ? "font-bold text-slate-800" : "text-slate-600"}`}>{value}</span>
      <Trend value={trend} />
    </div>
  );
}

function MiniStat({ label, value, trend }: { label: string; value: string | number; trend?: string }) {
  return (
    <div className="rounded-xl bg-white border border-slate-100 p-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="flex items-end justify-between mt-1.5">
        <span className="text-lg font-bold text-slate-800 truncate">{value}</span>
        {trend && <Trend value={trend} />}
      </div>
    </div>
  );
}
