"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { mondayOf } from "@/lib/staff-period";

const GRANULARITIES: { key: "day" | "week" | "month"; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Day / Week / Month period filter for admin staff analytics pages. Writes
 * `?g=` plus the granularity-specific value (`month` / `w` / `d`). Defaults to
 * Month + the current month, preserving the previous "by month" behaviour.
 */
function StaffPeriodFilterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = new Date();

  const g = (() => {
    const raw = searchParams.get("g");
    return raw === "day" || raw === "week" ? raw : "month";
  })();

  const setParams = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const switchGranularity = (key: "day" | "week" | "month") => {
    // Reset the value params so each granularity falls back to its default.
    setParams({ g: key, month: null, w: null, d: null });
  };

  // ── Month options (last 12 months) ──
  const monthValue =
    searchParams.get("month") || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const months = React.useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const isThis = i === 0;
      const label = isThis
        ? "This Month"
        : new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
      return { value, label };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Week options (last 8 weeks, keyed by Monday) ──
  const thisMonday = mondayOf(now);
  const weekValue = searchParams.get("w") || ymd(thisMonday);
  const weeks = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" });
    return Array.from({ length: 8 }).map((_, i) => {
      const monday = new Date(thisMonday);
      monday.setDate(monday.getDate() - i * 7);
      const value = ymd(monday);
      const label = i === 0 ? "This Week" : i === 1 ? "Last Week" : `Week of ${fmt.format(monday)}`;
      return { value, label };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Day value ──
  const today = ymd(now);
  const dayValue = searchParams.get("d") || today;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Granularity segmented control */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
        {GRANULARITIES.map((item) => {
          const active = g === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => switchGranularity(item.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                active ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Contextual value control */}
      {g === "month" && (
        <div className="relative">
          <select
            value={monthValue}
            onChange={(e) => setParams({ month: e.target.value })}
            className="appearance-none bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 pl-3 pr-8 py-2 outline-none cursor-pointer"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      )}

      {g === "week" && (
        <div className="relative">
          <select
            value={weekValue}
            onChange={(e) => setParams({ w: e.target.value })}
            className="appearance-none bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 pl-3 pr-8 py-2 outline-none cursor-pointer"
          >
            {weeks.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      )}

      {g === "day" && (
        <input
          type="date"
          max={today}
          value={dayValue}
          onChange={(e) => setParams({ d: e.target.value || today })}
          className="bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 px-3 py-2 outline-none"
          aria-label="Select day"
        />
      )}
    </div>
  );
}

export function StaffPeriodFilter() {
  return (
    <Suspense>
      <StaffPeriodFilterInner />
    </Suspense>
  );
}
