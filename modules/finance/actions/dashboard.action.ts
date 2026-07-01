"use server";

import { auth } from "@/lib/auth/auth";
import { getFinancialSummary } from "@/modules/finance/services/dashboard.service";

/**
 * Financial Summary for a specific month (used by the accounting dashboard's
 * month picker). Month is 1-12. Returns null if unauthenticated.
 */
export async function getFinancialSummaryForMonthAction(month: number, year: number) {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;

  // Any day inside the target month resolves to that month's window.
  return getFinancialSummary(new Date(year, month - 1, 1));
}
