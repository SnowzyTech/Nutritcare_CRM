'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import {
  BarChart3,
  Clock,
  Settings,
  LogOut,
  ShoppingBag,
  Menu,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    avatarUrl?: string | null;
  };
}

/* ─── Desktop sidebar nav link ─── */
function SalesRepNavLink({
  href,
  icon: Icon,
  label,
  isActive,
  badge,
  isCollapsed,
}: {
  href: string;
  icon: any;
  label: string;
  isActive: boolean;
  badge?: number;
  isCollapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center rounded-xl mb-2 transition-all duration-200 group relative",
        isCollapsed ? "justify-center py-3.5 px-0" : "justify-between px-4 py-3",
        isActive
          ? 'bg-[#A020F0] text-white shadow-lg shadow-purple-200/50'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      )}
      title={isCollapsed ? label : undefined}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
        {!isCollapsed && <span className="font-medium text-sm">{label}</span>}
      </div>
      {!isCollapsed && badge !== undefined && (
        <span className={cn(
          "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
          isActive ? 'bg-white text-[#A020F0]' : 'bg-red-500 text-white'
        )}>
          {badge}
        </span>
      )}
      {isCollapsed && badge !== undefined && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
      )}
    </Link>
  );
}

/* ─── Mobile bottom tab link ─── */
function BottomTabLink({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: any;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors relative",
        isActive ? "text-[#A020F0]" : "text-gray-400"
      )}
    >
      {isActive && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-[#A020F0]" />
      )}
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      <span className={cn("text-[10px] font-semibold", isActive ? "text-[#A020F0]" : "text-gray-400")}>
        {label}
      </span>
    </Link>
  );
}

export function SalesRepSidebarClient({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const avatarSrc = user?.avatarUrl || user?.image;

  return (
    <>
      {/* ══════════════ Desktop Sidebar (hidden on mobile) ══════════════ */}
      <aside className={cn(
        "h-screen bg-white border-r border-gray-100 flex-col shrink-0 transition-all duration-300 ease-in-out hidden md:flex",
        isCollapsed ? "w-20" : "w-64",
      )}>
        {/* Logo & Collapse toggle */}
        <div className={cn(
          "flex items-center py-6 px-4 shrink-0",
          isCollapsed ? "justify-center" : "justify-between px-6"
        )}>
          {!isCollapsed && (
            <div className="relative h-9 w-24">
              <Image
                src="/nuycle-logo.png"
                alt="Nuycle Logo"
                fill
                className="object-contain object-left"
                priority
                sizes="100px"
              />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all duration-200 active:scale-95 cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu size={20} className="stroke-[2.5]" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className={cn("mb-6 shrink-0", isCollapsed ? "px-3" : "px-6")}>
          <div className={cn(
            "flex items-center rounded-2xl transition-all duration-300",
            isCollapsed ? "p-2 justify-center" : "gap-3"
          )}>
            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
               {avatarSrc ? (
                 <Image src={avatarSrc} alt={user?.name || "User"} fill className="object-cover" sizes="40px" />
               ) : (
                 <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                   <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Adebimpe Tolani")}&background=random&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
                 </div>
               )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 animate-fadeIn">
                <span className="text-sm font-bold text-gray-800 truncate max-w-[130px]">
                  {user?.name || "Adebimpe Tolani"}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  Sales Rep
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1", isCollapsed ? "px-3" : "px-4")}>
          <SalesRepNavLink
            href="/sales-rep/orders"
            icon={ShoppingBag}
            label="Order"
            isActive={pathname.startsWith('/sales-rep/orders')}
            isCollapsed={isCollapsed}
          />
          <SalesRepNavLink
            href="/chat"
            icon={MessageCircle}
            label="Chat"
            isActive={pathname.startsWith('/chat')}
            isCollapsed={isCollapsed}
          />
          <SalesRepNavLink
            href="/sales-rep/analytics"
            icon={BarChart3}
            label="Analytics"
            isActive={pathname === '/sales-rep/analytics'}
            isCollapsed={isCollapsed}
          />
          <SalesRepNavLink
            href="/sales-rep/history"
            icon={Clock}
            label="History"
            isActive={pathname === '/sales-rep/history'}
            isCollapsed={isCollapsed}
          />
        </nav>

        {/* Bottom Actions */}
        <div className={cn("py-6 border-t border-gray-50 shrink-0", isCollapsed ? "px-3" : "px-4")}>
          <SalesRepNavLink
            href="/sales-rep/settings"
            icon={Settings}
            label="Settings"
            isActive={pathname === '/sales-rep/settings'}
            isCollapsed={isCollapsed}
          />
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={cn(
              "w-full flex items-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 group mt-2 cursor-pointer",
              isCollapsed ? "justify-center py-3.5 px-0" : "gap-3 px-4 py-3"
            )}
            title={isCollapsed ? "Log Out" : undefined}
          >
            <LogOut size={20} className="group-hover:text-red-500 transition-colors shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ══════════════ Mobile Bottom Nav Bar (visible only on small screens) ══════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch justify-around h-16 max-w-md mx-auto px-2">
          <BottomTabLink
            href="/sales-rep/orders"
            icon={ShoppingBag}
            label="Orders"
            isActive={pathname.startsWith('/sales-rep/orders')}
          />
          <BottomTabLink
            href="/sales-rep/analytics"
            icon={BarChart3}
            label="Analytics"
            isActive={pathname === '/sales-rep/analytics'}
          />
          <BottomTabLink
            href="/sales-rep/history"
            icon={Clock}
            label="History"
            isActive={pathname === '/sales-rep/history'}
          />
          <BottomTabLink
            href="/sales-rep/settings"
            icon={Settings}
            label="Settings"
            isActive={pathname === '/sales-rep/settings'}
          />
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-gray-400 transition-colors"
          >
            <LogOut size={20} strokeWidth={2} />
            <span className="text-[10px] font-semibold text-gray-400">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
