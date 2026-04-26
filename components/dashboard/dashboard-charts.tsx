"use client";

import React, { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from "recharts";

export type ChartPoint = { name: string; value: number };

const FALLBACK_LINE: ChartPoint[] = [
  { name: "JAN", value: 0 }, { name: "FEB", value: 0 }, { name: "MAR", value: 0 },
  { name: "APR", value: 0 }, { name: "MAY", value: 0 }, { name: "JUN", value: 0 },
  { name: "JUL", value: 0 }, { name: "AUG", value: 0 }, { name: "SEP", value: 0 },
  { name: "OCT", value: 0 }, { name: "NOV", value: 0 }, { name: "DEC", value: 0 },
];

const FALLBACK_BAR: ChartPoint[] = [
  { name: "Mo", value: 0 }, { name: "Tu", value: 0 }, { name: "We", value: 0 },
  { name: "Th", value: 0 }, { name: "Fr", value: 0 }, { name: "Sa", value: 0 },
  { name: "Su", value: 0 },
];

function compactValue(v: number): string {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(1)}K`;
  return v > 0 ? `₦${v.toFixed(0)}` : "₦0";
}

function CurrencyTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-gray-700 mb-0.5">{label}</p>
      <p className="text-gray-500">{compactValue(payload[0].value)}</p>
    </div>
  );
}

function CountTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-gray-700 mb-0.5">{label}</p>
      <p className="text-gray-500">{payload[0].value} orders</p>
    </div>
  );
}

export function DashboardLineChart({
  color = "#8B2FE8",
  data,
}: {
  color?: string;
  data?: ChartPoint[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: "100%", height: 180 }} />;
  }

  const chartData = data ?? FALLBACK_LINE;
  const gradientId = `colorValue-${color.replace("#", "")}`;

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <ResponsiveContainer width="100%" aspect={2.5} minWidth={0}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f0f0f0"
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            dy={10}
          />
          <YAxis hide />
          <Tooltip content={<CurrencyTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            dot={{ r: 4, fill: color, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardBarChart({ data }: { data?: ChartPoint[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: "100%", height: 150 }} />;
  }

  const chartData = data ?? FALLBACK_BAR;
  const maxIdx = chartData.reduce(
    (best, d, i) => (d.value > chartData[best].value ? i : best),
    0
  );

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <ResponsiveContainer width="100%" aspect={2} minWidth={0}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
          />
          <Tooltip cursor={{ fill: "transparent" }} content={<CountTooltip />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={12}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === maxIdx ? "#8B2FE8" : "#E0E7FF"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
