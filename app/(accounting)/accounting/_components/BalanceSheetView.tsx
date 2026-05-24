'use client';

import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { BalanceSheetReport, NamedAmount } from '@/modules/finance/services/reports-accounting.service';

interface Props {
  data?: BalanceSheetReport;
  currentDate: Date;
  priorDate: Date;
  onDateChange?: (key: 'current' | 'prior', iso: string) => void;
}

const EMPTY: BalanceSheetReport = {
  currentAssets: [],
  nonCurrentAssets: [],
  currentLiabilities: [],
  nonCurrentLiabilities: [],
  equity: [],
};

function sum(rows: NamedAmount[]) {
  return rows.reduce(
    (acc, r) => ({ current: acc.current + r.current, prior: acc.prior + r.prior }),
    { current: 0, prior: 0 }
  );
}

export function BalanceSheetView({ data, currentDate, priorDate, onDateChange }: Props) {
  const report = data ?? EMPTY;

  const totalCA = sum(report.currentAssets);
  const totalNCA = sum(report.nonCurrentAssets);
  const totalA = { current: totalCA.current + totalNCA.current, prior: totalCA.prior + totalNCA.prior };
  const totalCL = sum(report.currentLiabilities);
  const totalNCL = sum(report.nonCurrentLiabilities);
  const totalL = { current: totalCL.current + totalNCL.current, prior: totalCL.prior + totalNCL.prior };
  const totalE = sum(report.equity);
  const totalLE = { current: totalL.current + totalE.current, prior: totalL.prior + totalE.prior };

  const formatCurrency = (val: number) =>
    (val < 0 ? '-' : '') + '₦' + new Intl.NumberFormat('en-NG').format(Math.abs(val));

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
          {renderSection('CURRENT ASSETS', report.currentAssets, totalCA, formatCurrency)}
          {renderSection('NON-CURRENT ASSETS', report.nonCurrentAssets, totalNCA, formatCurrency)}

          <tr><td colSpan={3} className="py-2"></td></tr>
          <tr className="bg-[#107C41] text-white font-bold">
            <td className="py-3 px-4 uppercase">TOTAL ASSETS</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalA.current)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalA.prior)}</td>
          </tr>

          {renderSection('CURRENT LIABILITIES', report.currentLiabilities, totalCL, formatCurrency)}
          {renderSection('NON-CURRENT LIABILITIES', report.nonCurrentLiabilities, totalNCL, formatCurrency)}

          <tr><td colSpan={3} className="py-2"></td></tr>
          <tr className="bg-[#107C41] text-white font-bold">
            <td className="py-3 px-4 uppercase">TOTAL LIABILITIES</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalL.current)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalL.prior)}</td>
          </tr>

          {renderSection('EQUITY', report.equity, totalE, formatCurrency)}

          <tr><td colSpan={3} className="py-2"></td></tr>
          <tr className="bg-[#5C2B90] text-white font-bold">
            <td className="py-3 px-4 uppercase">TOTAL EQUITY</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalE.current)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalE.prior)}</td>
          </tr>
          <tr className="bg-[#107C41] text-white font-bold">
            <td className="py-3 px-4 uppercase">TOTAL LIABILITIES + EQUITY</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalLE.current)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalLE.prior)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function renderSection(
  title: string,
  rows: NamedAmount[],
  total: { current: number; prior: number },
  fmt: (v: number) => string
) {
  return (
    <>
      <tr><td colSpan={3} className="py-4"></td></tr>
      <tr>
        <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>
          {title}
        </td>
      </tr>
      {rows.map((item, idx) => (
        <tr key={`${title}-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
          <td
            className={`py-2 px-4 text-gray-700 ${
              item.name.startsWith('Less:') ? 'pl-8 text-gray-500 italic' : ''
            }`}
          >
            {item.name}
          </td>
          <td className="py-2 px-4 text-right text-gray-600">{fmt(item.current)}</td>
          <td className="py-2 px-4 text-right text-gray-600">{fmt(item.prior)}</td>
        </tr>
      ))}
      <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
        <td className="py-3 px-4 uppercase">Total {title}</td>
        <td className="py-3 px-4 text-right">{fmt(total.current)}</td>
        <td className="py-3 px-4 text-right">{fmt(total.prior)}</td>
      </tr>
    </>
  );
}
