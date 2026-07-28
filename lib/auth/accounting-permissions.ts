import { isAdmin } from "./role-routes";

/**
 * Registry of the gated accounting features an ADMIN can grant per accountant.
 * Positive-grant model (inverse of `revokedAdminPages`): default = none granted,
 * so a normal ACCOUNTANT sees none of these; a "head of accounting" is simply an
 * accountant granted them. Single source of truth for the admin toggle UI, the
 * dashboard/sidebar gates, and the page guards.
 */
export type AccountingPermission =
  | "FINANCIAL_SUMMARY"
  | "INVENTORY_SNAPSHOT"
  | "SALES_ANALYTICS"
  | "SALARY"
  | "REPORTS";

export interface AccountingPermissionDef {
  key: AccountingPermission;
  label: string;
  description: string;
}

export const ACCOUNTING_PERMISSIONS: AccountingPermissionDef[] = [
  { key: "FINANCIAL_SUMMARY", label: "Financial Summary", description: "Revenue, profit, expenses and tax cards on the dashboard." },
  { key: "INVENTORY_SNAPSHOT", label: "Inventory Snapshot", description: "Inventory value and stock breakdown on the dashboard." },
  { key: "SALES_ANALYTICS", label: "Sales Analytics", description: "Sales-trend and sales-by-product/state charts on the dashboard." },
  { key: "SALARY", label: "Salary", description: "The Salary page and payroll records." },
  { key: "REPORTS", label: "Reports", description: "The accounting Reports pages (P&L, balance sheet, etc.)." },
];

export const ACCOUNTING_PERMISSION_KEYS: AccountingPermission[] =
  ACCOUNTING_PERMISSIONS.map((p) => p.key);

/**
 * Can this user access the given gated accounting feature?
 * - ADMIN / SUPER_ADMIN (incl. account view-as): always.
 * - ACCOUNTANT: only if the feature is in their granted list.
 */
export function canAccessAccounting(
  role: string | null | undefined,
  granted: string[],
  key: AccountingPermission
): boolean {
  if (isAdmin(role)) return true;
  return granted.includes(key);
}
