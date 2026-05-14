'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const currentAssetsData = [
  { name: "Cash & Bank Balances", current: 5000000, prior: 4500000 },
  { name: "Accounts Receivable (Trade Debtors)", current: 1200000, prior: 1000000 },
  { name: "Inventory — Finished Goods", current: 3500000, prior: 3200000 },
  { name: "Prepaid Expenses", current: 150000, prior: 120000 },
  { name: "Other Current Assets", current: 50000, prior: 40000 },
];

const nonCurrentAssetsData = [
  { name: "Property, Plant & Equipment (Cost)", current: 8000000, prior: 8000000 },
  { name: "Less: Accumulated Depreciation", current: -1200000, prior: -800000 },
  { name: "Intangible Assets (Branding / IP)", current: 500000, prior: 500000 },
  { name: "Long-term Deposits", current: 200000, prior: 200000 },
];

const currentLiabilitiesData = [
  { name: "Accounts Payable (Trade Creditors)", current: 800000, prior: 750000 },
  { name: "Accrued Expenses", current: 300000, prior: 250000 },
  { name: "Deferred Revenue", current: 100000, prior: 150000 },
  { name: "VAT / Tax Payable", current: 250000, prior: 200000 },
  { name: "Short-term Loans", current: 500000, prior: 600000 },
];

const nonCurrentLiabilitiesData = [
  { name: "Long-term Loans / Borrowings", current: 2000000, prior: 2500000 },
  { name: "Deferred Tax Liability", current: 150000, prior: 150000 },
];

const equityData = [
  { name: "Share Capital", current: 5000000, prior: 5000000 },
  { name: "Retained Earnings (Opening)", current: 3160000, prior: 1500000 },
  { name: "Net Profit / (Loss) for Period", current: 5140000, prior: 5660000 },
  { name: "Other Comprehensive Income", current: 0, prior: 0 },
];

export function BalanceSheetView() {
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date(2026, 4, 31)); // May 2026
  const [previousDate, setPreviousDate] = useState<Date | undefined>(new Date(2026, 3, 30)); // April 2026

  const totalCurrentAssetsCurr = currentAssetsData.reduce((acc, curr) => acc + curr.current, 0);
  const totalCurrentAssetsPrev = currentAssetsData.reduce((acc, curr) => acc + curr.prior, 0);

  const totalNonCurrentAssetsCurr = nonCurrentAssetsData.reduce((acc, curr) => acc + curr.current, 0);
  const totalNonCurrentAssetsPrev = nonCurrentAssetsData.reduce((acc, curr) => acc + curr.prior, 0);

  const totalAssetsCurr = totalCurrentAssetsCurr + totalNonCurrentAssetsCurr;
  const totalAssetsPrev = totalCurrentAssetsPrev + totalNonCurrentAssetsPrev;

  const totalCurrentLiabilitiesCurr = currentLiabilitiesData.reduce((acc, curr) => acc + curr.current, 0);
  const totalCurrentLiabilitiesPrev = currentLiabilitiesData.reduce((acc, curr) => acc + curr.prior, 0);

  const totalNonCurrentLiabilitiesCurr = nonCurrentLiabilitiesData.reduce((acc, curr) => acc + curr.current, 0);
  const totalNonCurrentLiabilitiesPrev = nonCurrentLiabilitiesData.reduce((acc, curr) => acc + curr.prior, 0);

  const totalLiabilitiesCurr = totalCurrentLiabilitiesCurr + totalNonCurrentLiabilitiesCurr;
  const totalLiabilitiesPrev = totalCurrentLiabilitiesPrev + totalNonCurrentLiabilitiesPrev;

  const totalEquityCurr = equityData.reduce((acc, curr) => acc + curr.current, 0);
  const totalEquityPrev = equityData.reduce((acc, curr) => acc + curr.prior, 0);

  const totalLiabilitiesAndEquityCurr = totalLiabilitiesCurr + totalEquityCurr;
  const totalLiabilitiesAndEquityPrev = totalLiabilitiesPrev + totalEquityPrev;

  const formatCurrency = (val: number) => (val < 0 ? '-' : '') + '₦' + new Intl.NumberFormat('en-NG').format(Math.abs(val));

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-2">STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)</h2>
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
          {/* CURRENT ASSETS */}
          <tr><td colSpan={3} className="py-2"></td></tr>
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>CURRENT ASSETS</td>
          </tr>
          {currentAssetsData.map((item, idx) => (
            <tr key={`ca-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-4 text-gray-700">{item.name}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.current)}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.prior)}</td>
            </tr>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">Total CURRENT ASSETS</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalCurrentAssetsCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalCurrentAssetsPrev)}</td>
          </tr>

          {/* NON-CURRENT ASSETS */}
          <tr><td colSpan={3} className="py-4"></td></tr>
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>NON-CURRENT ASSETS</td>
          </tr>
          {nonCurrentAssetsData.map((item, idx) => (
            <tr key={`nca-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
              <td className={`py-2 px-4 text-gray-700 ${item.name.startsWith('Less:') ? 'pl-8 text-gray-500 italic' : ''}`}>{item.name}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.current)}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.prior)}</td>
            </tr>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">Total NON-CURRENT ASSETS</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalNonCurrentAssetsCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalNonCurrentAssetsPrev)}</td>
          </tr>

          {/* TOTAL ASSETS */}
          <tr><td colSpan={3} className="py-2"></td></tr>
          <tr className="bg-[#107C41] text-white font-bold">
            <td className="py-3 px-4 uppercase">TOTAL ASSETS</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalAssetsCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalAssetsPrev)}</td>
          </tr>

          {/* CURRENT LIABILITIES */}
          <tr><td colSpan={3} className="py-4"></td></tr>
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>CURRENT LIABILITIES</td>
          </tr>
          {currentLiabilitiesData.map((item, idx) => (
            <tr key={`cl-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-4 text-gray-700">{item.name}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.current)}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.prior)}</td>
            </tr>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">Total CURRENT LIABILITIES</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalCurrentLiabilitiesCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalCurrentLiabilitiesPrev)}</td>
          </tr>

          {/* NON-CURRENT LIABILITIES */}
          <tr><td colSpan={3} className="py-4"></td></tr>
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>NON-CURRENT LIABILITIES</td>
          </tr>
          {nonCurrentLiabilitiesData.map((item, idx) => (
            <tr key={`ncl-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-4 text-gray-700">{item.name}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.current)}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.prior)}</td>
            </tr>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">Total NON-CURRENT LIABILITIES</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalNonCurrentLiabilitiesCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalNonCurrentLiabilitiesPrev)}</td>
          </tr>

          {/* TOTAL LIABILITIES */}
          <tr><td colSpan={3} className="py-2"></td></tr>
          <tr className="bg-[#107C41] text-white font-bold">
            <td className="py-3 px-4 uppercase">TOTAL LIABILITIES</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalLiabilitiesCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalLiabilitiesPrev)}</td>
          </tr>

          {/* EQUITY */}
          <tr><td colSpan={3} className="py-4"></td></tr>
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>EQUITY</td>
          </tr>
          {equityData.map((item, idx) => (
            <tr key={`eq-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-4 text-gray-700">{item.name}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.current)}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.prior)}</td>
            </tr>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">Total EQUITY</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalEquityCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalEquityPrev)}</td>
          </tr>

          {/* TOTAL EQUITY (ORANGE) & TOTAL L+E (BLUE) */}
          <tr><td colSpan={3} className="py-2"></td></tr>
          <tr className="bg-[#5C2B90] text-white font-bold">
            <td className="py-3 px-4 uppercase">TOTAL EQUITY</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalEquityCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalEquityPrev)}</td>
          </tr>
          <tr className="bg-[#107C41] text-white font-bold">
            <td className="py-3 px-4 uppercase">TOTAL LIABILITIES + EQUITY</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalLiabilitiesAndEquityCurr)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalLiabilitiesAndEquityPrev)}</td>
          </tr>
          <tr>
            <td className="py-3 px-4"></td>
            <td className="py-3 px-4 text-right text-rose-500 font-black">-</td>
            <td className="py-3 px-4 text-right text-rose-500 font-black">-</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
