'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const revenueData = [
  { name: "Neuro-Vive Balm", may: 1250000, april: 1100000 },
  { name: "Trim&Tone Tea", may: 2450000, april: 2300000 },
  { name: "Shred Belly Tea", may: 3100000, april: 2800000 },
  { name: "Prosxact Pack", may: 1850000, april: 1600000 },
  { name: "Afternatal Tea", may: 950000, april: 850000 },
  { name: "Fonio Mill", may: 1100000, april: 1050000 },
  { name: "Nivel Mor Tea", may: 800000, april: 750000 },
];

const costOfSalesData = [
  { name: "Shred Belly Tea", may: 900000, april: 850000 },
  { name: "Trim & Tone Tea", may: 750000, april: 700000 },
  { name: "After Natal", may: 300000, april: 280000 },
  { name: "Nivel Mor Tea", may: 250000, april: 240000 },
  { name: "Neuro-Vive Balm", may: 400000, april: 350000 },
  { name: "Fonio Mill", may: 350000, april: 320000 },
  { name: "Prosxact Pack", may: 550000, april: 500000 },
  { name: "Vitorep", may: 150000, april: 130000 }
];

const operatingExpensesData = [
  { name: "Delivery Costs (80+ Agents Nationwide)", may: 1200000, april: 1150000 },
  { name: "Advertising & Digital Marketing (Facebook Ads)", may: 1500000, april: 1400000 },
  { name: "Logistics & Courier", may: 400000, april: 380000 },
  { name: "Office Supplies", may: 150000, april: 140000 },
  { name: "Office Maintenance", may: 100000, april: 90000 },
  { name: "Waste Disposal", may: 20000, april: 20000 },
  { name: "Internet", may: 50000, april: 50000 },
  { name: "Fuel/Diesel", may: 300000, april: 280000 },
  { name: "Miscelleanous/ Office Expenses", may: 100000, april: 80000 },
  { name: "Sundry Expenses", may: 50000, april: 45000 },
  { name: "Transportation", may: 150000, april: 130000 },
  { name: "Research & Development", may: 200000, april: 150000 },
  { name: "Advertisement and Marketing Tools", may: 250000, april: 220000 },
  { name: "Salary", may: 2500000, april: 2500000 },
  { name: "Rent", may: 500000, april: 500000 },
  { name: "Commission", may: 400000, april: 350000 },
  { name: "Depreciation", may: 150000, april: 150000 },
  { name: "Compliance&Regulatory", may: 100000, april: 50000 }
];

export function ProfitAndLossView() {
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date(2026, 4, 31)); // May 2026
  const [previousDate, setPreviousDate] = useState<Date | undefined>(new Date(2026, 3, 30)); // April 2026

  const totalRevenueCurrent = revenueData.reduce((acc, curr) => acc + curr.may, 0);
  const totalRevenuePrev = revenueData.reduce((acc, curr) => acc + curr.april, 0);

  const totalCosCurrent = costOfSalesData.reduce((acc, curr) => acc + curr.may, 0);
  const totalCosPrev = costOfSalesData.reduce((acc, curr) => acc + curr.april, 0);

  const grossProfitCurrent = totalRevenueCurrent - totalCosCurrent;
  const grossProfitPrev = totalRevenuePrev - totalCosPrev;

  const grossMarginCurrent = totalRevenueCurrent ? ((grossProfitCurrent / totalRevenueCurrent) * 100).toFixed(2) + "%" : "0%";
  const grossMarginPrev = totalRevenuePrev ? ((grossProfitPrev / totalRevenuePrev) * 100).toFixed(2) + "%" : "0%";

  const totalOpexCurrent = operatingExpensesData.reduce((acc, curr) => acc + curr.may, 0);
  const totalOpexPrev = operatingExpensesData.reduce((acc, curr) => acc + curr.april, 0);

  const operatingProfitCurrent = grossProfitCurrent - totalOpexCurrent;
  const operatingProfitPrev = grossProfitPrev - totalOpexPrev;

  const ebitMarginCurrent = totalRevenueCurrent ? ((operatingProfitCurrent / totalRevenueCurrent) * 100).toFixed(2) + "%" : "0%";
  const ebitMarginPrev = totalRevenuePrev ? ((operatingProfitPrev / totalRevenuePrev) * 100).toFixed(2) + "%" : "0%";

  const formatCurrency = (val: number) => (val < 0 ? '-' : '') + '₦' + new Intl.NumberFormat('en-NG').format(Math.abs(val));

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6">
        <h3 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-2">STATEMENT OF PROFIT OR LOSS AND OTHER COMPREHENSIVE INCOME</h3>
        {/* <p className="text-[14px] text-gray-500 italic">For the Month Ended {currentDate ? format(currentDate, "do MMMM yyyy") : "31st May 2026"}</p> */}
      </div>

      <table className="w-full text-left border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-4 px-4 font-bold text-gray-800 w-1/2"></th>
            <th className="py-4 px-4 font-bold text-gray-800 text-right w-1/4">
              <Popover>
                <PopoverTrigger className="font-bold text-gray-800 hover:text-[#5C2B90] p-0 h-auto w-full justify-end flex gap-2 items-center bg-transparent border-none outline-none cursor-pointer">
                  {currentDate ? format(currentDate, "MMMM") : "May"} (₦)
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
            <th className="py-4 px-4 font-bold text-gray-800 text-right w-1/4">
              <Popover>
                <PopoverTrigger className="font-bold text-gray-800 hover:text-[#5C2B90] p-0 h-auto w-full justify-end flex gap-2 items-center bg-transparent border-none outline-none cursor-pointer">
                  {previousDate ? format(previousDate, "MMMM") : "April"} (₦)
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
          {/* REVENUE */}
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>REVENUE</td>
          </tr>
          {revenueData.map((item, idx) => (
            <tr key={`rev-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-4 text-gray-700">{item.name}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.may)}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.april)}</td>
            </tr>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">TOTAL REVENUE</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalRevenueCurrent)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalRevenuePrev)}</td>
          </tr>

          {/* COST OF SALES */}
          <tr>
            <td className="py-4 px-4" colSpan={3}></td>
          </tr>
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>COST OF SALES</td>
          </tr>
          {costOfSalesData.map((item, idx) => (
            <tr key={`cos-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-4 text-gray-700">{item.name}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.may)}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.april)}</td>
            </tr>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">TOTAL COST OF SALES</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalCosCurrent)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalCosPrev)}</td>
          </tr>
          <tr className="bg-[#107C41] text-white font-bold">
            <td className="py-3 px-4 uppercase">GROSS PROFIT</td>
            <td className="py-3 px-4 text-right">{formatCurrency(grossProfitCurrent)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(grossProfitPrev)}</td>
          </tr>
          <tr className="bg-gray-50 italic text-gray-500">
            <td className="py-2 px-4">Gross Profit Margin</td>
            <td className="py-2 px-4 text-right">{grossMarginCurrent}</td>
            <td className="py-2 px-4 text-right">{grossMarginPrev}</td>
          </tr>

          {/* OPERATING EXPENSES */}
          <tr>
            <td className="py-4 px-4" colSpan={3}></td>
          </tr>
          <tr>
            <td className="py-3 px-4 font-black text-[#1E3A8A] uppercase text-[15px]" colSpan={3}>OPERATING EXPENSES</td>
          </tr>
          {operatingExpensesData.map((item, idx) => (
            <tr key={`opex-${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-4 text-gray-700">{item.name}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.may)}</td>
              <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.april)}</td>
            </tr>
          ))}
          <tr className="bg-[#E6F0FA] font-bold text-[#1E3A8A]">
            <td className="py-3 px-4 uppercase">TOTAL OPERATING EXPENSES</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalOpexCurrent)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalOpexPrev)}</td>
          </tr>
          <tr className="bg-[#107C41] text-white font-bold">
            <td className="py-3 px-4 uppercase">OPERATING PROFIT/LOSS</td>
            <td className="py-3 px-4 text-right">{formatCurrency(operatingProfitCurrent)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(operatingProfitPrev)}</td>
          </tr>
          <tr className="bg-gray-50 italic text-gray-500">
            <td className="py-2 px-4">EBIT Margin</td>
            <td className="py-2 px-4 text-right">{ebitMarginCurrent}</td>
            <td className="py-2 px-4 text-right">{ebitMarginPrev}</td>
          </tr>

        </tbody>
      </table>
    </div>
  );
}
