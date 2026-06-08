'use client';

import React, { Fragment, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { MonthPicker } from './MonthPicker';
import type { CashFlowReport, CashFlowSection } from '@/modules/finance/services/reports-accounting.service';

interface Props {
  data?: CashFlowReport;
  currentDate: Date;
  priorDate: Date;
  onDateChange?: (key: 'current' | 'prior', iso: string) => void;
}

const EMPTY: CashFlowReport = {
  sections: [],
  netChange: { current: 0, prior: 0 },
  openingCash: { current: 0, prior: 0 },
  closingCash: { current: 0, prior: 0 },
  unexplained: { current: 0, prior: 0 },
};

const fmt = (val: number) =>
  (val < 0 ? '-' : '') + '₦' + new Intl.NumberFormat('en-NG').format(Math.round(Math.abs(val)));

export function CashFlowView({ data, currentDate, priorDate, onDateChange }: Props) {
  const report = data ?? EMPTY;
  const [openCur, setOpenCur] = useState(false);
  const [openPri, setOpenPri] = useState(false);

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-2">
          STATEMENT OF CASH FLOWS
        </h2>
        <div className="text-[14px] text-gray-500 italic flex justify-center items-center gap-2 mt-1">
          For the month of:
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
          {report.sections.map((sec: CashFlowSection, si: number) => (
            <Fragment key={`cf-sec-${si}`}>
              <tr><td colSpan={3} className="py-2" /></tr>
              <tr>
                <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>{sec.title}</td>
              </tr>
              {sec.lines.map((line, li) => (
                <tr key={`cf-line-${si}-${li}`} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-4 text-gray-700">{line.label}</td>
                  <td className="py-2 px-4 text-right text-gray-600">{fmt(line.current)}</td>
                  <td className="py-2 px-4 text-right text-gray-600">{fmt(line.prior)}</td>
                </tr>
              ))}
              <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
                <td className="py-3 px-4 uppercase">Net cash from {sec.title.replace(/^Cash flow from /i, '')}</td>
                <td className="py-3 px-4 text-right">{fmt(sec.subtotal.current)}</td>
                <td className="py-3 px-4 text-right">{fmt(sec.subtotal.prior)}</td>
              </tr>
            </Fragment>
          ))}

          <tr><td colSpan={3} className="py-2" /></tr>
          <tr className="bg-[#107C41] text-white font-bold">
            <td className="py-3 px-4 uppercase">Net change in cash (per activities)</td>
            <td className="py-3 px-4 text-right">{fmt(report.netChange.current)}</td>
            <td className="py-3 px-4 text-right">{fmt(report.netChange.prior)}</td>
          </tr>
          <tr className="border-b border-gray-50">
            <td className="py-2 px-4 text-gray-700">Opening cash &amp; bank (derived)</td>
            <td className="py-2 px-4 text-right text-gray-600">{fmt(report.openingCash.current)}</td>
            <td className="py-2 px-4 text-right text-gray-600">{fmt(report.openingCash.prior)}</td>
          </tr>
          <tr className="border-b border-gray-50">
            <td className="py-2 px-4 text-gray-700 font-semibold">Closing cash &amp; bank (derived)</td>
            <td className="py-2 px-4 text-right text-gray-700 font-semibold">{fmt(report.closingCash.current)}</td>
            <td className="py-2 px-4 text-right text-gray-700 font-semibold">{fmt(report.closingCash.prior)}</td>
          </tr>
          {(report.unexplained.current || report.unexplained.prior) ? (
            <tr className="border-b border-gray-50">
              <td className="py-2 px-4 text-amber-600 italic">Unreconciled difference *</td>
              <td className="py-2 px-4 text-right text-amber-600 italic">{fmt(report.unexplained.current)}</td>
              <td className="py-2 px-4 text-right text-amber-600 italic">{fmt(report.unexplained.prior)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <p className="text-[11px] text-gray-400 italic mt-4">
        Indirect method, derived from operational subledgers rather than a fully-posted general ledger.
        * The unreconciled difference is the gap between the derived cash movement and the sum of the
        activity sections; it shrinks as more transactions are journalled.
      </p>
    </div>
  );
}
