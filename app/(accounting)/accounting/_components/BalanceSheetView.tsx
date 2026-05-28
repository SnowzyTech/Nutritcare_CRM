'use client';

import React, { Fragment } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { BalanceSheetReport, CategoryExpenseGroup } from '@/modules/finance/services/reports-accounting.service';

interface Props {
  data?: BalanceSheetReport;
  currentDate: Date;
  priorDate: Date;
  onDateChange?: (key: 'current' | 'prior', iso: string) => void;
}

const EMPTY: BalanceSheetReport = { expenseGroups: [] };

export function BalanceSheetView({ data, currentDate, priorDate, onDateChange }: Props) {
  const report = data ?? EMPTY;

  const formatCurrency = (val: number) =>
    (val < 0 ? '-' : '') + '₦' + new Intl.NumberFormat('en-NG').format(Math.abs(val));

  const grandTotal = report.expenseGroups.reduce(
    (acc, g) => ({ current: acc.current + g.total.current, prior: acc.prior + g.total.prior }),
    { current: 0, prior: 0 }
  );

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-2">
          STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)
        </h2>
        <div className="text-[14px] text-gray-500 italic flex justify-center items-center gap-2 mt-1">
          As at:
          <Popover>
            <PopoverTrigger className="text-[#5C2B90] hover:text-purple-700 font-bold p-0 h-auto flex gap-1 items-center bg-transparent border-none outline-none cursor-pointer">
              {format(currentDate, 'do MMMM yyyy')}
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

      <table className="w-full text-left border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-4 px-4 font-bold text-gray-800 w-1/2 text-left uppercase tracking-wider">
              DESCRIPTION
            </th>
            <th className="py-4 px-4 font-bold text-gray-800 text-right w-1/4 uppercase tracking-wider">
              <Popover>
                <PopoverTrigger className="font-bold text-gray-800 hover:text-[#5C2B90] p-0 h-auto w-full justify-end flex gap-2 items-center bg-transparent border-none outline-none cursor-pointer">
                  {format(currentDate, 'MMMM yyyy')} (₦)
                  <CalendarIcon size={14} className="text-gray-400" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={d => d && onDateChange?.('current', d.toISOString())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </th>
            <th className="py-4 px-4 font-bold text-gray-800 text-right w-1/4 uppercase tracking-wider">
              <Popover>
                <PopoverTrigger className="font-bold text-gray-800 hover:text-[#5C2B90] p-0 h-auto w-full justify-end flex gap-2 items-center bg-transparent border-none outline-none cursor-pointer">
                  {format(priorDate, 'MMMM yyyy')} (₦)
                  <CalendarIcon size={14} className="text-gray-400" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={priorDate}
                    onSelect={d => d && onDateChange?.('prior', d.toISOString())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </th>
          </tr>
        </thead>
        <tbody>
          {report.expenseGroups.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-10 px-4 text-center italic text-gray-400 text-[13px]">
                No balance sheet expenses recorded for the selected period. Create expense categories
                tagged as &quot;Balance Sheet&quot; and record expenses against them.
              </td>
            </tr>
          ) : (
            <>
              {report.expenseGroups.map((group: CategoryExpenseGroup, gi: number) => (
                <Fragment key={`bs-group-${gi}`}>
                  <tr><td colSpan={3} className="py-3"></td></tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>
                      {group.categoryName}
                    </td>
                  </tr>
                  {group.items.map((item, ii) => (
                    <tr key={`bs-item-${gi}-${ii}`} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-4 text-gray-700">{item.name}</td>
                      <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.current)}</td>
                      <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.prior)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
                    <td className="py-3 px-4 uppercase">Total {group.categoryName}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(group.total.current)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(group.total.prior)}</td>
                  </tr>
                </Fragment>
              ))}
              <tr><td colSpan={3} className="py-2"></td></tr>
              <tr className="bg-[#107C41] text-white font-bold">
                <td className="py-3 px-4 uppercase">TOTAL</td>
                <td className="py-3 px-4 text-right">{formatCurrency(grandTotal.current)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(grandTotal.prior)}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
