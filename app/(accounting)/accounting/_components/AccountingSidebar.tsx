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
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  DollarSign,
  MessageCircle,
} from 'lucide-react';

const reportSubItems = [
  { href: '/accounting/reports/profit-loss', label: 'Profit & Loss' },
  { href: '/accounting/reports/statement-of-financial-position', label: 'Balance Sheet' },
  { href: '/accounting/reports/statement-of-cash-flow', label: 'Cash Flow' },
  { href: '/accounting/reports/revenue-by-product', label: 'Revenue by Product' },
  { href: '/accounting/reports/inventory-valuation', label: 'Inventory Valuation' },
  { href: '/accounting/reports/expense-ledger', label: 'Expense Ledger' },
  { href: '/accounting/reports/delivery-tracker', label: 'Delivery Tracker' },
  { href: '/accounting/reports/trial-balance', label: 'Trial Balance' },
];

const navItems = [
  { href: '/accounting', icon: Monitor, label: 'Dashboard' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/accounting/sales-record', icon: ClipboardList, label: 'Sales Record' },
  { href: '/accounting/agent-settlement', icon: CreditCard, label: 'Agent Settlement' },
  { href: '/accounting/inventory', icon: Building, label: 'Inventory' },
  { href: '/accounting/expenses', icon: Coins, label: 'Expenses & Purchases' },
  { href: '/accounting/accounting-ledger', icon: BookOpen, label: 'Accounting' },
  { href: '/accounting/salary', icon: DollarSign, label: 'Salary' },
  { href: '/accounting/reports', icon: BarChart2, label: 'Reports' },
];

const bottomItems = [
  { href: '/accounting/settings', icon: Settings, label: 'Settings' },
];

function formatRole(role: string): string {
  return role.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

interface SidebarUser {
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  initials: string;
}

export function AccountingSidebar({ user }: { user?: SidebarUser }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const onReportsPage = pathname.startsWith('/accounting/reports');
  const [reportsOpen, setReportsOpen] = useState(onReportsPage);

  const displayName = user?.name ?? 'Accountant';
  const displayRole = user?.role ? formatRole(user.role) : 'Accountant';
  const avatarSrc = user?.avatarUrl ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=f3e8ff&color=7c3aed&bold=true`;

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
          className="text-gray-800 hover:text-gray-600 transition-colors flex items-center justify-center p-1 rounded-md hover:bg-gray-100 cursor-pointer"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Profile */}
      <div className={`py-4 ${isCollapsed ? 'px-2 flex justify-center mb-4' : 'px-5 border-b border-gray-50/50 pb-5 mb-3'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center p-0' : 'gap-4 p-1'}`}>
          <div className="relative group shrink-0">
            {/* Elegant Gradient Border Ring */}
            <div className={`rounded-full p-[2.5px] bg-gradient-to-tr from-[#AE00FF] via-purple-400 to-[#FF00C8] shadow-[0_4px_20px_rgba(174,0,255,0.18)] transition-all duration-300 group-hover:scale-105 active:scale-95 ${
              isCollapsed ? 'w-12 h-12' : 'w-14 h-14'
            }`}>
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white bg-white">
                <Image
                  src={avatarSrc}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            </div>
            {/* Stylish Online Status indicator */}
            <span className={`absolute bottom-0 right-0 bg-emerald-500 border-2 border-white rounded-full shadow-md animate-pulse ${
              isCollapsed ? 'w-3 h-3' : 'w-3.5 h-3.5'
            }`} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[14px] font-extrabold text-gray-900 truncate leading-tight tracking-tight hover:text-[#AE00FF] transition-colors">
                {displayName}
              </span>
              <span className="text-[11px] text-[#AE00FF] font-bold mt-0.5 tracking-wide uppercase">
                {displayRole}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className={`flex-1 mt-2 space-y-1.5 overflow-y-auto no-scrollbar ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {navItems.map((item) => {
          const isReports = item.href === '/accounting/reports';
          const isActive = isReports
            ? onReportsPage
            : item.href === '/accounting'
            ? pathname === '/accounting'
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (isReports) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => !isCollapsed && setReportsOpen(o => !o)}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center w-full rounded-xl transition-all duration-200 group ${
                    isCollapsed ? 'justify-center h-12' : 'gap-4 px-4 py-3.5'
                  } ${
                    isActive
                      ? 'bg-[#B400FF] text-white shadow-md shadow-purple-200/50'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}
                  />
                  {!isCollapsed && (
                    <>
                      <span className={`text-[13px] flex-1 text-left whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                        {item.label}
                      </span>
                      {reportsOpen
                        ? <ChevronDown size={14} className={isActive ? 'text-white' : 'text-gray-400'} />
                        : <ChevronRight size={14} className={isActive ? 'text-white' : 'text-gray-400'} />
                      }
                    </>
                  )}
                </button>
                {reportsOpen && !isCollapsed && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-purple-100 pl-3">
                    {reportSubItems.map(sub => {
                      const subActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`block text-[12px] px-3 py-2 rounded-lg transition-all ${
                            subActive
                              ? 'text-[#B400FF] font-bold bg-purple-50'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50 font-medium'
                          }`}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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
                className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}
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
