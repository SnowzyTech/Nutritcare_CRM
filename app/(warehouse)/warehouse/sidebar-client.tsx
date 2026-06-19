"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  MapPin,
  PackageOpen,
  RotateCcw,
  Send,
  Bell,
  Settings,
  LogOut,
  Menu,
  MessageCircle,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const navItems = [
  { name: "Dashboard",        href: "/warehouse",                     icon: LayoutDashboard },
  { name: "Chat",             href: "/chat",                           icon: MessageCircle },
  { name: "Pick & Pack",      href: "/warehouse/pick-and-pack",       icon: Package,    badge: "5" },
  { name: "Location Mgmt",   href: "/warehouse/location-management",  icon: MapPin      },
  { name: "Incoming Goods",  href: "/warehouse/incoming-goods",        icon: PackageOpen },
  { name: "Returns",          href: "/warehouse/returns",              icon: RotateCcw,  badge: "5" },
  { name: "Outgoing",         href: "/warehouse/outgoing",             icon: Send        },
];

const bottomItems = [
  { name: "Settings",     href: "/warehouse/settings",      icon: Settings },
];

export function WarehouseSidebarClient({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const isActive = (href: string) =>
    href === "/warehouse" ? pathname === "/warehouse" : pathname.startsWith(href);

  return (
    <aside className={`bg-[#4a0b79] text-white flex flex-col min-h-screen shrink-0 transition-all duration-300 ${isCollapsed ? "w-[72px]" : "w-[210px]"}`}>
      {/* Top Header / Hamburger */}
      <div className={`px-5 pt-6 pb-2 flex items-center ${isCollapsed ? "justify-center" : "justify-end"}`}>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-white hover:text-gray-300 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* User Profile */}
      <div className={`px-5 pb-4 flex items-center gap-3 border-b border-white/10 ${isCollapsed ? "justify-center px-0" : ""}`}>
        <div className="w-10 h-10 rounded-full bg-purple-400/30 overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name ?? "User"} className="w-full h-full object-cover" />
          ) : (
            <span>{getInitials(user?.name ?? "Felix Adeyemo")}</span>
          )}
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-[13px] leading-tight truncate">
              {user?.name ?? "Felix Adeyemo"}
            </span>
            <span className="text-[11px] text-[#FBBF24] mt-0.5">Warehouse Manager</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? "bg-[#ad1df4] text-white font-bold shadow-md"
                  : "text-gray-200 hover:bg-[#631899] hover:text-white"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!isCollapsed && <span className="text-[13px] flex-1">{item.name}</span>}
              {!isCollapsed && item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active
                      ? "bg-[#FBBF24] text-[#4a0b79]"
                      : "bg-[#FBBF24] text-[#4a0b79]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {bottomItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? "bg-[#ad1df4] text-white font-bold shadow-md"
                  : "text-gray-200 hover:bg-[#631899] hover:text-white"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!isCollapsed && <span className="text-[13px]">{item.name}</span>}
            </Link>
          );
        })}

        {/* Log Out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={isCollapsed ? "Log Out" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-200 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 ${isCollapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!isCollapsed && <span className="text-[13px]">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
