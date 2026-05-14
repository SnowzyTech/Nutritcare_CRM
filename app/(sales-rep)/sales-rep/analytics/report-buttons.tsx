"use client";

import React, { useRef, useState } from "react";
import { getWeeklyAnalyticsAction } from "@/modules/orders/actions/orders.action";
import type { MonthMetrics } from "@/modules/orders/services/analytics.service";

type Props = {
  monthlyData: MonthMetrics;
  month: string; // "YYYY-MM"
  salesRepName: string;
};

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-");
  return new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(
    new Date(Number(year), Number(m) - 1, 1)
  );
}

function formatWeekLabel() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(d);
  return `${fmt(weekStart)} – ${fmt(now)}`;
}

function KPIRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1 pr-6 text-sm text-gray-600 font-medium">{label}</td>
      <td className="py-1 text-sm text-gray-900 font-bold text-right">{value}</td>
    </tr>
  );
}

export function AnalyticsReportButtons({ monthlyData, month, salesRepName }: Props) {
  const [loading, setLoading] = useState<"weekly" | "monthly" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<MonthMetrics>(monthlyData);
  const [reportType, setReportType] = useState<"monthly" | "weekly">("monthly");
  const [reportPeriod, setReportPeriod] = useState(formatMonthLabel(month));
  const printRef = useRef<HTMLDivElement>(null);

  async function handleMonthly() {
    setLoading("monthly");
    setError(null);
    setReportData(monthlyData);
    setReportType("monthly");
    setReportPeriod(formatMonthLabel(month));
    setLoading(null);
    setTimeout(() => window.print(), 100);
  }

  async function handleWeekly() {
    setLoading("weekly");
    setError(null);
    const result = await getWeeklyAnalyticsAction();
    if ("error" in result) {
      setError(result.error);
      setLoading(null);
      return;
    }
    setReportData(result);
    setReportType("weekly");
    setReportPeriod(formatWeekLabel());
    setLoading(null);
    setTimeout(() => window.print(), 100);
  }

  const generatedAt = new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  return (
    <>
      {error && (
        <p className="text-sm text-red-500 font-medium bg-red-50 border border-red-200 rounded-lg px-4 py-2 print:hidden">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 print:hidden">
        <button
          onClick={handleWeekly}
          disabled={loading !== null}
          className="bg-purple-100 border border-purple-200 px-5 py-3 rounded-lg font-semibold text-purple-600 text-sm flex items-center justify-center gap-2 hover:bg-purple-50 transition disabled:opacity-60"
        >
          {loading === "weekly" ? "Generating…" : "Generate Weekly Report →"}
        </button>
        <button
          onClick={handleMonthly}
          disabled={loading !== null}
          className="bg-purple-100 border border-purple-200 px-5 py-3 rounded-lg font-semibold text-purple-600 text-sm flex items-center justify-center gap-2 hover:bg-purple-50 transition disabled:opacity-60"
        >
          {loading === "monthly" ? "Generating…" : "Generate Monthly Report →"}
        </button>
      </div>

      {/* Print-only report */}
      <div ref={printRef} className="hidden print:block p-8 font-sans text-gray-900">
        <div className="border-b-2 border-purple-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-purple-700">NutritCare CRM</h1>
              <p className="text-sm text-gray-500">Sales Performance Report</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">{salesRepName}</p>
              <p className="text-sm text-gray-500 capitalize">{reportType} Report</p>
              <p className="text-sm text-gray-500">{reportPeriod}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Generated: {generatedAt}</p>
        </div>

        <h2 className="text-base font-bold text-gray-700 mb-3 uppercase tracking-wide">Key Performance Indicators</h2>
        <table className="w-full mb-8">
          <tbody>
            <KPIRow label="Total Products Sold" value={reportData.totalProductsSold.toString()} />
            <KPIRow label="Total Orders" value={reportData.totalOrders.toString()} />
            <KPIRow label="Unique Customers" value={reportData.uniqueCustomers.toString()} />
            <KPIRow label="Best Selling Product" value={reportData.bestSellingProduct} />
            <KPIRow label="General Performance" value={`${reportData.generalPerformance}%`} />
            <KPIRow label="Upselling Rate" value={`${reportData.upsellRate}%`} />
            <KPIRow label="Confirmation Rate" value={`${reportData.confirmationRate}%`} />
            <KPIRow label="Delivery Rate" value={`${reportData.deliveryRate}%`} />
            <KPIRow label="Cancellation Rate" value={`${reportData.cancellationRate}%`} />
            <KPIRow label="Recovery Rate" value={`${reportData.recoveryRate}%`} />
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-base font-bold text-gray-700 mb-3 uppercase tracking-wide">Best Selling Products</h2>
            {reportData.topProducts.length === 0 ? (
              <p className="text-sm text-gray-400">No delivered orders in this period.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1 text-xs font-semibold text-gray-500">Product</th>
                    <th className="text-right py-1 text-xs font-semibold text-gray-500">Units</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topProducts.map((p) => (
                    <tr key={p.name} className="border-b border-gray-100">
                      <td className="py-1 text-sm text-gray-800">{p.name}</td>
                      <td className="py-1 text-sm text-gray-800 font-semibold text-right">{p.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-700 mb-3 uppercase tracking-wide">Upselling — Multi-Item Orders</h2>
            {reportData.upsoldProducts.length === 0 ? (
              <p className="text-sm text-gray-400">No multi-item orders in this period.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1 text-xs font-semibold text-gray-500">Product</th>
                    <th className="text-right py-1 text-xs font-semibold text-gray-500">Upsells</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.upsoldProducts.map((p) => (
                    <tr key={p.name} className="border-b border-gray-100">
                      <td className="py-1 text-sm text-gray-800">{p.name}</td>
                      <td className="py-1 text-sm text-gray-800 font-semibold text-right">{p.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="mt-10 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">NutritCare CRM — Confidential</p>
        </div>
      </div>
    </>
  );
}
