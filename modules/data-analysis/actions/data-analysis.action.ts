"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import {
  getSalesRepAnalyticsForUI,
  getTeamsAnalytics,
  getCompanyAnalytics,
  hardDeleteOrder,
} from "@/modules/data-analysis/services/data-analysis.service";
import type {
  RepAnalyticsData,
  TeamAnalyticsEntry,
  Period,
} from "@/modules/data-analysis/services/data-analysis.service";
import { getSalesRepWeeklyAnalytics } from "@/modules/orders/services/analytics.service";
import type { MonthMetrics } from "@/modules/orders/services/analytics.service";

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
  return getTeamsAnalytics({ month, year, period: "month" });
}

export async function fetchCompanyAnalyticsForMonth(
  month: number,
  year: number
): Promise<RepAnalyticsData> {
  return getCompanyAnalytics({ month, year, period: "month" });
}

export async function fetchTeamsAnalyticsForPeriod(
  period: Period,
  month?: number,
  year?: number
): Promise<TeamAnalyticsEntry[]> {
  return getTeamsAnalytics({ month, year, period });
}

/**
 * Weekly analytics for a specific sales rep — used by the data analyst's
 * per-rep analytics report (weekly PDF) so it reflects that rep, not the viewer.
 */
export async function fetchRepWeeklyAnalytics(
  salesRepId: string
): Promise<MonthMetrics | { error: string }> {
  try {
    return await getSalesRepWeeklyAnalytics(salesRepId);
  } catch {
    return { error: "Failed to generate weekly report" };
  }
}

export async function fetchCompanyAnalyticsForPeriod(
  period: Period,
  month?: number,
  year?: number
): Promise<RepAnalyticsData> {
  return getCompanyAnalytics({ month, year, period });
}

/**
 * Permanently delete an order (hard delete).
 * This action is only available to data analysts.
 */
export async function deleteOrderPermanently(
  orderNumber: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const result = await hardDeleteOrder(orderNumber, session?.user?.id);

  if (result.success) {
    revalidatePath("/data/order");
    revalidatePath("/data");
    revalidatePath("/data/history");
  }

  return result;
}
