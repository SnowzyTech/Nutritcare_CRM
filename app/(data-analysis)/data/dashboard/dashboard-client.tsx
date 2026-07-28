"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { DashboardLineChart, DashboardBarChart, type ChartPoint } from "@/components/dashboard/dashboard-charts";
import type { RepAnalyticsData, TeamAnalyticsEntry } from "@/modules/data-analysis/services/data-analysis.service";

type SalesBarPoint = { name: string; fullName?: string; value: number; quantity?: number; isMax?: boolean };

interface Props {
  company: RepAnalyticsData;
  teams: TeamAnalyticsEntry[];
  weeklyOrders: ChartPoint[];
  monthlyOrders: ChartPoint[];
  salesByProduct: SalesBarPoint[];
  salesByState: SalesBarPoint[];
  year: number;
}

function fmtCompact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function BarChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: SalesBarPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-[#1C1C24] text-white rounded-lg px-3 py-2 text-[10px] shadow-lg border border-[#2D2D35] flex flex-col items-center">
      <p className="font-semibold text-gray-300">{p.payload.fullName ?? p.payload.name}</p>
      {p.payload.quantity != null && <p className="text-gray-400">{p.payload.quantity.toLocaleString()} units</p>}
      <p className="text-white font-bold">₦{p.value.toLocaleString()}</p>
    </div>
  );
}

function StatCard({ label, value, change, isPositive }: { label: string; value: string | number; change: string; isPositive: boolean }) {
  const hasChange = change && change !== "—";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">{label}</p>
      <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
      {hasChange && (
        <p className={`text-[11px] font-bold mt-1.5 ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
          {change} <span className="text-gray-400 font-medium">vs last month</span>
        </p>
      )}
    </div>
  );
}

function SalesBarChartCard({ title, data }: { title: string; data: SalesBarPoint[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-[13px] font-bold text-gray-900 mb-6">{title}</h3>
      <div style={{ width: "100%", height: 220 }} className="relative">
        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-gray-400">
            No delivered sales this period
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#9CA3AF", fontWeight: 600 }} dy={8} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 8, fill: "#9CA3AF", fontWeight: 600 }}
              tickFormatter={(val) => (val === 0 ? "0" : fmtCompact(val))}
            />
            <Tooltip cursor={{ fill: "transparent" }} content={<BarChartTooltip />} />
            <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={10}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.isMax ? "#8B2FE8" : "#E5E7EB"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DashboardClient({ company, teams, weeklyOrders, monthlyOrders, salesByProduct, salesByState, year }: Props) {
  const totalWeeklyOrders = weeklyOrders.reduce((s, d) => s + d.value, 0);
  const totalYearlyOrders = monthlyOrders.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto p-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Company-wide order and sales overview</p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {company.metrics.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} change={m.change} isPositive={m.isPositive} />
        ))}
      </div>

      {/* ── Order volume trend charts ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase">Orders {year}</p>
              <p className="text-xl font-bold text-gray-900">{totalYearlyOrders.toLocaleString()} orders</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#8B2FE8]" />
              <span className="text-[11px] font-bold text-[#8B2FE8] uppercase">Monthly Trend</span>
            </div>
          </div>
          <DashboardLineChart color="#8B2FE8" data={monthlyOrders} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase">This Week</p>
              <p className="text-xl font-bold text-gray-900">{totalWeeklyOrders.toLocaleString()} orders</p>
            </div>
          </div>
          <DashboardBarChart data={weeklyOrders} />
        </div>
      </div>

      {/* ── Sales breakdown ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SalesBarChartCard title="Sales by Product (Delivered)" data={salesByProduct} />
        <SalesBarChartCard title="Sales by State (Delivered)" data={salesByState} />
      </div>

      {/* ── Team performance ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-[13px] font-bold text-gray-900">Team Performance</h3>
          <Link href="/data/analytics" className="text-[11px] font-bold text-[#8B2FE8] hover:underline">
            View full analytics →
          </Link>
        </div>
        {teams.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No teams configured yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-2.5">Team</th>
                <th className="px-6 py-2.5 text-right">Total Orders</th>
                <th className="px-6 py-2.5 text-right">Delivery Rate</th>
                <th className="px-6 py-2.5 text-right">General Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teams.map((t) => {
                const orders = t.currentMetrics.metrics.find((m) => m.label === "Total Orders")?.value ?? 0;
                const deliveryRate = t.currentMetrics.metrics.find((m) => m.label === "Delivery Rate")?.value ?? "—";
                const generalPerformance = t.currentMetrics.metrics.find((m) => m.label === "General Performance")?.value ?? "—";
                return (
                  <tr key={t.teamId}>
                    <td className="px-6 py-3 font-semibold text-gray-800">{t.teamName}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{orders}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{deliveryRate}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{generalPerformance}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
