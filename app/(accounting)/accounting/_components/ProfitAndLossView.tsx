'use client';

import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { ProfitAndLossReport, CategoryExpenseGroup } from '@/modules/finance/services/reports-accounting.service';

interface Props {
  data?: ProfitAndLossReport;
  currentDate: Date;
  priorDate: Date;
  onDateChange?: (key: 'current' | 'prior', iso: string) => void;
}

const EMPTY_REPORT: ProfitAndLossReport = {
  revenue: [],
  costOfSales: [],
  operatingExpenses: [],
  totals: {
    revenue: { current: 0, prior: 0 },
    cos: { current: 0, prior: 0 },
    grossProfit: { current: 0, prior: 0 },
    opex: { current: 0, prior: 0 },
    operatingProfit: { current: 0, prior: 0 },
  },
};

export function ProfitAndLossView({ data, currentDate, priorDate, onDateChange }: Props) {
  const report = data ?? EMPTY_REPORT;

  const grossMarginPct = (gp: number, rev: number) =>
    rev > 0 ? ((gp / rev) * 100).toFixed(2) + '%' : '0%';

  const formatCurrency = (val: number) =>
    (val < 0 ? '-' : '') + '₦' + new Intl.NumberFormat('en-NG').format(Math.abs(val));

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6">
        <h3 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-2">
          STATEMENT OF PROFIT OR LOSS AND OTHER COMPREHENSIVE INCOME
        </h3>
      </div>

      <table className="w-full text-left border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-4 px-4 font-bold text-gray-800 w-1/2"></th>
            <th className="py-4 px-4 font-bold text-gray-800 text-right w-1/4">
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
            <th className="py-4 px-4 font-bold text-gray-800 text-right w-1/4">
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
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>
              REVENUE
            </td>
          </tr>
          {report.revenue.length === 0 && (
            <tr>
              <td colSpan={3} className="py-3 px-4 italic text-gray-400 text-[13px]">
                No revenue recorded for selected period.
              </td>
            </tr>
          )}
          {report.revenue.map((item, idx) => (
            <tr key={`rev-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-4 text-gray-700">{item.name}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.current)}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.prior)}</td>
            </tr>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">TOTAL REVENUE</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.totals.revenue.current)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.totals.revenue.prior)}</td>
          </tr>

          <tr><td className="py-4 px-4" colSpan={3}></td></tr>
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>
              COST OF SALES
            </td>
          </tr>
          {report.costOfSales.map((item, idx) => (
            <tr key={`cos-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-4 text-gray-700">{item.name}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.current)}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.prior)}</td>
            </tr>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">TOTAL COST OF SALES</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.totals.cos.current)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.totals.cos.prior)}</td>
          </tr>
          <tr className="bg-[#107C41] text-white font-bold">
            <td className="py-3 px-4 uppercase">GROSS PROFIT</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.totals.grossProfit.current)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.totals.grossProfit.prior)}</td>
          </tr>
          <tr className="bg-gray-50 italic text-gray-500">
            <td className="py-2 px-4">Gross Profit Margin</td>
            <td className="py-2 px-4 text-right">
              {grossMarginPct(report.totals.grossProfit.current, report.totals.revenue.current)}
            </td>
            <td className="py-2 px-4 text-right">
              {grossMarginPct(report.totals.grossProfit.prior, report.totals.revenue.prior)}
            </td>
          </tr>

          <tr><td className="py-4 px-4" colSpan={3}></td></tr>
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>
              OPERATING EXPENSES
            </td>
          </tr>
          {report.operatingExpenses.length === 0 && (
            <tr>
              <td colSpan={3} className="py-3 px-4 italic text-gray-400 text-[13px]">
                No operating expenses recorded for selected period.
              </td>
            </tr>
          )}
          {report.operatingExpenses.map((group: CategoryExpenseGroup, gi: number) => (
            <React.Fragment key={`opex-group-${gi}`}>
              <tr>
                <td className="py-2 px-4 font-bold text-gray-700 text-[13px] uppercase tracking-wide" colSpan={3}>
                  {group.categoryName}
                </td>
              </tr>
              {group.items.map((item, ii) => (
                <tr key={`opex-item-${gi}-${ii}`} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-8 text-gray-600">{item.name}</td>
                  <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.current)}</td>
                  <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.prior)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="py-2 px-4 italic text-gray-500 text-[13px]">Total {group.categoryName}</td>
                <td className="py-2 px-4 text-right text-[13px] font-medium text-gray-600">{formatCurrency(group.total.current)}</td>
                <td className="py-2 px-4 text-right text-[13px] font-medium text-gray-600">{formatCurrency(group.total.prior)}</td>
              </tr>
              <tr><td colSpan={3} className="py-1"></td></tr>
            </React.Fragment>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">TOTAL OPERATING EXPENSES</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.totals.opex.current)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.totals.opex.prior)}</td>
          </tr>
          <tr className="bg-[#107C41] text-white font-bold">
            <td className="py-3 px-4 uppercase">OPERATING PROFIT/LOSS</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.totals.operatingProfit.current)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(report.totals.operatingProfit.prior)}</td>
          </tr>
          <tr className="bg-gray-50 italic text-gray-500">
            <td className="py-2 px-4">EBIT Margin</td>
            <td className="py-2 px-4 text-right">
              {grossMarginPct(report.totals.operatingProfit.current, report.totals.revenue.current)}
            </td>
            <td className="py-2 px-4 text-right">
              {grossMarginPct(report.totals.operatingProfit.prior, report.totals.revenue.prior)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
