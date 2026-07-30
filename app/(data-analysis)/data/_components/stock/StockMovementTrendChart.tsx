"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { StockTrendPoint } from "@/modules/data-analysis/services/stock-analysis.service";

// Three-series grouped bars: units received / dispatched / returned over the
// selected window. Modelled on components/dashboard/inventory/stock-movement-chart
// but honours the filter range (and its bucket) instead of a fixed 7 days.
//
// Palette validated with the dataviz validator (light, surface #fcfcfb,
// --pairs all): lightness band, chroma floor, CVD separation (worst pair
// ΔE 14.1 protan) and normal-vision floor all PASS. The amber carries a
// contrast WARN vs the surface, which the always-on legend + the direct value
// tiles below the plot discharge.
const SERIES = [
  { key: "received", label: "Received", color: "#8B2FE8" },
  { key: "dispatched", label: "Dispatched", color: "#0E9F9F" },
  { key: "returned", label: "Returned", color: "#E8892F" },
] as const;

const BUCKET_LABEL: Record<string, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
};

function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1C24] text-white rounded-lg px-3 py-2 text-[10px] shadow-lg border border-[#2D2D35] min-w-[130px]">
      <p className="font-semibold text-gray-300 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-gray-400">{p.name}</span>
          </span>
          <span className="text-white font-bold">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

type Props = {
  data: StockTrendPoint[];
  bucket: "day" | "week" | "month";
  rangeLabel: string;
};

export function StockMovementTrendChart({ data, bucket, rangeLabel }: Props) {
  const totals = SERIES.map((s) => ({
    ...s,
    total: data.reduce((sum, d) => sum + d[s.key], 0),
  }));
  const net = totals[0].total + totals[2].total - totals[1].total;
  const isEmpty = totals.every((t) => t.total === 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-[13px] font-bold text-gray-900">Stock Movement Trend</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {BUCKET_LABEL[bucket]} · {rangeLabel}
          </p>
        </div>
        {/* Legend — always present for multi-series, so identity is never colour-alone. */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                {s.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 240 }} className="relative mt-4">
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-gray-400 z-10">
            No stock movement in this period
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#9CA3AF", fontWeight: 600 }}
              dy={6}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#9CA3AF", fontWeight: 600 }}
              tickFormatter={(v) => (v === 0 ? "0" : fmtCompact(v))}
            />
            <Tooltip cursor={{ fill: "rgba(139,47,232,0.04)" }} content={<TrendTooltip />} />
            {SERIES.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                barSize={8}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Direct value tiles — the secondary encoding backing the legend. */}
      <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-50">
        {totals.map((t) => (
          <div key={t.key}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              {t.label}
            </p>
            <p className="text-base font-bold text-gray-900">{t.total.toLocaleString()}</p>
          </div>
        ))}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Net</p>
          <p className={`text-base font-bold ${net >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {net >= 0 ? "+" : ""}
            {net.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
