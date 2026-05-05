"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Truck,
  MapPin,
  Map,
  RotateCcw,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function LogisticsSidebarClient({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/logistics", icon: LayoutDashboard },
    { name: "Deliveries", href: "/logistics/deliveries", icon: Truck, badge: "9" },
    { name: "Live Tracking", href: "/logistics/tracking", icon: MapPin },
    { name: "Route Planner", href: "/logistics/route-planner", icon: Map },
    { name: "Returns", href: "/logistics/returns", icon: RotateCcw, badge: "5" },
    { name: "Agents/Drivers", href: "/logistics/agents", icon: Users },
    { name: "Orders", href: "/logistics/orders", icon: ShoppingBag, badge: "3" },
  ];

  return (
    <aside className={`${isCollapsed ? "w-20" : "w-64"} bg-[#4a0b79] text-white flex flex-col min-h-screen transition-all duration-300 ease-in-out`}>
      {/* Top Header with Hamburger */}
      <div className="p-6 flex items-center justify-between border-b border-[#631899]/50 mb-2">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#631899] overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-semibold">
              {user?.image ? (
                <img src={user.image} alt={user.name ?? "User"} className="w-full h-full object-cover" />
              ) : (
                <span>{getInitials(user?.name ?? "")}</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm truncate w-24">{user?.name ?? "Logistics Manager"}</span>
              <span className="text-xs text-[#d28bfa]">Logistics Manager</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg hover:bg-[#631899] transition-colors ${isCollapsed ? "mx-auto" : ""}`}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                  ? "bg-[#ad1df4] text-white shadow-lg"
                  : "text-gray-200 hover:bg-[#631899] hover:text-white"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
              title={isCollapsed ? item.name : ""}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="text-sm font-medium flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="bg-[#facc15] text-[#4a0b79] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-4 py-6 space-y-2 border-t border-[#631899]/50">
        <Link
          href="/logistics/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 hover:bg-[#631899] hover:text-white transition-all ${isCollapsed ? "justify-center px-0" : ""}`}
          title={isCollapsed ? "Settings" : ""}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 hover:bg-red-600/20 hover:text-red-300 transition-all ${isCollapsed ? "justify-center px-0" : ""}`}
          title={isCollapsed ? "Log Out" : ""}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
