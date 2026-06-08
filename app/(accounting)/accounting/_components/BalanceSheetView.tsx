'use client';

import React, { Fragment, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { MonthPicker } from './MonthPicker';
import type { BalanceSheetReport, BalanceSheetLine } from '@/modules/finance/services/reports-accounting.service';

interface Props {
  data?: BalanceSheetReport;
  currentDate: Date;
  priorDate: Date;
  onDateChange?: (key: 'current' | 'prior', iso: string) => void;
}

const EMPTY: BalanceSheetReport = {
  currentAsOf: new Date().toISOString(),
  priorAsOf: new Date().toISOString(),
  assets: [],
  liabilities: [],
  equity: [],
  totals: { assets: { current: 0, prior: 0 }, liabilities: { current: 0, prior: 0 }, equity: { current: 0, prior: 0 } },
};

const fmt = (val: number) =>
  (val < 0 ? '-' : '') + '₦' + new Intl.NumberFormat('en-NG').format(Math.round(Math.abs(val)));

export function BalanceSheetView({ data, currentDate, priorDate, onDateChange }: Props) {
  const report = data ?? EMPTY;
  const [openCur, setOpenCur] = useState(false);
  const [openPri, setOpenPri] = useState(false);

  const hasData =
    report.assets.some(l => l.current || l.prior) ||
    report.liabilities.some(l => l.current || l.prior) ||
    report.equity.some(l => l.current || l.prior);

  const section = (title: string, lines: BalanceSheetLine[], total: { current: number; prior: number }) => (
    <Fragment>
      <tr><td colSpan={3} className="py-2" /></tr>
      <tr>
        <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>{title}</td>
      </tr>
      {lines.map((item, i) => (
        <tr key={`${title}-${i}`} className="border-b border-gray-50 hover:bg-gray-50">
          <td className="py-2 px-4 text-gray-700">
            {item.label}
            {item.derived && <span className="text-gray-300" title="Derived / heuristic line"> *</span>}
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
    </Fragment>
  );

  const totalLiabEquity = {
    current: report.totals.liabilities.current + report.totals.equity.current,
    prior: report.totals.liabilities.prior + report.totals.equity.prior,
  };

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-2">
          STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)
        </h2>
        <div className="text-[14px] text-gray-500 italic flex justify-center items-center gap-2 mt-1">
          As at the end of:
          <Popover open={openCur} onOpenChange={setOpenCur}>
            <PopoverTrigger className="text-[#5C2B90] hover:text-purple-700 font-bold p-0 h-auto flex gap-1 items-center bg-transparent border-none outline-none cursor-pointer">
              {format(currentDate, 'MMMM yyyy')}
              <CalendarIcon size={14} />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <MonthPicker value={currentDate} onSelect={t => { onDateChange?.('current', t); setOpenCur(false); }} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <table className="w-full text-left border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-4 px-4 font-bold text-gray-800 w-1/2 text-left uppercase tracking-wider">DESCRIPTION</th>
            <th className="py-4 px-4 font-bold text-gray-800 text-right w-1/4 uppercase tracking-wider">
              {format(currentDate, 'MMM yyyy')} (₦)
            </th>
            <th className="py-4 px-4 font-bold text-gray-800 text-right w-1/4 uppercase tracking-wider">
              <Popover open={openPri} onOpenChange={setOpenPri}>
                <PopoverTrigger className="font-bold text-gray-800 hover:text-[#5C2B90] p-0 h-auto w-full justify-end flex gap-2 items-center bg-transparent border-none outline-none cursor-pointer">
                  {format(priorDate, 'MMM yyyy')} (₦)
                  <CalendarIcon size={14} className="text-gray-400" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <MonthPicker value={priorDate} onSelect={t => { onDateChange?.('prior', t); setOpenPri(false); }} />
                </PopoverContent>
              </Popover>
            </th>
          </tr>
        </thead>
        <tbody>
          {!hasData ? (
            <tr>
              <td colSpan={3} className="py-10 px-4 text-center italic text-gray-400 text-[13px]">
                No data for the selected period.
              </td>
            </tr>
          ) : (
            <>
              {section('Assets', report.assets, report.totals.assets)}
              {section('Liabilities', report.liabilities, report.totals.liabilities)}
              {section('Equity', report.equity, report.totals.equity)}
              <tr><td colSpan={3} className="py-2" /></tr>
              <tr className="bg-[#107C41] text-white font-bold">
                <td className="py-3 px-4 uppercase">Total Liabilities + Equity</td>
                <td className="py-3 px-4 text-right">{fmt(totalLiabEquity.current)}</td>
                <td className="py-3 px-4 text-right">{fmt(totalLiabEquity.prior)}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {hasData && (
        <p className="text-[11px] text-gray-400 italic mt-4">
          * Derived / heuristic lines. Figures are assembled from operational subledgers (orders, invoices,
          inventory, fixed-asset register, expenses, salaries, purchase orders and payment-account opening
          balances), not a fully-posted general ledger. The balancing adjustment reconciles net assets to
          recorded capital and retained earnings.
        </p>
      )}
    </div>
  );
}
