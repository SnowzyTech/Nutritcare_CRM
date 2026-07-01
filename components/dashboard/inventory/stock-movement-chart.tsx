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
import type { ChartDataPoint } from "@/modules/inventory/services/inventory.service";

interface Props {
  data: ChartDataPoint[];
  receivedTotal: number;
  dispatchedTotal: number;
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`;
  return String(value);
}

export function StockMovementChart({ data, receivedTotal, dispatchedTotal }: Props) {
  const maxVal = Math.max(...data.flatMap((d) => [d.received, d.dispatched]), 100);
  // Round up to a "nice" ceiling so the top gridline reads cleanly (e.g. 200k).
  const magnitude = Math.pow(10, Math.max(0, String(Math.round(maxVal)).length - 2));
  const yMax = Math.ceil(maxVal / magnitude) * magnitude;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="bg-white px-6 py-4 border-b border-gray-50 flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-400">Stock movement - 7 Days</h3>
      </div>
      <div className="p-6 bg-white">
        <div className="flex gap-12 mb-8">
          <div>
            <div className="text-lg font-bold text-gray-700">{receivedTotal.toLocaleString()}</div>
            <div className="text-[10px] text-gray-400 font-medium">Received</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-700">{dispatchedTotal.toLocaleString()}</div>
            <div className="text-[10px] text-gray-400 font-medium">Dispatched</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-700">{(receivedTotal - dispatchedTotal).toLocaleString()}</div>
            <div className="text-[10px] text-gray-400 font-medium">Net</div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 12 }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#9CA3AF", fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                width={44}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#9CA3AF", fontWeight: 500 }}
                domain={[0, yMax]}
                tickFormatter={formatCompact}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                formatter={(value: number) => value.toLocaleString()}
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
              />
              <Bar name="Received" dataKey="received" fill="#C6E2FF" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar name="Dispatched" dataKey="dispatched" fill="#2E85FF" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
