"use client";

import { useState } from "react";
import { SidebarNav } from "./sidebar-nav";
import { Menu } from "lucide-react";
import type { NavItem } from "./nav-config";

export function ClientSidebar({
  items,
  user,
  onLogout
}: {
  items: NavItem[];
  user?: { name?: string | null; role?: string | null; initials?: string };
  onLogout?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={`${collapsed ? 'w-[80px]' : 'w-[240px]'} h-screen bg-[#111111] flex flex-col shrink-0 transition-all duration-300 relative`}
    >
      {/* Profile Section & Hamburger */}
      <div className={`p-6 flex items-center ${collapsed ? 'justify-center flex-col gap-4' : 'justify-between'} pb-4`}>
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://github.com/shadcn.png" 
                alt="Linda"
                className="w-10 h-10 rounded-full object-cover border border-gray-700"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#111111]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white text-sm font-bold leading-tight truncate">{user?.name || "Linda Ihekuna"}</span>
              <span className="text-gray-500 text-[0.7rem] truncate">{user?.role === "ADMIN" ? "Administrative" : user?.role || "Staff"}</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://github.com/shadcn.png" 
              alt="Linda"
              className="w-10 h-10 rounded-full object-cover border border-gray-700"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#111111]" />
          </div>
        )}
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <SidebarNav
        items={items}
        user={user}
        onLogout={onLogout}
        collapsed={collapsed}
      />
    </aside>
  );
}
