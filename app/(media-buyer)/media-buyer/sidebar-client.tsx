"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  MonitorSmartphone,
  FileText,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

const BRAND = "#8B2FE8";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const mainNav = [
  { name: "Dashboard", href: "/media-buyer", icon: MonitorSmartphone, exact: true },
  { name: "My Forms", href: "/media-buyer/forms", icon: FileText },
  { name: "Analytics", href: "/media-buyer/analytics", icon: BarChart3 },
  { name: "Earnings", href: "/media-buyer/earnings", icon: NairaIcon },
];

/** Simple ₦ glyph icon to match the lucide sizing used across the nav. */
function NairaIcon({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center font-black leading-none ${className ?? ""}`}
      style={{ fontSize: 18 }}
      aria-hidden
    >
      ₦
    </span>
  );
}

export function MediaBuyerSidebarClient({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const navLink = (
    { name, href, icon: Icon, exact }: { name: string; href: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }
  ) => {
    const active = isActive(href, exact);
    return (
      <Link
        key={name}
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          active ? "text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        } ${isCollapsed ? "justify-center px-0" : ""}`}
        style={active ? { background: BRAND } : undefined}
        title={isCollapsed ? name : ""}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span className="text-sm font-semibold">{name}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={`${isCollapsed ? "w-20" : "w-64"} bg-white flex flex-col min-h-screen shrink-0 rounded-br-[36px] shadow-[8px_0_30px_-12px_rgba(15,23,42,0.18)] transition-all duration-300 ease-in-out z-10`}
    >
      {/* Brand + hamburger */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        {!isCollapsed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/nucle-logo.png" alt="Nucle" className="h-8 w-auto object-contain" />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer ${isCollapsed ? "mx-auto" : ""}`}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Profile */}
      {!isCollapsed && (
        <div className="px-5 pb-5 mb-3 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-purple-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold text-purple-700">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{getInitials(user?.name ?? "")}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-slate-800 truncate">
              {user?.name ?? "Media Buyer"}
            </span>
            <span className="text-xs text-slate-400">Media Buyer</span>
          </div>
        </div>
      )}

      {/* Main navigation */}
      <nav className="flex-1 px-3 space-y-1.5 pt-1">
        {mainNav.map((item) => navLink(item))}
      </nav>

      {/* Bottom navigation */}
      <div className="px-3 py-6 space-y-1.5">
        {navLink({ name: "Notification", href: "/media-buyer/notifications", icon: Bell })}
        {navLink({ name: "Settings", href: "/media-buyer/settings", icon: Settings })}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer ${isCollapsed ? "justify-center px-0" : ""}`}
          title={isCollapsed ? "Log Out" : ""}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-semibold">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
