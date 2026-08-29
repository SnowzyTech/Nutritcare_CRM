import type { Department } from "@prisma/client";

/**
 * Granular departments used by the staff/manage-account filter.
 *
 * The Prisma `Department` enum is coarse (Inventory and Logistics are lumped
 * into `INVENTORY_LOGISTICS` and Warehouse has no value of its own), so staff
 * are classified by their role instead, which distinguishes Inventory,
 * Logistics and Warehouse managers.
 */
export type UiDepartment =
  | "SALES"
  | "INVENTORY"
  | "LOGISTICS"
  | "WAREHOUSE"
  | "ACCOUNTING"
  | "DATA";

export const UI_DEPARTMENTS: { value: UiDepartment; label: string }[] = [
  { value: "SALES", label: "Sales" },
  { value: "INVENTORY", label: "Inventory" },
  { value: "LOGISTICS", label: "Logistics" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "ACCOUNTING", label: "Accounting" },
  { value: "DATA", label: "Data" },
];

/** Maps each user role to its granular department. */
export const ROLE_TO_UI_DEPT: Record<string, UiDepartment> = {
  SALES_REP: "SALES",
  SALES_REP_MANAGER: "SALES",
  INVENTORY_MANAGER: "INVENTORY",
  WAREHOUSE_MANAGER: "WAREHOUSE",
  LOGISTICS_MANAGER: "LOGISTICS",
  DELIVERY_AGENT: "LOGISTICS",
  ACCOUNTANT: "ACCOUNTING",
  DATA_ANALYST: "DATA",
};

/** Maps a granular department back to the coarse Prisma `Department` a Team stores. */
export const UI_DEPT_TO_TEAM_DEPT: Record<UiDepartment, Department> = {
  SALES: "SALES",
  INVENTORY: "INVENTORY_LOGISTICS",
  LOGISTICS: "INVENTORY_LOGISTICS",
  WAREHOUSE: "INVENTORY_LOGISTICS",
  ACCOUNTING: "ACCOUNTING",
  DATA: "DATA",
};

export const UI_DEPT_LABELS: Record<UiDepartment, string> = Object.fromEntries(
  UI_DEPARTMENTS.map((d) => [d.value, d.label]),
) as Record<UiDepartment, string>;

export const UI_DEPT_ORDER: UiDepartment[] = UI_DEPARTMENTS.map((d) => d.value);

/**
 * Department dropdown values shared by every "filter staff by department"
 * surface (History, chat oversight). `MEDIA` and `ADMIN` sit outside
 * `UI_DEPARTMENTS` because their roles have no granular department.
 */
export const DEPARTMENT_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "All Departments" },
  ...UI_DEPARTMENTS,
  { value: "MEDIA", label: "Media Buyer" },
  { value: "ADMIN", label: "Admin" },
];

/** Which user roles belong to a `DEPARTMENT_FILTERS` value. */
export function rolesForDepartment(dept: string): string[] {
  if (dept === "ADMIN") return ["ADMIN", "SUPER_ADMIN"];
  if (dept === "MEDIA") return ["MEDIA_BUYER"];
  return Object.entries(ROLE_TO_UI_DEPT)
    .filter(([, d]) => d === dept)
    .map(([role]) => role);
}
