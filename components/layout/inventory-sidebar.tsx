"use client";

import React from "react";
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
  Bell,
  Settings,
  LogOut
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

export function InventorySidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 py-8 px-4 overflow-y-auto no-scrollbar">
      {/* Profile Section */}
      <div className="flex items-center gap-4 px-4 mb-10">
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
            alt="Yusuf Adeyemi"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-base">Yusuf Adeyemi</h3>
          <p className="text-gray-400 text-xs font-medium">Inventory manager</p>
        </div>
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
                "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-[#9D00FF] text-white shadow-lg shadow-[#9D00FF]/25"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600")} />
              <span className="text-sm font-bold tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Menu */}
      <div className="mt-8 pt-6 border-t border-gray-50 space-y-2">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-bold tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:bg-red-50 hover:text-red-600 group">
          <LogOut className="w-5 h-5 group-hover:text-red-600" />
          <span className="text-sm font-bold tracking-tight">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
