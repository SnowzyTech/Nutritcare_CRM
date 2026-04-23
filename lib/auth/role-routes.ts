export const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  SALES_REP: "/sales-rep",
  DELIVERY_AGENT: "/delivery-agents",
  DATA_ANALYST: "/data",
  ACCOUNTANT: "/accounting",
  INVENTORY_MANAGER: "/inventory",
  WAREHOUSE_MANAGER: "/warehouse",
  LOGISTICS_MANAGER: "/logistics",
};

export function getRoleHome(role: string | null | undefined): string {
  if (!role) return "/login";
  return ROLE_HOME[role] ?? "/login";
}
