"use server";

import { auth } from "@/lib/auth/auth";
import { getManagerWithTeam, getTeamWeeklyReport } from "../services/users.service";
import type { MonthMetrics } from "@/modules/orders/services/analytics.service";

/**
 * Weekly team analytics for the logged-in manager's team — used by the
 * "Generate Weekly Report" button on the team analytics page.
 */
export async function fetchTeamWeeklyReport(): Promise<MonthMetrics | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const manager = await getManagerWithTeam(session.user.id);
  if (!manager?.teamId) return { error: "No team found" };
  try {
    return await getTeamWeeklyReport(manager.teamId);
  } catch {
    return { error: "Failed to generate weekly report" };
  }
}
