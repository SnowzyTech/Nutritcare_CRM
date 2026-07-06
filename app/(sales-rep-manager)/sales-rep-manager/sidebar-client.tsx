"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import {
  Users,
  ClipboardList,
  BarChart3,
  Clock,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  MessageCircle,
  ArrowLeftRight,
} from "lucide-react";
import { logoutAction } from "@/modules/auth/actions/logout.action";

function SidebarNavLink({
  href,
  icon: Icon,
  label,
  isActive,
  hasSubItems,
  isExpanded,
  onToggle,
  badge,
  collapsed,
}: {
  href?: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  hasSubItems?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  badge?: number;
  collapsed?: boolean;
}) {
  const content = (
    <>
      <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
        <Icon size={20} className={isActive ? "text-white" : "text-purple-200 group-hover:text-white"} />
        {!collapsed && <span className="font-medium text-sm">{label}</span>}
      </div>
      {!collapsed && (hasSubItems ? (
        <span className="text-purple-200">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      ) : badge !== undefined ? (
        <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-purple-500 text-white">
          {badge}
        </span>
      ) : null)}
    </>
  );

  const className = `flex items-center ${collapsed ? "justify-center px-0" : "justify-between px-4"} py-3 rounded-xl mb-1 transition-all duration-200 group w-full ${
    isActive
      ? "bg-[#8B2FE8] text-white shadow-lg"
      : "text-purple-100 hover:bg-[#4A0080] hover:text-white"
  }`;

  if (href) {
    return (
      <Link href={href} className={className} title={label} onClick={hasSubItems ? onToggle : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onToggle} className={className} title={label}>
      {content}
    </button>
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
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors relative ${
        isActive ? "text-white" : "text-purple-300"
      }`}
    >
      {isActive && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-[#A020F0]" />
      )}
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-semibold">{label}</span>
    </Link>
  );
}

function SubItem({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2 pl-12 rounded-xl mb-1 transition-all duration-200 group ${
        isActive
          ? "text-[#A020F0] font-semibold"
          : "text-purple-200 hover:text-white hover:bg-[#4A0080]"
      }`}
    >
      <span className="text-[8px] opacity-50">{isActive ? "●" : "○"}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}

interface SidebarProps {
  userName: string;
  userRole: string;
  userAvatar?: string;
}

export function SalesRepManagerSidebarClient({ userName, userRole, userAvatar }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isOrderAssignmentActive = pathname.startsWith("/sales-rep-manager/order-assignment");
  const isOrdersActive =
    pathname.startsWith("/sales-rep-manager/orders") || isOrderAssignmentActive;
  const isAnalyticsActive = pathname === "/sales-rep-manager/analytics";
  const isHistoryActive = pathname === "/sales-rep-manager/history";
  const isRepsActive =
    pathname === "/sales-rep-manager" ||
    (pathname.startsWith("/sales-rep-manager/") &&
      !isOrdersActive &&
      !isAnalyticsActive &&
      !isHistoryActive &&
      !isOrderAssignmentActive);

  const [repsExpanded, setRepsExpanded] = useState(isRepsActive);
  const [ordersExpanded, setOrdersExpanded] = useState(isOrdersActive);

  const avatarSrc =
    userAvatar ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "User")}&background=f3f4f6&color=6b7280`;

  return (
    <>
    <aside
      className={`h-screen bg-[#3B0069] border-r border-[#4A0080] hidden md:flex flex-col shrink-0 z-20 overflow-y-auto no-scrollbar transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-[248px]"
      }`}
    >
      {/* Logo + Hamburger toggle */}
      <div className={`py-8 flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-6"}`}>
        {!isCollapsed && (
          <div className="relative h-10 w-28">
            <Image
              src="/white-nuycle.jpg"
              alt="Nuycle Logo"
              fill
              className="object-contain object-left mix-blend-screen"
              priority
              sizes="112px"
            />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(c => !c)}
          className="p-2 rounded-lg text-purple-200 hover:bg-[#4A0080] hover:text-white transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* User Profile */}
      <div className={`mb-8 ${isCollapsed ? "flex justify-center px-0" : "px-6"}`}>
        <div className={`flex items-center gap-3 rounded-xl ${isCollapsed ? "" : "p-2 bg-[#4A0080] border border-[#5c0099]"}`}>
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#8B2FE8] shadow-sm shrink-0">
            <img src={avatarSrc} alt={userName} className="w-full h-full object-cover" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">{userName || "Manager"}</span>
              <span className="text-[10px] text-purple-200 font-medium uppercase tracking-wider">
                {userRole || "Sales Rep"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 flex flex-col gap-1 ${isCollapsed ? "px-2" : "px-4"}`}>
        <SidebarNavLink
          href="/sales-rep-manager"
          icon={Users}
          label="Sales Reps"
          isActive={isRepsActive && !isAnalyticsActive}
          hasSubItems={true}
          isExpanded={repsExpanded}
          onToggle={() => setRepsExpanded(!repsExpanded)}
          collapsed={isCollapsed}
        />
        {!isCollapsed && repsExpanded && (
          <div className="mb-2 flex flex-col gap-1">
            <SubItem
              href="/sales-rep-manager/analytics"
              label="Analytics"
              isActive={isAnalyticsActive}
            />
          </div>
        )}

        <SidebarNavLink
          icon={ClipboardList}
          label="Order"
          isActive={isOrdersActive}
          hasSubItems={true}
          isExpanded={ordersExpanded}
          onToggle={() => setOrdersExpanded(!ordersExpanded)}
          collapsed={isCollapsed}
        />
        {!isCollapsed && ordersExpanded && (
          <div className="mb-2 flex flex-col gap-1">
            <SubItem
              href="/sales-rep-manager/orders"
              label="Order"
              isActive={pathname.startsWith("/sales-rep-manager/orders")}
            />
            <SubItem
              href="/sales-rep-manager/order-assignment"
              label="Order Assignment"
              isActive={isOrderAssignmentActive}
            />
          </div>
        )}

        <SidebarNavLink
          href="/chat"
          icon={MessageCircle}
          label="Chat"
          isActive={pathname.startsWith("/chat")}
          collapsed={isCollapsed}
        />

        <SidebarNavLink
          href="/sales-rep-manager/analytics"
          icon={BarChart3}
          label="Analytics"
          isActive={isAnalyticsActive}
          collapsed={isCollapsed}
        />

        <SidebarNavLink
          href="/sales-rep-manager/history"
          icon={Clock}
          label="History"
          isActive={isHistoryActive}
          collapsed={isCollapsed}
        />
      </nav>

      {/* Bottom Actions */}
      <div className={`py-6 border-t border-[#4A0080] ${isCollapsed ? "px-2" : "px-4"}`}>
        <form action={logoutAction}>
          <button
            type="submit"
            title="Log Out"
            className={`flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-4"} py-3 rounded-xl mb-1 transition-all duration-200 group w-full text-purple-100 hover:bg-[#4A0080] hover:text-white`}
          >
            <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
              <LogOut size={20} className="text-purple-200 group-hover:text-white" />
              {!isCollapsed && <span className="font-medium text-sm">Log Out</span>}
            </div>
          </button>
        </form>
      </div>
    </aside>

    {/* ══════════════ Mobile Bottom Nav (visible only on small screens) ══════════════ */}
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#3B0069] border-t border-[#4A0080] shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
      <div className="flex items-stretch justify-around h-16 px-1">
        <BottomTabLink
          href="/sales-rep-manager"
          icon={Users}
          label="Reps"
          isActive={isRepsActive && !isAnalyticsActive}
        />
        <BottomTabLink
          href="/sales-rep-manager/orders"
          icon={ClipboardList}
          label="Orders"
          isActive={isOrdersActive && !isOrderAssignmentActive}
        />
        <BottomTabLink
          href="/sales-rep-manager/order-assignment"
          icon={ArrowLeftRight}
          label="Assign"
          isActive={isOrderAssignmentActive}
        />
        <BottomTabLink
          href="/sales-rep-manager/analytics"
          icon={BarChart3}
          label="Analytics"
          isActive={isAnalyticsActive}
        />
        <BottomTabLink
          href="/sales-rep-manager/history"
          icon={Clock}
          label="History"
          isActive={isHistoryActive}
        />
        <form action={logoutAction} className="flex-1 flex">
          <button
            type="submit"
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-purple-300 transition-colors"
          >
            <LogOut size={20} strokeWidth={2} />
            <span className="text-[10px] font-semibold">Logout</span>
          </button>
        </form>
      </div>
    </nav>
    </>
  );
}
