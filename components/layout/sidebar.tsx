import { auth } from "@/lib/auth/auth";
import { logoutAction } from "@/modules/auth/actions/login.action";
import { getInitials } from "@/lib/utils";
import { allNavItems } from "./nav-config";
import { ClientSidebar } from "./client-sidebar";
import { getSelfProfile } from "@/modules/users/services/users.service";

export async function Sidebar() {
  const session = await auth();
  const user = session?.user;
  const role = user?.role ?? "";

  const profile = user?.id ? await getSelfProfile(user.id) : null;

  // Filter items by role
  const roleFiltered = allNavItems.filter((item) => {
    // 1. Pages always open to everyone logged in
    const openRoutes = ["/admin", "/admin/account", "/admin/forms", "/admin/history"];
    if (item.href && openRoutes.includes(item.href)) return true;

    // 2. Specific role-based sections
    if (item.label === "Inventory/Product") {
      return ["ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_MANAGER"].includes(role);
    }
    if (item.label === "Order") {
      return ["ADMIN", "SALES_REP"].includes(role);
    }
    if (item.label === "Staff Management") {
      return role === "ADMIN";
    }

    // Default to true for any other items we might add later (Notifications, Settings etc are handled in footer)
    return true;
  });

  return (
    <ClientSidebar
      items={roleFiltered}
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

