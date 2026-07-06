'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { 
  ShoppingBag, 
  BarChart3, 
  Clock, 
  Settings, 
  LogOut, 
  ChevronDown,
  Users,
  User,
  Menu,
  MessageCircle
} from 'lucide-react';

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function DataSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const pathParts = pathname.split('/');
  const isSalesRepDetail = pathParts.includes('sales-reps');
  const rawId = isSalesRepDetail ? pathParts[pathParts.indexOf('sales-reps') + 1] : null;
  const activeSalesRepId = (rawId && rawId !== 'undefined' && rawId !== '') ? rawId : null;

  const [isSalesRepOpen, setIsSalesRepOpen] = useState(isSalesRepDetail);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsSalesRepOpen(isSalesRepDetail);
  }, [pathname, isSalesRepDetail]);

  const navLinks = [
    { href: '/chat', icon: MessageCircle, label: 'Chat' },
    { href: '/data/order', icon: ShoppingBag, label: 'Order' },
    { href: '/data/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/data/history', icon: Clock, label: 'History' },
  ];

  const bottomLinks: { href: string; icon: React.ElementType; label: string; badge?: number }[] = [
    { href: '/data/settings', icon: User, label: 'Profile' },
  ];

  const handleSalesRepClick = (e: React.MouseEvent) => {
    if (pathname === '/data') {
      setIsSalesRepOpen(!isSalesRepOpen);
    } else {
      router.push('/data');
    }
  };

  return (
    <aside className={`h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 z-20 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`py-8 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-8'}`}>
        {!isCollapsed && (
          <div className="relative h-10 w-24 shrink-0">
            <Image
              src="/nuycle-logo.png"
              alt="Nuycle Logo"
              fill
              className="object-contain object-left"
              priority
              sizes="96px"
            />
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className={`mb-8 ${isCollapsed ? 'flex justify-center' : 'px-6'}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'p-2'}`}>
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100 shadow-sm shrink-0">
            <Image
              src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=f3f4f6&color=6b7280`}
              alt="User" 
              fill 
              className="object-cover" 
              sizes="40px"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-gray-900 truncate max-w-[140px]">
                {user?.name || "Data Analyst"}
              </span>
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                Data
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className={`flex-1 space-y-1 overflow-y-auto no-scrollbar ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <div>
          <button
            onClick={handleSalesRepClick}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-3 rounded-xl transition-all duration-200 group ${
              pathname === '/data' || isSalesRepDetail
                ? 'bg-[#A020F0] text-white shadow-lg shadow-purple-200'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users size={20} className={pathname === '/data' || isSalesRepDetail ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 shrink-0'} />
              {!isCollapsed && <span className="font-bold text-sm whitespace-nowrap">Sales Reps</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 shrink-0 ${isSalesRepOpen ? 'rotate-180' : ''}`} 
              />
            )}
          </button>

          {!isCollapsed && isSalesRepOpen && (
            <div className="mt-2 ml-4 space-y-1 overflow-hidden">
              <Link
                href={activeSalesRepId ? `/data/sales-reps/${activeSalesRepId}/order` : '#'}
                className={`flex items-center gap-3 px-8 py-2 rounded-lg text-sm transition-colors ${
                  pathname.includes('/order') && isSalesRepDetail
                    ? 'text-gray-900 font-bold'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${pathname.includes('/order') && isSalesRepDetail ? 'bg-gray-900' : 'bg-transparent'}`} />
                <span className="whitespace-nowrap">Order</span>
              </Link>
              <Link
                href={activeSalesRepId ? `/data/sales-reps/${activeSalesRepId}/analytics` : '#'}
                className={`flex items-center gap-3 px-8 py-2 rounded-lg text-sm transition-colors ${
                  pathname.includes('/analytics') && isSalesRepDetail
                    ? 'text-gray-900 font-bold'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${pathname.includes('/analytics') && isSalesRepDetail ? 'bg-gray-900' : 'bg-transparent'}`} />
                <span className="whitespace-nowrap">Analytics</span>
              </Link>
            </div>
          )}
        </div>

        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/data' && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-[#A020F0] text-white shadow-lg shadow-purple-200'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
              {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`py-6 border-t border-gray-50 space-y-1 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {bottomLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-[#A020F0] text-white shadow-lg shadow-purple-200'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{link.label}</span>}
              </div>
              {!isCollapsed && link.badge && (
                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
                  isActive ? 'bg-white text-[#A020F0]' : 'bg-red-500 text-white'
                }`}>
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 group`}
        >
          <LogOut size={20} className="group-hover:text-red-500 transition-colors shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
