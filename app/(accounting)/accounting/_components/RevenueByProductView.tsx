'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const productRevenueData = [
  { name: "Neuro-Vive Balm", orders: 120, qty: 150, revenue: 1500000, productCost: 500000, deliveryCost: 100000, waybill: 50000, adsSpend: 200000 },
  { name: "Trim & Tone Tea", orders: 300, qty: 450, revenue: 3500000, productCost: 1200000, deliveryCost: 200000, waybill: 100000, adsSpend: 400000 },
  { name: "Shred Belly Tea", orders: 250, qty: 300, revenue: 2800000, productCost: 900000, deliveryCost: 150000, waybill: 80000, adsSpend: 300000 },
  { name: "Prosxact Pack", orders: 150, qty: 200, revenue: 1800000, productCost: 600000, deliveryCost: 120000, waybill: 60000, adsSpend: 250000 },
  { name: "Afternatal Tea", orders: 100, qty: 120, revenue: 950000, productCost: 300000, deliveryCost: 80000, waybill: 40000, adsSpend: 150000 },
  { name: "Fonio Mill", orders: 80, qty: 100, revenue: 800000, productCost: 250000, deliveryCost: 60000, waybill: 30000, adsSpend: 100000 },
  { name: "Nivel Mor Tea", orders: 90, qty: 110, revenue: 850000, productCost: 280000, deliveryCost: 70000, waybill: 35000, adsSpend: 120000 },
  { name: "Vitorep Plus", orders: 60, qty: 80, revenue: 600000, productCost: 200000, deliveryCost: 50000, waybill: 25000, adsSpend: 80000 },
];

export function RevenueByProductView() {
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date());

  const processedData = productRevenueData.map(item => {
    const totalCost = item.productCost + item.deliveryCost + item.waybill + item.adsSpend;
    const grossProfit = item.revenue - totalCost;
    const gmPercent = item.revenue > 0 ? (grossProfit / item.revenue) * 100 : 0;
    return {
      ...item,
      totalCost,
      grossProfit,
      gmPercent
    };
  });

  const totals = processedData.reduce((acc, curr) => ({
    orders: acc.orders + curr.orders,
    qty: acc.qty + curr.qty,
    revenue: acc.revenue + curr.revenue,
    productCost: acc.productCost + curr.productCost,
    deliveryCost: acc.deliveryCost + curr.deliveryCost,
    waybill: acc.waybill + curr.waybill,
    adsSpend: acc.adsSpend + curr.adsSpend,
    totalCost: acc.totalCost + curr.totalCost,
    grossProfit: acc.grossProfit + curr.grossProfit,
  }), {
    orders: 0, qty: 0, revenue: 0, productCost: 0, deliveryCost: 0, waybill: 0, adsSpend: 0, totalCost: 0, grossProfit: 0
  });

  const totalGmPercent = totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : 0;

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-NG').format(Math.abs(val));

  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10 overflow-x-auto w-full">
      <div className="text-center mb-6 w-full">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-2">REVENUE & MARGIN BY PRODUCT</h2>
        
        <div className="text-[14px] text-gray-500 italic flex justify-center items-center gap-2 mt-1">
          Month:
          <Popover>
            <PopoverTrigger className="text-[#5C2B90] hover:text-purple-700 font-bold p-0 h-auto flex gap-1 items-center bg-transparent border-none outline-none cursor-pointer">
              {currentDate ? format(currentDate, "MMMM yyyy") : "Select Month"}
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
              <th className="py-4 px-4 font-bold text-gray-800 text-left uppercase tracking-wider">PRODUCT / SKU</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Orders</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Units Qty</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Revenue (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Product Cost (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Delivery Cost (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Waybill (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Ads Spend (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Total Cost (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Gross Profit (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">GM %</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-4 text-gray-700 font-medium">{item.name}</td>
                <td className="py-2 px-4 text-right text-gray-600">{item.orders}</td>
                <td className="py-2 px-4 text-right text-gray-600">{item.qty}</td>
                <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.revenue)}</td>
                <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.productCost)}</td>
                <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.deliveryCost)}</td>
                <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.waybill)}</td>
                <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(item.adsSpend)}</td>
                <td className="py-2 px-4 text-right text-gray-600 font-medium">{formatCurrency(item.totalCost)}</td>
                <td className="py-2 px-4 text-right text-gray-600 font-bold">{formatCurrency(item.grossProfit)}</td>
                <td className="py-2 px-4 text-right text-gray-600">{item.gmPercent.toFixed(1)}%</td>
              </tr>
            ))}
            <tr className="bg-[#107C41] text-white font-bold">
              <td className="py-3 px-4 uppercase tracking-wider">TOTAL</td>
              <td className="py-3 px-4 text-right">{totals.orders}</td>
              <td className="py-3 px-4 text-right">{totals.qty}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(totals.revenue)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(totals.productCost)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(totals.deliveryCost)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(totals.waybill)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(totals.adsSpend)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(totals.totalCost)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(totals.grossProfit)}</td>
              <td className="py-3 px-4 text-right">{totalGmPercent.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
