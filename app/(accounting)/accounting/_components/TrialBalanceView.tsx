'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const trialBalanceData = [
  { code: '1001', name: 'Cash & Bank', type: 'Asset', debit: 2500000, credit: null },
  { code: '1002', name: 'Petty Cash', type: 'Asset', debit: 50000, credit: null },
  { code: '1100', name: 'Accounts Receivable', type: 'Asset', debit: 1200000, credit: null },
  { code: '1200', name: 'Inventory — Finished Goods', type: 'Asset', debit: 3500000, credit: null },
  { code: '1300', name: 'Prepaid Expenses', type: 'Asset', debit: 150000, credit: null },
  { code: '1400', name: 'VAT Input', type: 'Asset', debit: 80000, credit: null },
  { code: '2000', name: 'Property, Plant & Equipment', type: 'Asset', debit: 5000000, credit: null },
  { code: '2001', name: 'Accumulated Depreciation', type: 'Asset', debit: null, credit: 1500000 },
  { code: '3000', name: 'Accounts Payable', type: 'Liability', debit: null, credit: 800000 },
  { code: '3100', name: 'Accrued Expenses', type: 'Liability', debit: null, credit: 200000 },
  { code: '3200', name: 'Tax Payable', type: 'Liability', debit: null, credit: 450000 },
  { code: '3300', name: 'Deferred Revenue', type: 'Liability', debit: null, credit: 100000 },
  { code: '4000', name: 'Share Capital', type: 'Equity', debit: null, credit: 2000000 },
  { code: '4100', name: 'Retained Earnings', type: 'Equity', debit: null, credit: 3200000 },
  { code: '5000', name: 'Sales Revenue — Neuro-Vive Balm', type: 'Revenue', debit: null, credit: 2100000 },
  { code: '5001', name: 'Sales Revenue — Trim & Tone Tea', type: 'Revenue', debit: null, credit: 2130000 },
];

export function TrialBalanceView() {
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date());

  const totalDebit = trialBalanceData.reduce((acc, curr) => acc + (curr.debit || 0), 0);
  const totalCredit = trialBalanceData.reduce((acc, curr) => acc + (curr.credit || 0), 0);

  const formatCurrency = (val: number | null) => {
    if (val === null) return '-';
    return new Intl.NumberFormat('en-NG').format(val);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Asset': return 'text-emerald-600';
      case 'Liability': return 'text-rose-600';
      case 'Equity': return 'text-purple-600';
      case 'Revenue': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6 w-full max-w-[1000px] mx-auto">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-1">TRIAL BALANCE</h2>

        <div className="text-[14px] text-gray-500 italic flex justify-center items-center gap-2 mt-2">
          For the Month Ended:
          <Popover>
            <PopoverTrigger className="text-[#5C2B90] hover:text-purple-700 font-bold p-0 h-auto flex gap-1 items-center bg-transparent border-none outline-none cursor-pointer">
              {currentDate ? format(currentDate, "MMMM yyyy") : "Select Month"}
              <CalendarIcon size={14} />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={setCurrentDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="w-full max-w-[1000px] mx-auto overflow-x-auto">
        <table className="w-full text-left border-collapse text-[14px] whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-center uppercase tracking-wider">ACCOUNT CODE</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">ACCOUNT NAME</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-center uppercase tracking-wider">TYPE</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">DEBIT (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">CREDIT (₦)</th>
            </tr>
          </thead>
          <tbody>
            {trialBalanceData.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 border-r border-gray-100 text-[#5C2B90] text-center font-bold">{item.code}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700 font-medium">{item.name}</td>
                <td className={`py-3 px-4 border-r border-gray-100 text-center font-bold ${getTypeColor(item.type)}`}>{item.type}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600 font-medium">{formatCurrency(item.debit)}</td>
                <td className="py-3 px-4 text-right text-gray-600 font-medium">{formatCurrency(item.credit)}</td>
              </tr>
            ))}
            <tr className="bg-[#107C41] text-white font-bold">
              <td className="py-4 px-4 uppercase tracking-wider text-right" colSpan={3}>TOTALS</td>
              <td className="py-4 px-4 border-r border-white/20 text-right text-[16px]">{formatCurrency(totalDebit)}</td>
              <td className="py-4 px-4 text-right text-[16px]">{formatCurrency(totalCredit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
