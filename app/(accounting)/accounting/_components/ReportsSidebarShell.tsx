'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TABS = [
  { slug: 'profit-loss', label: 'Profit & Loss' },
  { slug: 'statement-of-financial-position', label: 'Statement of Financial Position' },
  { slug: 'statement-of-cash-flow', label: 'Statement of Cash Flow' },
  { slug: 'revenue-by-product', label: 'Revenue By Product' },
  { slug: 'inventory-valuation', label: 'Inventory Valuation' },
  { slug: 'expense-ledger', label: 'Expense Ledger' },
  { slug: 'delivery-tracker', label: 'Delivery Tracker' },
  { slug: 'trial-balance', label: 'Trial Balance' },
];

export function ReportsSidebarShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="flex gap-4 items-start">
      <div
        className={`${
          isOpen ? 'w-[230px] opacity-100 visible' : 'w-0 opacity-0 invisible overflow-hidden'
        } shrink-0 bg-white rounded-[40px] p-4 border border-gray-100 shadow-sm sticky top-8 self-start transition-all duration-300 ease-in-out`}
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-4 px-4">
            <h3 className="text-gray-400 font-bold text-[12px] uppercase tracking-wider">
              Reports
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
          {TABS.map(t => {
            const isActive = pathname === `/accounting/reports/${t.slug}`;
            return (
              <Link
                key={t.slug}
                href={`/accounting/reports/${t.slug}`}
                className={`block text-[15px] font-bold px-6 py-4 rounded-3xl transition-all ${
                  isActive
                    ? 'text-[#5C2B90] bg-[#F3E8FF]'
                    : 'text-[#8A94A6] hover:text-[#5C2B90] hover:bg-purple-50/50'
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="mb-6 flex items-center gap-2 text-[#5C2B90] font-bold hover:text-purple-800 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"
          >
            <ChevronRight size={18} />
            Show Menu
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
