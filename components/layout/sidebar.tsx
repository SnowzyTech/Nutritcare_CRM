import { auth } from "@/lib/auth/auth";
import { logoutAction } from "@/modules/auth/actions/login.action";
import { getInitials } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { allNavItems } from "./nav-config";

export async function Sidebar() {
  const session = await auth();
  const user = session?.user;
  const role = user?.role ?? "";

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
    <aside className="w-[240px] h-screen bg-[#111111] flex flex-col shrink-0">
      {/* Profile Section */}
      <div className="p-8 pb-4 flex items-center gap-3">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://github.com/shadcn.png" 
            alt="Linda"
            className="w-10 h-10 rounded-full object-cover border border-gray-700"
          />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#111111]" />
        </div>
        <div className="flex flex-col">
          <span className="text-white text-sm font-bold leading-tight">Linda Ihekuna</span>
          <span className="text-gray-500 text-[0.7rem]">Administrative</span>
        </div>
      </div>

      <SidebarNav
        items={roleFiltered}
        user={{
          name: user?.name,
          role: user?.role,
          initials: user?.name ? getInitials(user.name) : "?",
        }}
        onLogout={logoutAction as unknown as () => void}
      />
    </aside>
  );
}

