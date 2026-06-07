"use client";

import { useState } from "react";
import { fetchRepWeeklyAnalytics } from "@/modules/data-analysis/actions/data-analysis.action";
import type { MonthMetrics } from "@/modules/orders/services/analytics.service";
import { downloadReportPdf, formatMonthLabel, formatWeekLabel } from "@/lib/analytics-report";

type Props = {
  repId: string;
  repName: string;
  monthlyData: MonthMetrics;
  month: string; // "YYYY-MM"
};

export function RepAnalyticsReportButtons({ repId, repName, monthlyData, month }: Props) {
  const [loading, setLoading] = useState<"weekly" | "monthly" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleMonthly() {
    setLoading("monthly");
    setError(null);
    try {
      await downloadReportPdf(monthlyData, "monthly", formatMonthLabel(month), repName);
    } catch {
      setError("Failed to generate the PDF report. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleWeekly() {
    setLoading("weekly");
    setError(null);
    try {
      const result = await fetchRepWeeklyAnalytics(repId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      await downloadReportPdf(result, "weekly", formatWeekLabel(), repName);
    } catch {
      setError("Failed to generate the PDF report. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      {error && (
        <p className="text-sm text-red-500 font-medium bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handleWeekly}
          disabled={loading !== null}
          className="bg-purple-100 border border-purple-200 px-5 py-3 rounded-lg font-semibold text-purple-600 text-sm flex items-center justify-center gap-2 hover:bg-purple-50 transition disabled:opacity-60"
        >
          {loading === "weekly" ? "Generating PDF…" : "Generate Weekly Report →"}
        </button>
        <button
          onClick={handleMonthly}
          disabled={loading !== null}
          className="bg-purple-100 border border-purple-200 px-5 py-3 rounded-lg font-semibold text-purple-600 text-sm flex items-center justify-center gap-2 hover:bg-purple-50 transition disabled:opacity-60"
        >
          {loading === "monthly" ? "Generating PDF…" : "Generate Monthly Report →"}
        </button>
      </div>
    </>
  );
}
