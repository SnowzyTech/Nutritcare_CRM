'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  BarChart3, 
  Clock, 
  Bell, 
  Settings, 
  LogOut,
  ShoppingBag
} from 'lucide-react';

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

function SalesRepNavLink({
  href,
  icon: Icon,
  label,
  isActive,
  badge,
}: {
  href: string;
  icon: any;
  label: string;
  isActive: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-4 py-3 rounded-xl mb-2 transition-all duration-200 group ${
        isActive
          ? 'bg-[#A020F0] text-white shadow-lg shadow-purple-200'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      {badge !== undefined && (
        <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
          isActive ? 'bg-white text-[#A020F0]' : 'bg-red-500 text-white'
        }`}>
          {badge}
        </span>
      )}
    </Link>
  );
}

export function SalesRepSidebarClient({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 z-10">
      {/* Logo Section */}
      <div className="px-8 py-8">
        <div className="relative h-10 w-24">
          <Image
            src="/nuycle-logo.png"
            alt="Nuycle Logo"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
      </div>

      {/* User Profile Section */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 p-2">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm">
             {user?.image ? (
               <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
             ) : (
               <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                 <img src="https://ui-avatars.com/api/?name=Adebimpe+Tolani&background=f3f4f6&color=6b7280" alt="Avatar" className="w-full h-full object-cover" />
               </div>
             )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 truncate max-w-[140px]">
              {user?.name || "Adebimpe Tolani"}
            </span>
            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
              Sales Rep
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <SalesRepNavLink
          href="/sales-rep/orders"
          icon={ShoppingBag}
          label="Order"
          isActive={pathname.startsWith('/sales-rep/orders')}
        />
        <SalesRepNavLink
          href="/sales-rep/analytics"
          icon={BarChart3}
          label="Analytics"
          isActive={pathname === '/sales-rep/analytics'}
        />
        <SalesRepNavLink
          href="/sales-rep/history"
          icon={Clock}
          label="History"
          isActive={pathname === '/sales-rep/history'}
        />
      </nav>

      {/* Bottom Actions */}
      <div className="px-4 py-6 border-t border-gray-50">
        <SalesRepNavLink
          href="/sales-rep/notifications"
          icon={Bell}
          label="Notification"
          isActive={pathname === '/sales-rep/notifications'}
          badge={2}
        />
        <SalesRepNavLink
          href="/sales-rep/settings"
          icon={Settings}
          label="Settings"
          isActive={pathname === '/sales-rep/settings'}
        />
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 group mt-2">
          <LogOut size={20} className="group-hover:text-red-500 transition-colors" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
