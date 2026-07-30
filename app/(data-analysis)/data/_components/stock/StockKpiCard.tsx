import React from "react";

// KPI tile in the data-analysis idiom (matches StatCard in
// data/dashboard/dashboard-client.tsx) rather than the inventory module's
// StatsCard, so the analyst shell stays visually consistent.

type Tone = "default" | "good" | "warn" | "bad";

const TONE_CLASS: Record<Tone, string> = {
  default: "text-gray-900",
  good: "text-emerald-600",
  warn: "text-amber-600",
  bad: "text-rose-500",
};

export function StockKpiCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: Tone;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">{label}</p>
      <p className={`text-2xl font-bold truncate ${TONE_CLASS[tone]}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-[11px] font-medium text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
}
