import { auth } from "@/lib/auth/auth";
import { getUserById } from "@/modules/auth/services/auth.service";
import { logoutAction } from "@/modules/auth/actions/login.action";
import { getInitials } from "@/lib/utils";
import { InventorySidebarClient } from "./inventory-sidebar-client";

export async function InventorySidebar() {
  const session = await auth();
  const userId = session?.user?.id;
  const dbUser = userId ? await getUserById(userId) : null;

  const user = {
    name: dbUser?.name ?? session?.user?.name ?? "User",
    avatarUrl: dbUser?.avatarUrl ?? null,
    role: (dbUser?.role ?? session?.user?.role ?? "INVENTORY_MANAGER") as string,
    initials: getInitials(dbUser?.name ?? session?.user?.name ?? ""),
  };

  return <InventorySidebarClient user={user} onLogout={logoutAction} />;
}
