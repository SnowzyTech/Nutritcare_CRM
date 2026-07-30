"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { StockFilterBar } from "../_components/stock/StockFilterBar";
import { StockKpiCard } from "../_components/stock/StockKpiCard";
import { StockMovementTrendChart } from "../_components/stock/StockMovementTrendChart";
import type {
  StockOverview,
  StockFilterOptions,
} from "@/modules/data-analysis/services/stock-analysis.service";

const SECTIONS = [
  { href: "/data/stock/incoming", label: "Incoming", key: "incomingCount" },
  { href: "/data/stock/outgoing", label: "Outgoing", key: "outgoingCount" },
  { href: "/data/stock/returned", label: "Returned", key: "returnCount" },
  { href: "/data/stock/transfer", label: "Transfers", key: "transferCount" },
  { href: "/data/stock/adjustment", label: "Adjustments", key: "adjustmentCount" },
] as const;

export function StockOverviewClient({
  overview,
  options,
}: {
  overview: StockOverview;
  options: StockFilterOptions;
}) {
  const { balances, flows, health } = overview;

  return (
    <div className="p-8 max-w-[1400px] mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Analysis</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Movement flows and current balances across warehouses and agents
        </p>
      </div>

      <StockFilterBar
        options={options}
        fields={["product", "warehouse"]}
        searchPlaceholder="Search…"
      />

      {/* ── Balances (StockLevel-derived) ───────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">
          Current Balances
        </h2>
        <span className="text-[10px] font-medium text-gray-400">
          live totals — not affected by the date filter
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StockKpiCard
          label="Total Stock"
          value={balances.totalStock}
          sub={`${balances.activeSkus} active SKUs`}
        />
        <StockKpiCard
          label="In Warehouses"
          value={balances.warehouseStock}
          sub={`${balances.warehouseCount} warehouse${balances.warehouseCount === 1 ? "" : "s"}`}
        />
        <StockKpiCard
          label="With Agents"
          value={balances.agentStock}
          sub={`${balances.agentCount} agent${balances.agentCount === 1 ? "" : "s"}`}
        />
        <StockKpiCard label="Unassigned" value={balances.unassignedStock} sub="not yet allocated" />
        <StockKpiCard
          label="Low Stock"
          value={balances.lowStockCount}
          sub="below minimum"
          tone={balances.lowStockCount > 0 ? "bad" : "good"}
        />
      </div>

      {/* ── Flows in the selected window ────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">
          Movement Flows
        </h2>
        <span className="text-[10px] font-medium text-gray-400">{overview.rangeLabel}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
        <StockKpiCard
          label="Units Received"
          value={flows.unitsReceived}
          sub={
            flows.rapsWithheld > 0
              ? `${flows.rapsWithheld.toLocaleString()} RAPS units excluded`
              : `${flows.incomingCount} movements`
          }
        />
        <StockKpiCard
          label="Units Dispatched"
          value={flows.unitsDispatched}
          sub={`${flows.outgoingCount} movements`}
        />
        <StockKpiCard
          label="Units Returned"
          value={flows.unitsReturned}
          sub={`${flows.returnCount} movements`}
        />
        <StockKpiCard
          label="Net Flow"
          value={`${flows.net >= 0 ? "+" : ""}${flows.net.toLocaleString()}`}
          sub="received + returned − dispatched"
          tone={flows.net >= 0 ? "good" : "bad"}
        />
        <StockKpiCard
          label="Transfers / Adj."
          value={`${flows.transferCount} / ${flows.adjustmentCount}`}
          sub="completed in period"
        />
      </div>

      <div className="flex items-start gap-2 mb-8 px-1">
        <Info className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-400">
          Flow figures exclude draft and reversed records. Incoming counts only once stock is
          received or shelved, and RAPS units are excluded because they are never credited to stock.
          Balances are read from stock levels, not derived from movement history.
        </p>
      </div>

      {/* ── Trend + health ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="lg:col-span-2">
          <StockMovementTrendChart
            data={overview.trend}
            bucket={overview.trendBucket}
            rangeLabel={overview.rangeLabel}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-[13px] font-bold text-gray-900 mb-5">Needs Attention</h3>
          <div className="flex flex-col gap-4">
            {[
              {
                label: "Pending RAPS approvals",
                value: health.pendingRaps,
                href: "/data/stock/incoming?status=RECEIVED",
              },
              { label: "Reversed in period", value: health.reversedInPeriod, href: null },
              {
                label: "Pending adjustments",
                value: health.pendingAdjustments,
                href: "/data/stock/adjustment?status=PENDING_APPROVAL",
              },
              { label: "Open damage reports", value: health.openDamageReports, href: null },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-medium text-gray-500">{row.label}</span>
                <span
                  className={`text-base font-bold ${row.value > 0 ? "text-amber-600" : "text-gray-300"}`}
                >
                  {row.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-50 mt-5 pt-4 flex flex-col gap-2">
            {SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="flex items-center justify-between text-[12px] font-semibold text-gray-500 hover:text-[#8B2FE8] transition-colors group"
              >
                <span>{s.label}</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-gray-400 group-hover:text-[#8B2FE8]">
                    {flows[s.key].toLocaleString()}
                  </span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top movers + low stock ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-[13px] font-bold text-gray-900">Top Moving Products</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">By total units moved in period</p>
          </div>
          {overview.topMovers.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">No movement in this period.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-2.5">Product</th>
                  <th className="px-6 py-2.5">SKU</th>
                  <th className="px-6 py-2.5 text-right">Dispatched</th>
                  <th className="px-6 py-2.5 text-right">Total Moved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {overview.topMovers.map((m) => (
                  <tr key={m.productId}>
                    <td className="px-6 py-3 text-[12px] font-semibold text-gray-800">{m.product}</td>
                    <td className="px-6 py-3 text-[12px] text-gray-500">{m.sku}</td>
                    <td className="px-6 py-3 text-[12px] text-gray-600 text-right">
                      {m.dispatched.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-[12px] font-bold text-gray-900 text-right">
                      {m.net.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-[13px] font-bold text-gray-900">Low & Watch Stock</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Current balance against minimum</p>
          </div>
          {overview.lowStock.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">
              All products are above their minimum.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-2.5">Product</th>
                  <th className="px-6 py-2.5">Category</th>
                  <th className="px-6 py-2.5 text-right">Qty</th>
                  <th className="px-6 py-2.5 text-right">Min</th>
                  <th className="px-6 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {overview.lowStock.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-3 text-[12px] font-semibold text-gray-800">{s.product}</td>
                    <td className="px-6 py-3 text-[12px] text-gray-500">{s.category}</td>
                    <td className="px-6 py-3 text-[12px] font-bold text-gray-900 text-right">
                      {s.qty.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-[12px] text-gray-400 text-right">
                      {s.min.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          s.status === "Low"
                            ? "bg-rose-50 text-rose-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
