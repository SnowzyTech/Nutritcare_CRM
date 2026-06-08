'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { MonthPicker } from './MonthPicker';
import type { TrialBalanceRow } from '@/modules/finance/services/reports-accounting.service';

interface Props {
  data?: TrialBalanceRow[];
  currentDate: Date;
  onDateChange?: (key: 'current' | 'prior', iso: string) => void;
}

export function TrialBalanceView({ data, currentDate, onDateChange }: Props) {
  const rows = data ?? [];
  const [open, setOpen] = useState(false);

  const totalDebit = rows.reduce((acc, curr) => acc + (curr.debit || 0), 0);
  const totalCredit = rows.reduce((acc, curr) => acc + (curr.credit || 0), 0);

  const formatCurrency = (val: number | null) => {
    if (!val) return '-';
    return new Intl.NumberFormat('en-NG').format(Math.round(val));
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
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-1">
          TRIAL BALANCE
        </h2>
        <div className="text-[14px] text-gray-500 italic flex justify-center items-center gap-2 mt-2">
          For the Month Ended:
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="text-[#5C2B90] hover:text-purple-700 font-bold p-0 h-auto flex gap-1 items-center bg-transparent border-none outline-none cursor-pointer">
              {format(currentDate, 'MMMM yyyy')}
              <CalendarIcon size={14} />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <MonthPicker
                value={currentDate}
                onSelect={token => {
                  onDateChange?.('current', token);
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="w-full max-w-[1000px] mx-auto overflow-x-auto">
        <table className="w-full text-left border-collapse text-[14px] whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-center uppercase tracking-wider">CODE</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">ACCOUNT NAME</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-center uppercase tracking-wider">TYPE</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">DEBIT (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">CREDIT (₦)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-400 italic text-[13px]">
                  No journal entries for selected period.
                </td>
              </tr>
            )}
            {rows.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 border-r border-gray-100 text-[#5C2B90] text-center font-bold">{item.code}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700 font-medium">{item.name}</td>
                <td className={`py-3 px-4 border-r border-gray-100 text-center font-bold ${getTypeColor(item.type)}`}>{item.type}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600 font-medium">{formatCurrency(item.debit)}</td>
                <td className="py-3 px-4 text-right text-gray-600 font-medium">{formatCurrency(item.credit)}</td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="bg-[#107C41] text-white font-bold">
                <td className="py-4 px-4 uppercase tracking-wider text-right" colSpan={3}>TOTALS</td>
                <td className="py-4 px-4 border-r border-white/20 text-right text-[16px]">{formatCurrency(totalDebit)}</td>
                <td className="py-4 px-4 text-right text-[16px]">{formatCurrency(totalCredit)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
