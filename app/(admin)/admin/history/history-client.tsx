"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Filter,
  Search,
  Download,
  Printer,
  ChevronDown,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import type { AuditGroup, DailySummary } from "@/modules/audit/services/audit-query.service";
import { exportActivityCsvAction } from "@/modules/audit/actions/audit-export.action";

type Props = {
  tab: "general" | "personal";
  userId: string;
  groups: AuditGroup[];
  summary: DailySummary | null;
  departments: { value: string; label: string }[];
  selectedDepartment: string;
  selectedDate: string;
  search: string;
  todayLabel: string;
};

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export function HistoryClient({
  tab,
  userId,
  groups,
  summary,
  departments,
  selectedDepartment,
  selectedDate,
  search,
  todayLabel,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search);
  const [exporting, setExporting] = useState(false);

  const setParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [router, pathname, searchParams]
  );

  // Debounced search.
  function onSearchChange(value: string) {
    setSearchValue(value);
    const handle = setTimeout(() => setParam({ q: value || undefined }), 350);
    return () => clearTimeout(handle);
  }

  async function onExportCsv() {
    setExporting(true);
    try {
      const res = await exportActivityCsvAction({
        userId: tab === "personal" ? userId : undefined,
        department: tab === "general" ? selectedDepartment : undefined,
        date: selectedDate ? new Date(`${selectedDate}T00:00:00`) : undefined,
        search: searchValue || undefined,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `history-${tab}-${selectedDate || "all"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-[1120px] mx-auto font-inter text-slate-900 pb-24">
      {/* ── Header + tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 print:mb-4">
        <h1 className="text-[2.15rem] font-black text-slate-800 leading-tight">History</h1>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1 shadow-sm print:hidden">
          <button
            type="button"
            onClick={() => setParam({ tab: "personal" })}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
              tab === "personal" ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Personal History
          </button>
          <button
            type="button"
            onClick={() => setParam({ tab: "general" })}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
              tab === "general" ? "bg-purple-600 text-white shadow" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            General History
          </button>
        </div>
      </div>

      {/* ── Daily summary scoreboard (general only) ── */}
      {tab === "general" && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 print:hidden">
          <SummaryCard label="Total actions" value={summary.totalActions.toString()} />
          <SummaryCard label="Deletions" value={summary.deletions.toString()} accent="rose" />
          <SummaryCard label="Discounts given" value={formatNaira(summary.totalDiscountValue)} accent="amber" />
          <SummaryCard label="Remittances" value={summary.remittanceCount.toString()} sub={formatNaira(summary.remittanceTotal)} />
          {summary.perDepartment.slice(0, 2).map((d) => (
            <SummaryCard key={d.label} label={d.label} value={d.count.toString()} />
          ))}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500">
          <Filter size={16} /> Filter
        </span>

        {tab === "general" && (
          <div className="relative">
            <select
              value={selectedDepartment}
              onChange={(e) => setParam({ department: e.target.value === "ALL" ? undefined : e.target.value })}
              className="appearance-none bg-slate-800 text-white text-sm font-bold rounded-lg pl-3 pr-8 py-2 cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
          </div>
        )}

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setParam({ date: e.target.value || undefined })}
          className="bg-slate-800 text-white text-sm font-bold rounded-lg px-3 py-2 cursor-pointer [color-scheme:dark]"
        />

        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-purple-400"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 px-3 py-2 rounded-lg"
          >
            <Download size={14} /> CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg"
          >
            <Printer size={14} /> PDF
          </button>
          <div className="text-right ml-1">
            <p className="text-[0.7rem] uppercase font-black text-slate-400 tracking-widest">Today</p>
            <p className="text-sm font-semibold text-slate-500">{todayLabel}</p>
          </div>
        </div>
      </div>

      {/* ── Grouped table ── */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center text-sm text-slate-400">
          {pending ? "Loading…" : "No activity found for these filters."}
        </div>
      ) : (
        groups.map((group, index) => (
          <div key={group.label} className="mb-10">
            {index !== 0 && (
              <div className="flex justify-end mb-3">
                <div className="text-right">
                  <p className="text-[0.65rem] uppercase font-black text-slate-400 tracking-widest">{group.label}</p>
                  <p className="text-sm font-semibold text-slate-500">{group.date}</p>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
              <div className="grid grid-cols-[1.1fr_1.4fr_1.2fr_1.8fr] items-center px-6 py-4 bg-slate-50 text-[0.72rem] font-black uppercase tracking-tight text-slate-500">
                <span>Date &amp; Time</span>
                <span>Name</span>
                <span>Action</span>
                <span>Description</span>
              </div>
              <div className="divide-y divide-slate-100">
                {group.entries.map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "rose" | "amber";
}) {
  const valueColor =
    accent === "rose" ? "text-rose-600" : accent === "amber" ? "text-amber-600" : "text-slate-800";
  return (
    <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm">
      <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate">{label}</p>
      <p className={`text-lg font-black ${valueColor}`}>{value}</p>
      {sub && <p className="text-[0.7rem] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ActivityRow({ entry }: { entry: AuditGroup["entries"][number] }) {
  const [open, setOpen] = useState(false);
  const hasDetail = entry.before != null || entry.after != null;

  return (
    <div className="px-6 py-4 text-[0.88rem] hover:bg-purple-50/40 transition-colors">
      <div className="grid grid-cols-[1.1fr_1.4fr_1.2fr_1.8fr] items-center">
        <span className="text-slate-500 text-xs">{entry.dateTime}</span>
        <span className="leading-tight">
          <span className="block font-bold text-slate-700">{entry.actorName}</span>
          <span className="block text-xs text-slate-400">{entry.department}</span>
        </span>
        <span className="font-semibold text-slate-600">{entry.action}</span>
        <span className="text-slate-500 flex items-center gap-2">
          <span className="flex-1">{entry.description}</span>
          {hasDetail && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="shrink-0 text-purple-500 hover:text-purple-700"
              aria-label="Toggle change details"
            >
              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
        </span>
      </div>
      {hasDetail && open && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <span className="text-slate-400 line-through">{entry.before ?? "—"}</span>
            <ArrowRight size={12} className="text-slate-400" />
            <span className="font-bold text-slate-700">{entry.after ?? "—"}</span>
          </span>
        </div>
      )}
    </div>
  );
}
