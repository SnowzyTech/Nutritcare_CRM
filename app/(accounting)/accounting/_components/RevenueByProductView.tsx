'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import type { RevenueByProductRow } from '@/modules/finance/services/reports-accounting.service';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface Props {
  data?: RevenueByProductRow[];
  currentDate: Date;
  onDateChange?: (key: 'current' | 'prior', iso: string) => void;
}

export function RevenueByProductView({ data, currentDate, onDateChange }: Props) {
  const rows = data ?? [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());

  const processed = rows.map(item => {
    const totalCost = item.productCost + item.deliveryCost + item.waybill + item.adsSpend;
    const grossProfit = item.revenue - totalCost;
    const gmPercent = item.revenue > 0 ? (grossProfit / item.revenue) * 100 : 0;
    return { ...item, totalCost, grossProfit, gmPercent };
  });

  const totals = processed.reduce(
    (acc, curr) => ({
      orders: acc.orders + curr.orders,
      qty: acc.qty + curr.qty,
      revenue: acc.revenue + curr.revenue,
      productCost: acc.productCost + curr.productCost,
      deliveryCost: acc.deliveryCost + curr.deliveryCost,
      waybill: acc.waybill + curr.waybill,
      adsSpend: acc.adsSpend + curr.adsSpend,
      totalCost: acc.totalCost + curr.totalCost,
      grossProfit: acc.grossProfit + curr.grossProfit,
    }),
    { orders: 0, qty: 0, revenue: 0, productCost: 0, deliveryCost: 0, waybill: 0, adsSpend: 0, totalCost: 0, grossProfit: 0 }
  );

  const totalGmPercent = totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : 0;
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-NG').format(Math.round(Math.abs(val)));

  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10 overflow-x-auto w-full">
      <div className="text-center mb-6 w-full">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-2">
          REVENUE & MARGIN BY PRODUCT
        </h2>
        <div className="text-[14px] text-gray-500 italic flex justify-center items-center gap-2 mt-1">
          Month:
          <Popover
            open={pickerOpen}
            onOpenChange={(o) => {
              setPickerOpen(o);
              if (o) setPickerYear(currentDate.getFullYear());
            }}
          >
            <PopoverTrigger className="text-[#5C2B90] hover:text-purple-700 font-bold p-0 h-auto flex gap-1 items-center bg-transparent border-none outline-none cursor-pointer">
              {format(currentDate, 'MMMM yyyy')}
              <CalendarIcon size={14} />
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-3" align="center">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setPickerYear((y) => y - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-purple-50 hover:text-[#5C2B90]"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[14px] font-bold text-gray-800">{pickerYear}</span>
                <button
                  onClick={() => setPickerYear((y) => y + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-purple-50 hover:text-[#5C2B90]"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MONTH_LABELS.map((m, i) => {
                  const isSelected =
                    currentDate.getFullYear() === pickerYear && currentDate.getMonth() === i;
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        // Timezone-neutral month token (YYYY-MM) — avoids the UTC
                        // boundary drift that an ISO timestamp introduces.
                        onDateChange?.('current', `${pickerYear}-${String(i + 1).padStart(2, '0')}`);
                        setPickerOpen(false);
                      }}
                      className={`py-2 rounded-lg text-[13px] font-medium transition-colors not-italic ${
                        isSelected
                          ? 'bg-[#5C2B90] text-white'
                          : 'text-gray-600 hover:bg-purple-50 hover:text-[#5C2B90]'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
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
            {processed.length === 0 && (
              <tr>
                <td colSpan={11} className="py-10 text-center text-gray-400 italic text-[13px]">
                  No product sales for selected period.
                </td>
              </tr>
            )}
            {processed.map((item, idx) => (
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
            {processed.length > 0 && (
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
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
