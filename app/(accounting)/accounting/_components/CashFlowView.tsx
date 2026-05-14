'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const operatingActivitiesData = [
  { name: "Net Profit / (Loss) Before Tax", current: 5140000, prior: 5660000 },
  { name: "Add: Depreciation & Amortisation", current: 400000, prior: 400000 },
  { name: "(Increase) / Decrease in Inventory", current: -300000, prior: -500000 },
  { name: "(Increase) / Decrease in Receivables", current: -200000, prior: -150000 },
  { name: "Increase / (Decrease) in Payables", current: 50000, prior: 100000 },
  { name: "Increase / (Decrease) in Accruals", current: 50000, prior: 50000 },
  { name: "Tax Paid", current: -250000, prior: -200000 },
];

const investingActivitiesData = [
  { name: "Purchase of Equipment / Machinery", current: 0, prior: -1500000 },
  { name: "Proceeds from Asset Disposal", current: 0, prior: 0 },
  { name: "Investment in R&D", current: -200000, prior: -150000 },
];

const financingActivitiesData = [
  { name: "Proceeds from Loans / Borrowings", current: 0, prior: 500000 },
  { name: "Repayment of Loans", current: -500000, prior: -200000 },
  { name: "Capital Injection by Owners", current: 0, prior: 0 },
  { name: "Dividends Paid", current: -1000000, prior: 0 },
];

export function CashFlowView() {
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date(2026, 4, 31)); // May 2026
  const [previousDate, setPreviousDate] = useState<Date | undefined>(new Date(2026, 3, 30)); // April 2026

  const totalOperatingCurr = operatingActivitiesData.reduce((acc, curr) => acc + curr.current, 0);
  const totalOperatingPrev = operatingActivitiesData.reduce((acc, curr) => acc + curr.prior, 0);

  const totalInvestingCurr = investingActivitiesData.reduce((acc, curr) => acc + curr.current, 0);
  const totalInvestingPrev = investingActivitiesData.reduce((acc, curr) => acc + curr.prior, 0);

  const totalFinancingCurr = financingActivitiesData.reduce((acc, curr) => acc + curr.current, 0);
  const totalFinancingPrev = financingActivitiesData.reduce((acc, curr) => acc + curr.prior, 0);

  const netChangeCurr = totalOperatingCurr + totalInvestingCurr + totalFinancingCurr;
  const netChangePrev = totalOperatingPrev + totalInvestingPrev + totalFinancingPrev;

  // Assuming opening cash is calculated to balance to the Balance Sheet cash
  const openingCashCurr = 1810000;
  const openingCashPrev = 490000;

  const closingCashCurr = netChangeCurr + openingCashCurr;
  const closingCashPrev = netChangePrev + openingCashPrev;

  const formatCurrency = (val: number) => (val < 0 ? '-' : '') + '₦' + new Intl.NumberFormat('en-NG').format(Math.abs(val));

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-2">STATEMENT OF CASH FLOWS</h2>

        <div className="text-[14px] text-gray-500 italic flex justify-center items-center gap-2 mt-1">
          As at:
          <Popover>
            <PopoverTrigger className="text-[#5C2B90] hover:text-purple-700 font-bold p-0 h-auto flex gap-1 items-center bg-transparent border-none outline-none cursor-pointer">
              {currentDate ? format(currentDate, "do MMMM yyyy") : ""}
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

      <table className="w-full text-left border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-4 px-4 font-bold text-gray-800 w-1/2 text-left uppercase tracking-wider">DESCRIPTION</th>
            <th className="py-4 px-4 font-bold text-gray-800 text-right w-1/4 uppercase tracking-wider">
              <Popover>
                <PopoverTrigger className="font-bold text-gray-800 hover:text-[#5C2B90] p-0 h-auto w-full justify-end flex gap-2 items-center bg-transparent border-none outline-none cursor-pointer">
                  {currentDate ? format(currentDate, "MMMM") : "CURRENT PERIOD"} (₦)
                  <CalendarIcon size={14} className="text-gray-400" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={setCurrentDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </th>
            <th className="py-4 px-4 font-bold text-gray-800 text-right w-1/4 uppercase tracking-wider">
              <Popover>
                <PopoverTrigger className="font-bold text-gray-800 hover:text-[#5C2B90] p-0 h-auto w-full justify-end flex gap-2 items-center bg-transparent border-none outline-none cursor-pointer">
                  {previousDate ? format(previousDate, "MMMM") : "PRIOR PERIOD"} (₦)
                  <CalendarIcon size={14} className="text-gray-400" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={previousDate}
                    onSelect={setPreviousDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </th>
          </tr>
        </thead>
        <tbody>
          {/* OPERATING ACTIVITIES */}
          <tr><td colSpan={3} className="py-2"></td></tr>
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>OPERATING ACTIVITIES</td>
          </tr>
          {operatingActivitiesData.map((item, idx) => (
            <tr key={`oa-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-4 text-gray-700">{item.name}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.current)}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.prior)}</td>
            </tr>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">Net Cash from OPERATING ACTIVITIES</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalOperatingCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalOperatingPrev)}</td>
          </tr>

          {/* INVESTING ACTIVITIES */}
          <tr><td colSpan={3} className="py-4"></td></tr>
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>INVESTING ACTIVITIES</td>
          </tr>
          {investingActivitiesData.map((item, idx) => (
            <tr key={`ia-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-4 text-gray-700">{item.name}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.current)}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.prior)}</td>
            </tr>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">Net Cash from INVESTING ACTIVITIES</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalInvestingCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalInvestingPrev)}</td>
          </tr>

          {/* FINANCING ACTIVITIES */}
          <tr><td colSpan={3} className="py-4"></td></tr>
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>FINANCING ACTIVITIES</td>
          </tr>
          {financingActivitiesData.map((item, idx) => (
            <tr key={`fa-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-4 text-gray-700">{item.name}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.current)}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.prior)}</td>
            </tr>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">Net Cash from FINANCING ACTIVITIES</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalFinancingCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalFinancingPrev)}</td>
          </tr>

          {/* TOTALS */}
          <tr><td colSpan={3} className="py-4"></td></tr>
          <tr className="bg-[#5C2B90] text-white font-bold">
            <td className="py-3 px-4 uppercase">NET CHANGE IN CASH</td>
            <td className="py-3 px-4 text-right">{formatCurrency(netChangeCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(netChangePrev)}</td>
          </tr>
          <tr className="bg-white text-gray-700 font-bold border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4">Opening Cash & Bank Balances</td>
            <td className="py-3 px-4 text-right">{formatCurrency(openingCashCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(openingCashPrev)}</td>
          </tr>
          <tr className="bg-[#107C41] text-white font-black">
            <td className="py-3 px-4 uppercase">CLOSING CASH & BANK BALANCES</td>
            <td className="py-3 px-4 text-right">{formatCurrency(closingCashCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(closingCashPrev)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
