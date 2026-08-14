/**
 * Human-readable role names for chat surfaces.
 *
 * Lives here rather than in `chat-people.tsx` because that module is
 * `"use client"` — a server component calling a function exported from it fails
 * at runtime ("Attempted to call roleLabel() from the server").
 */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  SALES_REP: "Sales Representative",
  SALES_REP_MANAGER: "Sales Rep Manager",
  DELIVERY_AGENT: "Delivery Agent",
  DATA_ANALYST: "Data Analyst",
  ACCOUNTANT: "Accountant",
  INVENTORY_MANAGER: "Inventory Manager",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  LOGISTICS_MANAGER: "Logistics Manager",
  MEDIA_BUYER: "Media Buyer",
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "";
  return ROLE_LABELS[role] ?? role.replaceAll("_", " ").toLowerCase();
}
