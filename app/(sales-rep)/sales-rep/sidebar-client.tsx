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
  Menu
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

export function SalesRepSidebarClient({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const avatarSrc = user?.avatarUrl || user?.image;

  return (
    <aside className={cn(
      "h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 z-10 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo & Hamburger Header Section */}
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
      <div className={cn("mb-6 shrink-0", isCollapsed ? "px-3" : "px-4")}>
        <div className={cn(
          "flex items-center rounded-2xl bg-gradient-to-br from-[#A020F0] to-[#7B1FA2] text-white shadow-md shadow-purple-100/30 transition-all duration-300",
          isCollapsed ? "p-2 justify-center" : "p-3.5 gap-3"
        )}>
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0">
             {avatarSrc ? (
               <Image src={avatarSrc} alt={user.name || "User"} fill className="object-cover" sizes="40px" />
             ) : (
               <div className="w-full h-full bg-white/10 flex items-center justify-center text-white">
                 <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Adebimpe Tolani")}&background=ffffff&color=A020F0`} alt="Avatar" className="w-full h-full object-cover" />
               </div>
             )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 animate-fadeIn">
              <span className="text-xs font-bold text-white truncate max-w-[130px]">
                {user?.name || "Adebimpe Tolani"}
              </span>
              <span className="text-[10px] text-white/80 font-medium">
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
  );
}
