"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { toDateParam, type DatePreset } from "@/lib/date-period";

const PRESETS: { key: Exclude<DatePreset, "custom">; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Last 7 Days" },
  { key: "month", label: "This Month" },
];

/**
 * Date-range filter for the department overview boards. Drives
 * `?preset=…` (for the quick presets) or `?from=YYYY-MM-DD&to=YYYY-MM-DD`
 * (for a custom day / span). Defaults to "Today" when nothing is set.
 */
function DateRangeFilterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const preset = searchParams.get("preset");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Active preset: explicit preset param, else "today" when nothing custom is set.
  const activePreset = preset ?? (from ? "custom" : "today");

  const setPreset = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", key);
    params.delete("from");
    params.delete("to");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const setCustom = (nextFrom: string, nextTo: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("preset");
    if (nextFrom) params.set("from", nextFrom);
    else params.delete("from");
    if (nextTo) params.set("to", nextTo);
    else params.delete("to");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const today = toDateParam(new Date());
  // For the inputs, show the current custom range when active.
  const fromValue = from ?? "";
  const toValue = to ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
        {PRESETS.map((p) => {
          const active = activePreset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPreset(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                active
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div
        className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-colors ${
          activePreset === "custom" ? "border-purple-300 bg-purple-50/50" : "border-slate-200 bg-white"
        }`}
      >
        <CalendarDays size={15} className="text-slate-400 shrink-0" />
        <input
          type="date"
          max={today}
          value={fromValue}
          onChange={(e) => setCustom(e.target.value, toValue || e.target.value)}
          className="bg-transparent text-xs font-medium text-slate-600 outline-none"
          aria-label="From date"
        />
        <span className="text-slate-300 text-xs">→</span>
        <input
          type="date"
          max={today}
          value={toValue}
          onChange={(e) => setCustom(fromValue || e.target.value, e.target.value)}
          className="bg-transparent text-xs font-medium text-slate-600 outline-none"
          aria-label="To date"
        />
      </div>
    </div>
  );
}

export function DateRangeFilter() {
  return (
    <Suspense>
      <DateRangeFilterInner />
    </Suspense>
  );
}
