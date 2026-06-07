"use client";

import { useState } from "react";
import type { MonthMetrics } from "@/modules/orders/services/analytics.service";
import { downloadReportPdf, formatMonthLabel, formatWeekLabel } from "@/lib/analytics-report";
import { fetchTeamWeeklyReport } from "@/modules/users/actions/team-analytics.action";

type Props = {
  monthlyData: MonthMetrics;
  month: string; // "YYYY-MM"
  teamName: string;
};

export function TeamAnalyticsReportButtons({ monthlyData, month, teamName }: Props) {
  const [loading, setLoading] = useState<"weekly" | "monthly" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleMonthly() {
    setLoading("monthly");
    setError(null);
    try {
      await downloadReportPdf(monthlyData, "monthly", formatMonthLabel(month), `${teamName} (Team)`);
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
      const result = await fetchTeamWeeklyReport();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      await downloadReportPdf(result, "weekly", formatWeekLabel(), `${teamName} (Team)`);
    } catch {
      setError("Failed to generate the PDF report. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-sm text-red-500 font-medium bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleWeekly}
          disabled={loading !== null}
          className="bg-[#F3E8FF] hover:bg-[#E9D5FF] disabled:opacity-60 text-[#A020F0] px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2"
        >
          {loading === "weekly" ? "Generating PDF…" : "Generate Weekly Report →"}
        </button>
        <button
          onClick={handleMonthly}
          disabled={loading !== null}
          className="bg-[#F3E8FF] hover:bg-[#E9D5FF] disabled:opacity-60 text-[#A020F0] px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2"
        >
          {loading === "monthly" ? "Generating PDF…" : "Generate Monthly Report →"}
        </button>
      </div>
    </div>
  );
}
