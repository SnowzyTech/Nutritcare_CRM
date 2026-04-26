"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ClipboardList,
  MessageCircle,
  Package,
  User,
  UserCircle2,
  Settings,
  LogOut,
} from "lucide-react";

interface SidebarClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | undefined;
  pendingCount: number;
}

export function DeliveryAgentSidebarClient({ user, pendingCount }: SidebarClientProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Order", icon: ClipboardList, href: "/delivery-agents", badge: pendingCount || undefined },
    { label: "Chat", icon: MessageCircle, href: "/delivery-agents/chat" },
    { label: "Inventory", icon: Package, href: "/delivery-agents/inventory" },
    { label: "Account", icon: User, href: "/delivery-agents/account" },
    { label: "Profile", icon: UserCircle2, href: "/delivery-agents/profile" },
  ];

  const avatarUrl = user?.name
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f3e8ff&color=ad1df4`
    : "https://ui-avatars.com/api/?name=Agent&background=f3e8ff&color=ad1df4";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r flex-col h-screen">
        <div className="p-6">
          <img src="/nuycle-logo.png" alt="Nuycle Logo" className="h-10 w-auto object-contain" />
        </div>

        {/* User info */}
        <div className="px-6 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-100">
            <img src={avatarUrl} alt={user?.name ?? "Agent"} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.name ?? "Delivery Agent"}</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Delivery Agent</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-[#faf5ff] text-[#ad1df4]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="bg-[#ad1df4] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto space-y-2">
          <button className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-700 w-full transition-colors font-medium text-sm rounded-xl hover:bg-gray-50">
            <Settings className="w-5 h-5" />
            Settings
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-4 py-3 text-red-500 hover:text-red-700 w-full transition-colors font-bold text-sm rounded-xl hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around py-3 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 min-w-[64px] relative transition-all ${
                isActive ? "text-[#ad1df4]" : "text-gray-400"
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? "bg-[#faf5ff]" : ""}`}>
                <item.icon className={`w-6 h-6 ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
                {item.badge ? (
                  <span className="absolute top-1 right-2 bg-[#ad1df4] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? "opacity-100" : "opacity-70"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
