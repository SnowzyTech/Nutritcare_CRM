'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const inventoryData = [
  { name: "Neuro-Vive Balm", unit: "Units", openingStock: 500, purchased: 200, sold: 150, unitCost: 3500 },
  { name: "Trim & Tone Tea", unit: "Units", openingStock: 800, purchased: 500, sold: 450, unitCost: 2800 },
  { name: "Shred Belly Tea", unit: "Units", openingStock: 600, purchased: 400, sold: 300, unitCost: 3000 },
  { name: "Prosxact Pack", unit: "Units", openingStock: 400, purchased: 150, sold: 200, unitCost: 4000 },
  { name: "Afternatal Tea", unit: "Units", openingStock: 300, purchased: 100, sold: 120, unitCost: 2500 },
  { name: "Fonio Mill", unit: "Units", openingStock: 250, purchased: 100, sold: 100, unitCost: 2500 },
  { name: "Nivel Mor Tea", unit: "Units", openingStock: 350, purchased: 150, sold: 110, unitCost: 2600 },
  { name: "Vitorep Plus", unit: "Units", openingStock: 200, purchased: 100, sold: 80, unitCost: 2500 },
];

export function InventoryValuationView() {
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date());

  const processedData = inventoryData.map(item => {
    const closingStock = item.openingStock + item.purchased - item.sold;
    const openingValue = item.openingStock * item.unitCost;
    const purchasesValue = item.purchased * item.unitCost;
    const cogsValue = item.sold * item.unitCost;
    const closingValue = closingStock * item.unitCost;

    return {
      ...item,
      closingStock,
      openingValue,
      purchasesValue,
      cogsValue,
      closingValue
    };
  });

  const totals = processedData.reduce((acc, curr) => ({
    openingStock: acc.openingStock + curr.openingStock,
    purchased: acc.purchased + curr.purchased,
    sold: acc.sold + curr.sold,
    closingStock: acc.closingStock + curr.closingStock,
    openingValue: acc.openingValue + curr.openingValue,
    purchasesValue: acc.purchasesValue + curr.purchasesValue,
    cogsValue: acc.cogsValue + curr.cogsValue,
    closingValue: acc.closingValue + curr.closingValue,
  }), {
    openingStock: 0, purchased: 0, sold: 0, closingStock: 0, openingValue: 0, purchasesValue: 0, cogsValue: 0, closingValue: 0
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-NG').format(Math.abs(val));
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val);

  return (
    <div className="bg-white  border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6 w-full">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-1">INVENTORY VALUATION REGISTER</h2>
        <h3 className="text-[14px] font-bold text-[#107C41] uppercase tracking-wide mb-2">Costing Method: Weighted Average Cost (WAC)</h3>

        <div className="text-[14px] text-gray-500 italic flex justify-center items-center gap-2 mt-1">
          As at:
          <Popover>
            <PopoverTrigger className="text-[#5C2B90] hover:text-purple-700 font-bold p-0 h-auto flex gap-1 items-center bg-transparent border-none outline-none cursor-pointer">
              {currentDate ? format(currentDate, "do MMMM yyyy") : "Select Date"}
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

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-[13px] whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-4 px-4 font-bold text-gray-800 text-center uppercase tracking-wider">#</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-left uppercase tracking-wider">PRODUCT / SKU</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-center uppercase tracking-wider">Unit of Measure</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Opening Stock<br /><span className="text-[10px] text-gray-500">(Units)</span></th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Units Purchased</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Units Sold</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Closing Stock<br /><span className="text-[10px] text-gray-500">(Units)</span></th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Unit Cost (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Opening Value (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Purchases Value (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">COGS Value (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Closing Value (₦)</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-4 text-gray-600 text-center font-bold">{idx + 1}</td>
                <td className="py-2 px-4 text-gray-700 font-medium">{item.name}</td>
                <td className="py-2 px-4 text-center text-[#5C2B90] font-medium">{item.unit}</td>
                <td className="py-2 px-4 text-right text-gray-600">{formatNumber(item.openingStock)}</td>
                <td className="py-2 px-4 text-right text-gray-600">{formatNumber(item.purchased)}</td>
                <td className="py-2 px-4 text-right text-gray-600">{formatNumber(item.sold)}</td>
                <td className="py-2 px-4 text-right text-gray-600 font-bold">{formatNumber(item.closingStock)}</td>
                <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.unitCost)}</td>
                <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.openingValue)}</td>
                <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.purchasesValue)}</td>
                <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.cogsValue)}</td>
                <td className="py-2 px-4 text-right text-gray-600 font-bold">{formatCurrency(item.closingValue)}</td>
              </tr>
            ))}
            <tr className="bg-[#107C41] text-white font-bold">
              <td className="py-3 px-4 uppercase tracking-wider" colSpan={3}>TOTALS</td>
              <td className="py-3 px-4 text-right">{formatNumber(totals.openingStock)}</td>
              <td className="py-3 px-4 text-right">{formatNumber(totals.purchased)}</td>
              <td className="py-3 px-4 text-right">{formatNumber(totals.sold)}</td>
              <td className="py-3 px-4 text-right">{formatNumber(totals.closingStock)}</td>
              <td className="py-3 px-4 text-right text-green-300">-</td>
              <td className="py-3 px-4 text-right">{formatCurrency(totals.openingValue)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(totals.purchasesValue)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(totals.cogsValue)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(totals.closingValue)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
