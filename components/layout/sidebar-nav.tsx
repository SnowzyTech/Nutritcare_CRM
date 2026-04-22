"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  UserCircle,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Clock,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";

import { allNavItems, type NavItem, type NavChild } from "./nav-config";

/* ── Icon mapping ── */
const IconMap: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  account: UserCircle,
  inventory: Package,
  order: ShoppingCart,
  staff: Users,
  forms: FileText,
  history: Clock,
  settings: Settings,
};

function IconLookup({ name, size = 18, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  const Icon = IconMap[name];
  if (!Icon) return null;
  return <Icon size={size} style={style} />;
}

type SidebarNavProps = {
  items: NavItem[];
  user?: { name?: string | null; role?: string | null; initials?: string };
  onLogout?: () => void;
};

/* ── Role label map ─────────────────────────────────────────────────────── */
const roleLabels: Record<string, string> = {
  ADMIN: "Administrative",
  SALES_REP: "Sales Rep",
  DELIVERY_AGENT: "Delivery Agent",
  DATA_ANALYST: "Data Analyst",
  ACCOUNTANT: "Accountant",
  INVENTORY_MANAGER: "Inventory Manager",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  LOGISTICS_MANAGER: "Logistics Manager",
};

/* ── Single nav item ─────────────────────────────────────────────────────── */
function NavLink({
  href,
  iconName,
  label,
  isActive,
}: {
  href: string;
  iconName: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200 group ${
        isActive 
          ? "bg-[#8B2FE8] text-white shadow-lg shadow-purple-500/20" 
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <IconLookup 
        name={iconName} 
        size={20} 
        style={{ opacity: isActive ? 1 : 0.7 }} 
      />
      <span className={`text-[0.9rem] ${isActive ? "font-bold" : "font-medium"}`}>
        {label}
      </span>
    </Link>
  );
}

/* ── Collapsible group ───────────────────────────────────────────────────── */
function NavGroup({
  iconName,
  label,
  children,
  isAnyChildActive,
}: {
  iconName: string;
  label: string;
  children: NavChild[];
  isAnyChildActive: boolean;
}) {
  const [open, setOpen] = useState(isAnyChildActive);
  const pathname = usePathname();

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-all duration-200 group ${
          isAnyChildActive 
            ? "text-white" 
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <IconLookup 
          name={iconName} 
          size={20} 
          style={{ opacity: isAnyChildActive ? 1 : 0.7 }} 
        />
        <span className={`flex-1 text-[0.9rem] ${isAnyChildActive ? "font-bold" : "font-medium"}`}>
          {label}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 opacity-50 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-1 ml-4 border-l border-gray-800 pl-4 flex flex-col gap-1">
          {children.map((child) => {
            const isActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`block py-2 px-3 rounded-lg text-[0.85rem] transition-colors ${
                  isActive 
                    ? "text-[#c4b5fd] font-bold bg-white/5" 
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                }`}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export function SidebarNav({ items, user, onLogout }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full w-full bg-[#111111]">
      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto px-4 pt-4 custom-scrollbar">
        {items.map((item) => {
          if (item.children) {
            const isAnyChildActive = item.children.some((c) =>
              pathname.startsWith(c.href)
            );
            return (
              <NavGroup
                key={item.label}
                iconName={item.icon}
                label={item.label}
                children={item.children}
                isAnyChildActive={isAnyChildActive}
              />
            );
          }

          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href!);

          return (
            <NavLink
              key={item.label}
              href={item.href!}
              iconName={item.icon}
              label={item.label}
              isActive={isActive}
            />
          );
        })}
      </nav>

      {/* ── Bottom group ── */}
      <div className="p-4 border-t border-gray-800 mt-auto">
        <NavLink
          href="/admin/settings"
          iconName="settings"
          label="Settings"
          isActive={pathname === "/admin/settings"}
        />
        {/* Log Out */}
        <form action={onLogout as unknown as string}>
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 group"
          >
            <LogOut size={20} className="opacity-70 group-hover:opacity-100" />
            <span className="text-[0.9rem] font-medium">Log Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
