"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCcw,
  ArrowRightLeft,
  Building2,
  UserSquare,
  Sliders,
  Settings,
  LogOut,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "Dashboard", href: "/inventory", icon: LayoutDashboard },
  { label: "Stock", href: "/inventory/stock", icon: Package },
  { label: "Incoming Stock", href: "/inventory/incoming", icon: ArrowDownToLine },
  { label: "Outgoing Stock", href: "/inventory/outgoing", icon: ArrowUpFromLine },
  { label: "Returned Stock", href: "/inventory/returned", icon: RefreshCcw },
  { label: "Stock Transfer", href: "/inventory/transfer", icon: ArrowRightLeft },
  { label: "Stock in Warehouse", href: "/inventory/stock-in-warehouse", icon: Building2 },
  { label: "Stock Left with Agent", href: "/inventory/left-with-agent", icon: UserSquare },
  { label: "Stock Adjustment", href: "/inventory/adjustment", icon: Sliders },
];

const bottomItems = [
  { label: "Settings", href: "/inventory/settings", icon: Settings },
];

function formatRole(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

interface SidebarUser {
  name: string;
  avatarUrl: string | null;
  role: string;
  initials: string;
}

interface InventorySidebarClientProps {
  user: SidebarUser;
  onLogout: () => void | Promise<void>;
}

export function InventorySidebarClient({ user, onLogout }: InventorySidebarClientProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
      "h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 py-8 px-4 overflow-y-auto no-scrollbar transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-[280px]"
    )}>
      {/* Brand Header with Hamburger Icon */}
      <div className={cn(
        "flex items-center mb-8 shrink-0 px-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <h2 className="text-[#9D00FF] font-black text-lg tracking-tight">Nutricare CRM</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all duration-200 active:scale-95 cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu size={20} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Profile Section */}
      <div className={cn(
        "flex items-center gap-4 mb-10 shrink-0 transition-all duration-300",
        isCollapsed ? "justify-center px-0" : "px-4"
      )}>
        <div className="w-12 h-12 rounded-full overflow-hidden bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100/50 shadow-sm">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[#9D00FF] font-black text-sm">{user.initials}</span>
          )}
        </div>
        {!isCollapsed && (
          <div className="animate-fadeIn min-w-0">
            <h3 className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{user.name}</h3>
            <p className="text-gray-400 text-[10px] font-bold">{formatRole(user.role)}</p>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/inventory"
              ? pathname === "/inventory"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-xl transition-all duration-200 group relative",
                isCollapsed ? "justify-center px-0 py-3.5" : "gap-4 px-4 py-3.5",
                isActive
                  ? "bg-[#9D00FF] text-white shadow-lg shadow-[#9D00FF]/25"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              {!isCollapsed && (
                <span className="text-sm font-bold tracking-tight animate-fadeIn">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Menu */}
      <div className="mt-8 pt-6 border-t border-gray-50 space-y-2 shrink-0">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-xl transition-all duration-200 group relative",
                isCollapsed ? "justify-center px-0 py-3" : "gap-4 px-4 py-3",
                isActive
                  ? "bg-[#9D00FF] text-white shadow-lg shadow-[#9D00FF]/25"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              {!isCollapsed && (
                <span className="text-sm font-bold tracking-tight animate-fadeIn">{item.label}</span>
              )}
            </Link>
          );
        })}

        <button
          onClick={() => onLogout()}
          className={cn(
            "w-full flex items-center rounded-xl transition-all duration-200 text-gray-400 hover:bg-red-50 hover:text-red-600 group relative cursor-pointer",
            isCollapsed ? "justify-center px-0 py-3" : "gap-4 px-4 py-3"
          )}
          title={isCollapsed ? "Log Out" : undefined}
        >
          <LogOut className="w-5 h-5 group-hover:text-red-600 shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-bold tracking-tight animate-fadeIn">Log Out</span>
          )}
        </button>
      </div>
    </aside>
  );
}
