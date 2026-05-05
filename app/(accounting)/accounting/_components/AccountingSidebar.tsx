'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Monitor,
  ClipboardList,
  CreditCard,
  Building,
  Coins,
  BookOpen,
  BarChart2,
  Bell,
  Settings,
  LogOut,
  Menu
} from 'lucide-react';

const navItems = [
  { href: '/accounting', icon: Monitor, label: 'Dashboard' },
  { href: '/accounting/sales-record', icon: ClipboardList, label: 'Sales Record' },
  { href: '/accounting/agent-settlement', icon: CreditCard, label: 'Agent Settlement' },
  { href: '/accounting/inventory', icon: Building, label: 'Inventory' },
  { href: '/accounting/expenses', icon: Coins, label: 'Expenses & Purchases' },
  { href: '/accounting/accounting-ledger', icon: BookOpen, label: 'Accounting' },
  { href: '/accounting/reports', icon: BarChart2, label: 'Reports' },
];

const bottomItems = [
  { href: '/accounting/settings', icon: Settings, label: 'Settings' },
];

export function AccountingSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 z-20 shadow-[2px_0_10px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-[88px]' : 'w-64'
      }`}
    >
      {/* Logo & Toggle */}
      <div className={`pt-6 pb-4 flex ${isCollapsed ? 'flex-col items-center gap-6 px-2' : 'items-center justify-between px-6'}`}>
        <div className={`relative transition-all duration-300 ${isCollapsed ? 'h-8 w-14' : 'h-10 w-24'}`}>
          <Image
            src="/nuycle-logo.png"
            alt="Nuycle Logo"
            fill
            className={`object-contain ${isCollapsed ? 'object-center' : 'object-left'}`}
            priority
            sizes="96px"
          />
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-800 hover:text-gray-600 transition-colors flex items-center justify-center p-1 rounded-md hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Profile */}
      <div className={`py-2 ${isCollapsed ? 'px-2 flex justify-center mb-4' : 'px-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center p-0' : 'gap-3 p-2'}`}>
          <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm shrink-0">
            <Image
              src="https://ui-avatars.com/api/?name=Victoria+Nwachukwu&background=f3e8ff&color=7c3aed&bold=true"
              alt="Victoria Nwachukwu"
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[13px] font-bold text-gray-800 truncate max-w-[140px]">
                Victoria Nwachukwu
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                Accountant
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className={`flex-1 mt-2 space-y-1.5 overflow-y-auto no-scrollbar ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {navItems.map((item) => {
          const isActive =
            item.href === '/accounting'
              ? pathname === '/accounting'
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center rounded-xl transition-all duration-200 group ${
                isCollapsed ? 'justify-center h-12 w-full mx-auto' : 'gap-4 px-4 py-3.5'
              } ${
                isActive
                  ? 'bg-[#B400FF] text-white shadow-md shadow-purple-200/50'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-gray-600'
                }
              />
              {!isCollapsed && (
                <span className={`text-[13px] whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Links */}
      <div className={`py-6 mt-auto space-y-1.5 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center rounded-xl transition-all duration-200 group ${
                isCollapsed ? 'justify-center h-12 w-full mx-auto' : 'gap-4 px-4 py-3.5'
              } ${
                isActive
                  ? 'bg-[#B400FF] text-white shadow-md shadow-purple-200/50'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-gray-600'
                }
              />
              {!isCollapsed && (
                <span className={`text-[13px] whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={isCollapsed ? "Log Out" : undefined}
          className={`flex items-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 group ${
            isCollapsed ? 'justify-center h-12 w-full mx-auto' : 'gap-4 px-4 py-3.5 w-full'
          }`}
        >
          <LogOut size={20} strokeWidth={2} className="group-hover:text-red-500 transition-colors" />
          {!isCollapsed && <span className="text-[13px] font-medium whitespace-nowrap">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
