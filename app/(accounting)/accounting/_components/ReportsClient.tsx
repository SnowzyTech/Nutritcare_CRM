'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ProfitAndLossView } from './ProfitAndLossView';
import { BalanceSheetView as StatementOfFinancialPosition } from './BalanceSheetView';
import { CashFlowView as StatementOfCashFlow } from './CashFlowView';
import { RevenueByProductView } from './RevenueByProductView';
import { InventoryValuationView } from './InventoryValuationView';
import { ExpenseLedgerView } from './ExpenseLedgerView';
import { DeliveryTrackerView } from './DeliveryTrackerView';
import { TrialBalanceView } from './TrialBalanceView';

const reportTypes = [
  "Profit & Loss",
  "STATEMENT OF FINANCIAL POSITION",
  "STATEMENT OF CASH FLOW",
  "Revenue By Product",
  "Inventory Valuation",
  "Expense Ledger",
  "Delivery Tracker",
  "Trial Balance"
];

interface ReportsClientProps {
  initialTab?: string;
  reportData?: any;
  currentDate?: string;
  priorDate?: string;
}

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
const unslugify = (slug: string) => {
  const map: Record<string, string> = {};
  reportTypes.forEach(t => (map[slugify(t)] = t));
  return map[slug] || "Profit & Loss";
};

export function ReportsClient({
  initialTab,
  reportData,
  currentDate,
  priorDate,
}: ReportsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultTab = initialTab ? unslugify(initialTab) : "Profit & Loss";
  const [activeReport, setActiveReport] = useState(defaultTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  React.useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveReport(unslugify(tabParam));
  }, [searchParams]);

  const handleTabChange = (type: string) => {
    setActiveReport(type);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', slugify(type));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const updatePeriod = (key: 'current' | 'prior', iso: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, iso);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const currentDateObj = currentDate ? new Date(currentDate) : new Date();
  const priorDateObj = priorDate ? new Date(priorDate) : new Date();

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F9FAFB]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <ChevronRight size={20} />
          </button>
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <RotateCcw size={18} />
          </button>
        </div>
        <div className="w-14 h-14 bg-[#F3E8FF] rounded-full flex items-center justify-center">
          <div className="w-10 h-10 bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 cursor-pointer">
            <MessageCircle size={22} fill="currentColor" />
          </div>
        </div>
      </div>

      <h1 className="text-[32px] font-bold text-gray-800 mb-10 tracking-tight leading-none">
        Reports
      </h1>

      <div className="flex gap-4 items-start">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed bottom-6 right-6 bg-[#5C2B90] text-white p-4 rounded-full shadow-lg z-50 hover:bg-purple-800 transition-all"
        >
          {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>

        <div
          className={`${
            isSidebarOpen
              ? 'w-[230px] opacity-100 visible'
              : 'w-0 opacity-0 invisible overflow-hidden'
          } shrink-0 bg-white rounded-[40px] p-4 border border-gray-100 shadow-sm sticky top-8 self-start transition-all duration-300 ease-in-out`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-4 px-4">
              <h3 className="text-gray-400 font-bold text-[12px] uppercase tracking-wider">
                Reports
              </h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
            {reportTypes.map(type => (
              <button
                key={type}
                onClick={() => handleTabChange(type)}
                className={`w-full text-left text-[15px] font-bold px-6 py-4 rounded-3xl transition-all ${
                  activeReport === type
                    ? 'text-[#5C2B90] bg-[#F3E8FF]'
                    : 'text-[#8A94A6] hover:text-[#5C2B90] hover:bg-purple-50/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0 transition-all duration-300">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="mb-6 flex items-center gap-2 text-[#5C2B90] font-bold hover:text-purple-800 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"
            >
              <ChevronRight size={18} />
              Show Menu
            </button>
          )}

          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-gray-800 tracking-tight">{activeReport}</h2>
            <p className="text-gray-400 text-[14px]">
              Financial reporting for the selected period
            </p>
          </div>

          {activeReport === "Profit & Loss" && (
            <ProfitAndLossView
              data={reportData}
              currentDate={currentDateObj}
              priorDate={priorDateObj}
              onDateChange={updatePeriod}
            />
          )}
          {activeReport === "STATEMENT OF FINANCIAL POSITION" && (
            <StatementOfFinancialPosition
              data={reportData}
              currentDate={currentDateObj}
              priorDate={priorDateObj}
              onDateChange={updatePeriod}
            />
          )}
          {activeReport === "STATEMENT OF CASH FLOW" && (
            <StatementOfCashFlow
              data={reportData}
              currentDate={currentDateObj}
              priorDate={priorDateObj}
              onDateChange={updatePeriod}
            />
          )}
          {activeReport === "Revenue By Product" && (
            <RevenueByProductView
              data={reportData}
              currentDate={currentDateObj}
              onDateChange={updatePeriod}
            />
          )}
          {activeReport === "Inventory Valuation" && (
            <InventoryValuationView
              data={reportData}
              currentDate={currentDateObj}
              onDateChange={updatePeriod}
            />
          )}
          {activeReport === "Expense Ledger" && (
            <ExpenseLedgerView
              data={reportData}
              currentDate={currentDateObj}
              onDateChange={updatePeriod}
            />
          )}
          {activeReport === "Delivery Tracker" && (
            <DeliveryTrackerView
              data={reportData}
              currentDate={currentDateObj}
              onDateChange={updatePeriod}
            />
          )}
          {activeReport === "Trial Balance" && (
            <TrialBalanceView
              data={reportData}
              currentDate={currentDateObj}
              onDateChange={updatePeriod}
            />
          )}
        </div>
      </div>
    </div>
  );
}
