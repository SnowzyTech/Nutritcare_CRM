import { isAdmin, isSuperAdmin } from "./role-routes";

/**
 * Registry of the limited-admin pages whose access a SUPER_ADMIN can revoke
 * per admin. Single source of truth — drives the sidebar, the server-side route
 * guards, and the Super Admin toggle UI so they never diverge.
 *
 * Note: the Dashboard (`/admin`) is the always-available landing page and is NOT
 * revocable; the Account page (`/admin/account`) is SUPER_ADMIN-only and is not
 * part of this set.
 */
export type AdminPageKey =
  | "staff"
  | "access-control"
  | "overview"
  | "orders"
  | "inventory"
  | "forms"
  | "history"
  | "chat";

export interface AdminPageDef {
  key: AdminPageKey;
  /** Human label shown in the Super Admin toggle UI. */
  label: string;
  /** Must match the corresponding `allNavItems` entry label in nav-config.ts. */
  navLabel: string;
  /** One-line explanation of what the page is (shown in the access-control UI). */
  description: string;
  /** Route prefixes this page covers (nested routes included). */
  prefixes: string[];
}

export const ADMIN_PAGES: AdminPageDef[] = [
  // `access-control` must precede `staff` — its path is a sub-path of /admin/staff,
  // so the more specific prefix has to match first in getAdminPageKeyForPath.
  { key: "access-control", label: "Access Control", navLabel: "Access Control", description: "Grant/revoke accounting features for accountants.", prefixes: ["/admin/staff/admins"] },
  { key: "staff", label: "Staff Management", navLabel: "Staff Management", description: "View and manage all staff accounts, teams and approvals.", prefixes: ["/admin/staff"] },
  { key: "overview", label: "Staff Overview", navLabel: "Staff Overview", description: "Department overview boards with per-person and department-wide analytics by day.", prefixes: ["/admin/overview"] },
  { key: "orders", label: "Orders", navLabel: "Order", description: "View all orders and handle order assignment.", prefixes: ["/admin/orders"] },
  { key: "inventory", label: "Inventory", navLabel: "Inventory", description: "View inventory and approve stock adjustments.", prefixes: ["/admin/inventory"] },
  { key: "forms", label: "Forms", navLabel: "Forms", description: "Create and manage order forms.", prefixes: ["/admin/forms"] },
  { key: "history", label: "History", navLabel: "History", description: "View the activity and audit history.", prefixes: ["/admin/history"] },
  { key: "chat", label: "Chat", navLabel: "Chat", description: "Access the internal team chat.", prefixes: ["/chat"] },
];

export const ADMIN_PAGE_KEYS: AdminPageKey[] = ADMIN_PAGES.map((p) => p.key);

/** Which revocable page (if any) does this pathname belong to? */
export function getAdminPageKeyForPath(path: string): AdminPageKey | null {
  const match = ADMIN_PAGES.find((p) =>
    p.prefixes.some((pre) => path === pre || path.startsWith(pre + "/"))
  );
  return match?.key ?? null;
}

/** Map a sidebar nav label to its revocable page key, if it is one. */
export function getAdminPageKeyForNavLabel(navLabel: string): AdminPageKey | null {
  return ADMIN_PAGES.find((p) => p.navLabel === navLabel)?.key ?? null;
}

/**
 * Can this user access the given revocable page?
 * - SUPER_ADMIN: always.
 * - Non-admin roles: not governed by this system (e.g. shared /chat) → allowed.
 * - Limited ADMIN: allowed unless the page key is in their revoked list.
 */
export function canAccessAdminPage(
  role: string | null | undefined,
  revokedAdminPages: string[],
  key: AdminPageKey
): boolean {
  if (isSuperAdmin(role)) return true;
  if (!isAdmin(role)) return true;
  return !revokedAdminPages.includes(key);
}
