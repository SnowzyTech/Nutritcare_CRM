"use server";

import { auth } from "@/lib/auth/auth";
import { getAccountingAccess } from "@/lib/auth/accounting-access";
import {
  getFinancialSummary,
  getSalesByProduct,
  getSalesByState,
  resolvePeriodRange,
  type DashboardPeriod,
} from "@/modules/finance/services/dashboard.service";

/**
 * Financial Summary for a specific month (used by the accounting dashboard's
 * month picker). Month is 1-12. Returns null if unauthenticated.
 */
export async function getFinancialSummaryForMonthAction(month: number, year: number) {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!(await getAccountingAccess()).FINANCIAL_SUMMARY) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;

  // Any day inside the target month resolves to that month's window.
  return getFinancialSummary(new Date(year, month - 1, 1));
}

/**
 * Sales-by-product and sales-by-state for a specific period (the accounting
 * dashboard's activity-chart filter). Supports the current week or a specific
 * calendar month. Returns null if unauthenticated or the period is invalid.
 */
export async function getSalesBreakdownForPeriodAction(period: DashboardPeriod) {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!(await getAccountingAccess()).SALES_ANALYTICS) return null;

  if (period?.type === "month") {
    if (
      !Number.isInteger(period.month) || period.month < 1 || period.month > 12 ||
      !Number.isInteger(period.year)
    ) {
      return null;
    }
  } else if (period?.type !== "week") {
    return null;
  }

  const range = resolvePeriodRange(period);
  const [byProduct, byState] = await Promise.all([
    getSalesByProduct(range),
    getSalesByState(range),
  ]);
  return { byProduct, byState };
}
