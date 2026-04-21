import { auth } from "@/lib/auth/auth";
import { logoutAction } from "@/modules/auth/actions/login.action";
import { getInitials } from "@/lib/utils";
import { LogOut, Bell } from "lucide-react";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  SALES_REP: "Sales Representative",
  DELIVERY_AGENT: "Delivery Agent",
  DATA_ANALYST: "Data Analyst",
  ACCOUNTANT: "Accountant",
  INVENTORY_MANAGER: "Inventory Manager",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  LOGISTICS_MANAGER: "Logistics Manager",
};

export async function Header() {
  const session = await auth();
  const user = session?.user;
  const initials = user?.name ? getInitials(user.name) : "?";
  const roleLabel = user?.role ? (roleLabels[user.role] ?? user.role) : "";

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/5 bg-slate-900/60 backdrop-blur px-6">
      <div />

      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
        >
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400"
          >
            {initials}
          </div>

          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-slate-500">{roleLabel}</p>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
