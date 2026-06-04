'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import type { DeliveryTrackerRow } from '@/modules/finance/services/reports-accounting.service';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface Props {
  data?: DeliveryTrackerRow[];
  currentDate: Date;
  onDateChange?: (key: 'current' | 'prior', iso: string) => void;
}

export function DeliveryTrackerView({ data, currentDate, onDateChange }: Props) {
  const rows = data ?? [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-NG').format(Math.round(Math.abs(val)));
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val);

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6 w-full">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-1">
          DELIVERY AGENT TRACKER
        </h2>
        <h3 className="text-[14px] font-bold text-[#107C41] uppercase tracking-wide mb-2">
          Per-Agent Logistics & Revenue Attribution
        </h3>
        <div className="text-[14px] text-gray-500 italic flex justify-center items-center gap-2 mt-2">
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
                <span className="text-[14px] font-bold text-gray-800 not-italic">{pickerYear}</span>
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
                        // Timezone-neutral month token (YYYY-MM).
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
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-center uppercase tracking-wider">#</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Agent Name</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">State / Region</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Top Product</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Orders</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Qty Delivered</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Delivery Cost (₦)</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Waybill (₦)</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider text-purple-700">Misc (₦)</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Total Logistics (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Revenue Attributed (₦)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="py-10 text-center text-gray-400 italic text-[13px]">
                  No agent deliveries for selected period.
                </td>
              </tr>
            )}
            {rows.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 border-r border-gray-100 text-gray-600 text-center font-bold">{item.id}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.agentName}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.stateRegion}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.productDelivered}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600">{formatNumber(item.orders)}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600">{formatNumber(item.qtyDelivered)}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600">{formatCurrency(item.deliveryCost)}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600">{formatCurrency(item.waybill)}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600 text-purple-700">{formatCurrency(item.miscellaneous)}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600 font-bold text-blue-600">{formatCurrency(item.totalLogisticsCost)}</td>
                <td className="py-3 px-4 text-right text-gray-600 font-bold">{formatCurrency(item.revenueAttributed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
