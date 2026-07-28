"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Filter,
  Search,
  FileText,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { AuditGroup, DailySummary } from "@/modules/audit/services/audit-query.service";
import { getActivityReportRowsAction } from "@/modules/audit/actions/audit-export.action";
import { downloadHistoryReportPdf } from "@/lib/history-report-pdf";

type Staff = { id: string; name: string };

type Props = {
  tab: "general" | "personal";
  userId: string;
  groups: AuditGroup[];
  summary: DailySummary | null;
  departments: { value: string; label: string }[];
  selectedDepartment: string;
  staff: Staff[];
  selectedPerson: string;
  selectedFrom: string;
  selectedTo: string;
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
  staff,
  selectedPerson,
  selectedFrom,
  selectedTo,
  search,
  todayLabel,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search);
  const [generating, setGenerating] = useState(false);

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

  function onSearchChange(value: string) {
    setSearchValue(value);
    const handle = setTimeout(() => setParam({ q: value || undefined }), 350);
    return () => clearTimeout(handle);
  }

  function rangeLabel(): string {
    const fmt = (s: string) =>
      new Date(`${s}T00:00:00`).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    if (selectedFrom && selectedTo)
      return selectedFrom === selectedTo ? fmt(selectedFrom) : `${fmt(selectedFrom)} - ${fmt(selectedTo)}`;
    if (selectedFrom) return `From ${fmt(selectedFrom)}`;
    if (selectedTo) return `Up to ${fmt(selectedTo)}`;
    return "All dates";
  }

  async function onGenerateReport() {
    setGenerating(true);
    try {
      const res = await getActivityReportRowsAction({
        userId: tab === "personal" ? userId : selectedPerson || undefined,
        department: tab === "general" ? selectedDepartment : undefined,
        dateFrom: selectedFrom ? new Date(`${selectedFrom}T00:00:00`) : undefined,
        dateTo: selectedTo ? new Date(`${selectedTo}T00:00:00`) : undefined,
        search: searchValue || undefined,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      await downloadHistoryReportPdf(res.rows, {
        scope: tab === "general" ? "General history" : "Personal history",
        rangeLabel: rangeLabel(),
        departmentLabel:
          tab === "general" && selectedDepartment !== "ALL"
            ? departments.find((d) => d.value === selectedDepartment)?.label
            : undefined,
        personLabel: selectedPerson ? staff.find((s) => s.id === selectedPerson)?.name : undefined,
        searchLabel: searchValue || undefined,
      });
      toast.success("Report downloaded");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-[1120px] mx-auto font-inter text-slate-900 pb-24">
      {/* ── Header + tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-[2.15rem] font-black text-slate-800 leading-tight">History</h1>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setParam({ tab: "personal", department: undefined, person: undefined })}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
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
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500">
          <Filter size={16} /> Filter
        </span>

        {tab === "general" && (
          <div className="relative">
            <select
              value={selectedDepartment}
              onChange={(e) =>
                setParam({
                  department: e.target.value === "ALL" ? undefined : e.target.value,
                  person: undefined,
                })
              }
              className="appearance-none bg-slate-800 text-white text-sm font-bold rounded-lg pl-3 pr-8 py-2 cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
          </div>
        )}

        {tab === "general" && selectedDepartment !== "ALL" && (
          <PersonPicker
            key={`${selectedDepartment}-${selectedPerson}`}
            staff={staff}
            selectedPerson={selectedPerson}
            onSelect={(id) => setParam({ person: id || undefined })}
          />
        )}

        {/* From / To date range */}
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
          From
          <input
            type="date"
            value={selectedFrom}
            max={selectedTo || undefined}
            onChange={(e) => setParam({ from: e.target.value || undefined })}
            className="bg-slate-800 text-white text-sm font-bold rounded-lg px-3 py-2 cursor-pointer [color-scheme:dark]"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
          To
          <input
            type="date"
            value={selectedTo}
            min={selectedFrom || undefined}
            onChange={(e) => setParam({ to: e.target.value || undefined })}
            className="bg-slate-800 text-white text-sm font-bold rounded-lg px-3 py-2 cursor-pointer [color-scheme:dark]"
          />
        </label>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, action or description"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-purple-400"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onGenerateReport}
            disabled={generating}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-3.5 py-2 rounded-lg"
          >
            <FileText size={14} /> {generating ? "Generating…" : "Generate History Report"}
          </button>
          <div className="text-right">
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

// ── Person typeahead (department-scoped) ──────────────────────────────────────
function PersonPicker({
  staff,
  selectedPerson,
  onSelect,
}: {
  staff: Staff[];
  selectedPerson: string;
  onSelect: (id: string) => void;
}) {
  const selectedName = staff.find((s) => s.id === selectedPerson)?.name ?? "";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selectedName);
  const boxRef = useRef<HTMLDivElement>(null);

  // The component is remounted (via `key`) when the selection changes, so the
  // initial `query` state always reflects the current selection — no sync effect.

  // Close when clicking away.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selectedName);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [selectedName]);

  const filtered = query.trim()
    ? staff.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : staff;

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center bg-slate-800 rounded-lg">
        <input
          type="text"
          value={query}
          placeholder="All staff — type a name"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="w-[190px] bg-transparent text-white text-sm font-bold placeholder:font-normal placeholder:text-slate-400 rounded-lg px-3 py-2 outline-none"
        />
        {selectedPerson ? (
          <button
            type="button"
            aria-label="Clear staff filter"
            onClick={() => {
              onSelect("");
              setQuery("");
              setOpen(false);
            }}
            className="px-2 text-slate-300 hover:text-white"
          >
            <X size={14} />
          </button>
        ) : (
          <ChevronDown size={14} className="mr-2.5 text-white pointer-events-none" />
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-[230px] max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1">
          <button
            type="button"
            onClick={() => {
              onSelect("");
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
          >
            All staff
          </button>
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">No matching staff.</p>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSelect(s.id);
                  setQuery(s.name);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-purple-50 ${
                  s.id === selectedPerson ? "bg-purple-50 font-bold text-purple-700" : "text-slate-700"
                }`}
              >
                {s.name}
              </button>
            ))
          )}
        </div>
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
