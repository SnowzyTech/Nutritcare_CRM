export const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/admin",
  ADMIN: "/admin",
  SALES_REP: "/sales-rep",
  SALES_REP_MANAGER: "/sales-manager",
  DELIVERY_AGENT: "/delivery-agents",
  DATA_ANALYST: "/data",
  ACCOUNTANT: "/accounting",
  INVENTORY_MANAGER: "/inventory",
  WAREHOUSE_MANAGER: "/warehouse",
  LOGISTICS_MANAGER: "/logistics",
  MEDIA_BUYER: "/media-buyer",
};

export function getRoleHome(role: string | null | undefined): string {
  if (!role) return "/login";
  return ROLE_HOME[role] ?? "/login";
}

/** True only for the full-access super admin. */
export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === "SUPER_ADMIN";
}

/** True for either admin tier (limited ADMIN or SUPER_ADMIN). */
export function isAdmin(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/**
 * True for anyone who may view the company-wide sales-manager dashboard: the
 * dedicated SALES_REP_MANAGER and the SUPER_ADMIN (read-only oversight). Note
 * this is view access only — mutating actions still re-check SALES_REP_MANAGER.
 */
export function isCompanySalesManager(role: string | null | undefined): boolean {
  return role === "SALES_REP_MANAGER" || role === "SUPER_ADMIN";
}
