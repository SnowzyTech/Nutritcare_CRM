import { auth } from "@/lib/auth/auth";
import { logoutAction } from "@/modules/auth/actions/login.action";
import { getInitials } from "@/lib/utils";
import { allNavItems } from "./nav-config";
import { ClientSidebar } from "./client-sidebar";
import { getSelfProfile } from "@/modules/users/services/users.service";
import { isAdmin, isSuperAdmin } from "@/lib/auth/role-routes";
import { canAccessAdminPage, getAdminPageKeyForNavLabel } from "@/lib/auth/admin-pages";

export async function Sidebar() {
  const session = await auth();
  const user = session?.user;
  const role = user?.role ?? "";

  const profile = user?.id ? await getSelfProfile(user.id) : null;
  const revoked = profile?.revokedAdminPages ?? [];
  const superAdmin = isSuperAdmin(role);

  // Filter items by role + per-admin page access
  const roleFiltered = allNavItems.filter((item) => {
    // Dashboard is the always-available landing page.
    if (item.href === "/admin") return true;

    // Account oversight is SUPER_ADMIN only.
    if (item.href === "/admin/account") return superAdmin;

    // Staff chat oversight is SUPER_ADMIN only and not revocable — it is
    // deliberately absent from ADMIN_PAGES, so it must be gated by hand here.
    if (item.href === "/admin/chat-oversight") return superAdmin;

    // Revocable admin sections (Staff, Order, Inventory, Forms, History, Chat).
    const pageKey = getAdminPageKeyForNavLabel(item.label);
    if (pageKey) {
      // Preserve base role gates for non-admin viewers.
      if (item.label === "Staff Management" && !isAdmin(role)) return false;
      if (item.label === "Order" && !(isAdmin(role) || role === "SALES_REP")) return false;
      if (
        item.label === "Inventory" &&
        !(isAdmin(role) || ["INVENTORY_MANAGER", "WAREHOUSE_MANAGER"].includes(role))
      )
        return false;
      // Per-admin revocation (limited ADMIN only; SUPER_ADMIN & non-admins pass).
      return canAccessAdminPage(role, revoked, pageKey);
    }

    // Default to true for any other items (Notifications, Settings etc handled in footer)
    return true;
  });

  // The "Access Control" link (under Staff Management) is available to any admin
  // by default — but a super-admin can revoke a limited admin's authority via the
  // "access-control" page key, which hides the link (super-admins always pass).
  const items = roleFiltered.map((item) =>
    item.label === "Staff Management" && item.children
      ? {
          ...item,
          children: item.children.filter(
            (c) =>
              c.href !== "/admin/staff/admins" ||
              canAccessAdminPage(role, revoked, "access-control")
          ),
        }
      : item
  );

  return (
    <ClientSidebar
      items={items}
      user={{
        name: user?.name,
        role: user?.role,
        initials: user?.name ? getInitials(user.name) : "?",
        avatarUrl: profile?.avatarUrl ?? null,
      }}
      onLogout={logoutAction as unknown as () => void}
    />
  );
}

