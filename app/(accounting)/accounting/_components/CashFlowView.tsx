'use client';

import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { CashFlowReport, NamedAmount } from '@/modules/finance/services/reports-accounting.service';

interface Props {
  data?: CashFlowReport;
  currentDate: Date;
  priorDate: Date;
  onDateChange?: (key: 'current' | 'prior', iso: string) => void;
}

const EMPTY: CashFlowReport = {
  operating: [],
  investing: [],
  financing: [],
  openingCash: { current: 0, prior: 0 },
  closingCash: { current: 0, prior: 0 },
};

function totalOf(rows: NamedAmount[]) {
  return rows.reduce(
    (acc, r) => ({ current: acc.current + r.current, prior: acc.prior + r.prior }),
    { current: 0, prior: 0 }
  );
}

export function CashFlowView({ data, currentDate, priorDate, onDateChange }: Props) {
  const report = data ?? EMPTY;

  const opTot = totalOf(report.operating);
  const invTot = totalOf(report.investing);
  const finTot = totalOf(report.financing);

  const netChange = {
    current: opTot.current + invTot.current + finTot.current,
    prior: opTot.prior + invTot.prior + finTot.prior,
  };

  const formatCurrency = (val: number) =>
    (val < 0 ? '-' : '') + '₦' + new Intl.NumberFormat('en-NG').format(Math.abs(val));

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-2">
          STATEMENT OF CASH FLOWS
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
              {format(currentDate, 'MMMM yyyy')} (₦)
            </th>
            <th className="py-4 px-4 font-bold text-gray-800 text-right w-1/4 uppercase tracking-wider">
              {format(priorDate, 'MMMM yyyy')} (₦)
            </th>
          </tr>
        </thead>
        <tbody>
          {renderSection('OPERATING ACTIVITIES', report.operating, opTot, formatCurrency, 'Net Cash from OPERATING ACTIVITIES')}
          {renderSection('INVESTING ACTIVITIES', report.investing, invTot, formatCurrency, 'Net Cash from INVESTING ACTIVITIES')}
          {renderSection('FINANCING ACTIVITIES', report.financing, finTot, formatCurrency, 'Net Cash from FINANCING ACTIVITIES')}

          <tr><td colSpan={3} className="py-4"></td></tr>
          <tr className="bg-[#5C2B90] text-white font-bold">
            <td className="py-3 px-4 uppercase">NET CHANGE IN CASH</td>
            <td className="py-3 px-4 text-right">{formatCurrency(netChange.current)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(netChange.prior)}</td>
          </tr>
          <tr className="bg-white text-gray-700 font-bold border-b border-gray-100">
            <td className="py-3 px-4">Opening Cash & Bank Balances</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.openingCash.current)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.openingCash.prior)}</td>
          </tr>
          <tr className="bg-[#107C41] text-white font-black">
            <td className="py-3 px-4 uppercase">CLOSING CASH & BANK BALANCES</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.closingCash.current)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.closingCash.prior)}</td>
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
  fmt: (v: number) => string,
  totalLabel: string
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
          <td className="py-2 px-4 text-gray-700">{item.name}</td>
          <td className="py-2 px-4 text-right text-gray-600">{fmt(item.current)}</td>
          <td className="py-2 px-4 text-right text-gray-600">{fmt(item.prior)}</td>
        </tr>
      ))}
      <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
        <td className="py-3 px-4 uppercase">{totalLabel}</td>
        <td className="py-3 px-4 text-right">{fmt(total.current)}</td>
        <td className="py-3 px-4 text-right">{fmt(total.prior)}</td>
      </tr>
    </>
  );
}
