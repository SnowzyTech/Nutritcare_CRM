import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  DollarSign,
  Users,
  BarChart2,
  Leaf,
} from "lucide-react";
import { SidebarNav } from "./sidebar-nav";

const allNavItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: null, // all roles
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingCart,
    roles: ["ADMIN", "SALES_REP"],
  },
  {
    label: "Delivery",
    href: "/dashboard/delivery",
    icon: Truck,
    roles: ["ADMIN", "DELIVERY_AGENT", "LOGISTICS_MANAGER"],
  },
  {
    label: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
    roles: ["ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_MANAGER"],
  },
  {
    label: "Finance",
    href: "/dashboard/finance",
    icon: DollarSign,
    roles: ["ADMIN", "ACCOUNTANT"],
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart2,
    roles: ["ADMIN", "DATA_ANALYST"],
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: Users,
    roles: ["ADMIN"],
  },
];

export function Sidebar({ role }: { role?: string }) {
  const visibleItems = allNavItems
    .filter((item) => item.roles === null || (role && item.roles.includes(role)))
    .map(({ label, href, icon }) => ({ label, href, icon }));

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/5 bg-slate-900/80 backdrop-blur">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30">
          <Leaf className="h-4 w-4 text-emerald-400" />
        </div>
        <span className="font-semibold text-white tracking-tight">
          Nutricare CRM
        </span>
      </div>

      {/* Navigation — client component handles active state */}
      <SidebarNav items={visibleItems} />

      <div className="border-t border-white/5 px-5 py-3">
        <p className="text-xs text-slate-600">v0.1.0 — Foundation</p>
      </div>
    </aside>
  );
}
