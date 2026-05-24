'use client';

import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { ExpenseLedgerRow } from '@/modules/finance/services/reports-accounting.service';

interface Props {
  data?: ExpenseLedgerRow[];
  currentDate: Date;
  onDateChange?: (key: 'current' | 'prior', iso: string) => void;
}

export function ExpenseLedgerView({ data, currentDate, onDateChange }: Props) {
  const rows = data ?? [];

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-NG').format(Math.round(Math.abs(val)));

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6 w-full">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-1">
          OPERATIONAL EXPENSES LEDGER
        </h2>
        <div className="text-[14px] text-gray-500 italic flex justify-center items-center gap-2 mt-2">
          Month:
          <Popover>
            <PopoverTrigger className="text-[#5C2B90] hover:text-purple-700 font-bold p-0 h-auto flex gap-1 items-center bg-transparent border-none outline-none cursor-pointer">
              {format(currentDate, 'MMMM yyyy')}
              <CalendarIcon size={14} />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={d => d && onDateChange?.('current', d.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-[13px] whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-center uppercase tracking-wider">#</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Date</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Expense Category</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Description / Narration</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Amount (₦)</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Payment Mode</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Reference No.</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-left uppercase tracking-wider">Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-400 italic text-[13px]">
                  No expenses recorded for selected period.
                </td>
              </tr>
            )}
            {rows.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 border-r border-gray-100 text-gray-600 text-center font-bold">{item.id}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.date}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.category}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.description}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600 font-bold text-blue-600">{formatCurrency(item.amount)}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.paymentMode}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.referenceNo}</td>
                <td className="py-3 px-4 text-gray-700">{item.approvedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
