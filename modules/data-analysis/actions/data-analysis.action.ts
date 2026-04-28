"use server";

import {
  getSalesRepAnalyticsForUI,
  getTeamsAnalytics,
} from "@/modules/data-analysis/services/data-analysis.service";
import type {
  RepAnalyticsData,
  TeamAnalyticsEntry,
} from "@/modules/data-analysis/services/data-analysis.service";

export async function fetchAnalyticsForMonth(
  salesRepId: string,
  month: number,
  year: number
): Promise<RepAnalyticsData> {
  return getSalesRepAnalyticsForUI(salesRepId, { month, year });
}

export async function fetchTeamsAnalyticsForMonth(
  month: number,
  year: number
): Promise<TeamAnalyticsEntry[]> {
  return getTeamsAnalytics({ month, year });
}
