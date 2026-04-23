"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
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

const lineData = [
  { name: "JAN", value: 40 },
  { name: "FEB", value: 30 },
  { name: "MAR", value: 35 },
  { name: "APR", value: 50 },
  { name: "MAY", value: 45 },
  { name: "JUN", value: 60 },
  { name: "JUL", value: 55 },
  { name: "AUG", value: 70 },
  { name: "SEP", value: 65 },
  { name: "OCT", value: 80 },
  { name: "NOV", value: 75 },
  { name: "DEC", value: 90 },
];

const barData = [
  { name: "Mo", value: 400 },
  { name: "Tu", value: 300 },
  { name: "We", value: 500 },
  { name: "Th", value: 450 },
  { name: "Fr", value: 600 },
  { name: "Sa", value: 350 },
  { name: "Su", value: 200 },
];

export function DashboardLineChart({ color = "#8B2FE8" }: { color?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: "100%", height: 180 }} />;
  }

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <ResponsiveContainer width="100%" aspect={2.5} minWidth={0}>
        <AreaChart data={lineData}>
          <defs>
            <linearGradient id={`colorValue-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            dy={10}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            fillOpacity={1}
            fill={`url(#colorValue-${color.replace("#", "")})`}
            dot={{ r: 4, fill: color, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardBarChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: "100%", height: 150 }} />;
  }

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <ResponsiveContainer width="100%" aspect={2} minWidth={0}>
        <BarChart data={barData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
          />
          <Tooltip cursor={{ fill: "transparent" }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={12}>
            {barData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 4 ? "#8B2FE8" : "#E0E7FF"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
