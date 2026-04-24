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
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

function SidebarNavLink({
  href,
  icon: Icon,
  label,
  isActive,
  hasSubItems,
  isExpanded,
  onToggle,
  badge,
}: {
  href?: string;
  icon: any;
  label: string;
  isActive: boolean;
  hasSubItems?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  badge?: number;
}) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <Icon size={20} className={isActive ? "text-white" : "text-purple-200 group-hover:text-white"} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      {hasSubItems ? (
        <span className="text-purple-200">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      ) : badge !== undefined ? (
        <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-purple-500 text-white">
          {badge}
        </span>
      ) : null}
    </>
  );

  const className = `flex items-center justify-between px-4 py-3 rounded-xl mb-1 transition-all duration-200 group w-full ${isActive
      ? "bg-[#8B2FE8] text-white shadow-lg"
      : "text-purple-100 hover:bg-[#4A0080] hover:text-white"
    }`;

  if (href) {
    return (
      <Link href={href} className={className} onClick={hasSubItems ? onToggle : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onToggle} className={className}>
      {content}
    </button>
  );
}

function SubItem({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2 pl-12 rounded-xl mb-1 transition-all duration-200 group ${isActive
          ? "text-[#A020F0] font-semibold"
          : "text-purple-200 hover:text-white hover:bg-[#4A0080]"
        }`}
    >
      <span className="text-[8px] opacity-50">{isActive ? "●" : "○"}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}

export function SalesRepManagerSidebarClient() {
  const pathname = usePathname();

  const isOrdersActive = pathname.startsWith("/sales-rep-manager/orders") || pathname.startsWith("/sales-rep-manager/order-assignment");
  const isOrderAssignmentActive = pathname.startsWith("/sales-rep-manager/order-assignment");
  const isAnalyticsActive = pathname === "/sales-rep-manager/analytics";
  const isHistoryActive = pathname === "/sales-rep-manager/history";

  const isRepsActive = pathname === "/sales-rep-manager" || (pathname.startsWith("/sales-rep-manager/") && !isOrdersActive && !isAnalyticsActive && !isHistoryActive && !isOrderAssignmentActive);

  const [repsExpanded, setRepsExpanded] = useState(isRepsActive);
  const [ordersExpanded, setOrdersExpanded] = useState(isOrdersActive);

  return (
    <aside className="w-[248px] h-screen bg-[#3B0069] border-r border-[#4A0080] flex flex-col shrink-0 z-20 overflow-y-auto no-scrollbar">
      {/* Logo Section */}
      <div className="px-8 py-8">
        <div className="relative h-10 w-24">
          <Image
            src="/nuycle-logo.png"
            alt="Nuycle Logo"
            fill
            className="object-contain object-left"
            priority
            sizes="100px"
          />
        </div>
      </div>

      {/* User Profile Section */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 p-2 bg-[#4A0080] rounded-xl border border-[#5c0099]">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#8B2FE8] shadow-sm shrink-0">
            <img
              src="https://ui-avatars.com/api/?name=Blessing+Ehijie&background=f3f4f6&color=6b7280"
              alt="Blessing Ehijie"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white truncate">Blessing Ehijie</span>
            <span className="text-[10px] text-purple-200 font-medium uppercase tracking-wider">Sales Rep</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 flex flex-col gap-1">
        <SidebarNavLink
          href="/sales-rep-manager"
          icon={Users}
          label="Sales Reps"
          isActive={isRepsActive && !isAnalyticsActive}
          hasSubItems={true}
          isExpanded={repsExpanded}
          onToggle={() => setRepsExpanded(!repsExpanded)}
        />
        {repsExpanded && (
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
        />
        {ordersExpanded && (
          <div className="mb-2 flex flex-col gap-1">
            <SubItem
              href="/sales-rep-manager/orders"
              label="Order"
              isActive={isOrdersActive}
            />
            <SubItem
              href="/sales-rep-manager/order-assignment"
              label="Order Assignment"
              isActive={isOrderAssignmentActive}
            />
          </div>
        )}

        <SidebarNavLink
          href="/sales-rep-manager/analytics"
          icon={BarChart3}
          label="Analytics"
          isActive={isAnalyticsActive && !repsExpanded} // Highlight if reps not expanded but we are here
        />

        <SidebarNavLink
          href="/sales-rep-manager/history"
          icon={Clock}
          label="History"
          isActive={isHistoryActive}
        />
      </nav>

      {/* Bottom Actions */}
      <div className="px-4 py-6 border-t border-[#4A0080]">
        <SidebarNavLink
          href="#"
          icon={Bell}
          label="Notification"
          isActive={false}
          badge={2}
        />
        <SidebarNavLink
          href="#"
          icon={Settings}
          label="Settings"
          isActive={false}
        />
        <SidebarNavLink
          href="#"
          icon={LogOut}
          label="Log Out"
          isActive={false}
        />
      </div>
    </aside>
  );
}
