'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const deliveryData = [
  { id: 1, agentName: 'Mr Ola Adewale', stateRegion: 'Lagos', productDelivered: 'Trim & Tone Tea', orders: 120, qtyDelivered: 150, deliveryCost: 60000, waybill: 15000, miscellaneous: 5000, totalLogisticsCost: 80000, revenueAttributed: 1500000 },
  { id: 2, agentName: 'Mr. Qudus Aina', stateRegion: 'Oyo / Ibadan', productDelivered: 'Neuro-Vive Balm', orders: 85, qtyDelivered: 100, deliveryCost: 45000, waybill: 10000, miscellaneous: 2000, totalLogisticsCost: 57000, revenueAttributed: 950000 },
  { id: 3, agentName: 'Flymack | Lagos', stateRegion: 'Lagos Island', productDelivered: 'Prosxact Pack', orders: 200, qtyDelivered: 250, deliveryCost: 100000, waybill: 25000, miscellaneous: 10000, totalLogisticsCost: 135000, revenueAttributed: 2800000 },
  { id: 4, agentName: 'Mr Oyelowo John', stateRegion: 'FCT Abuja', productDelivered: 'Shred Belly Tea', orders: 150, qtyDelivered: 180, deliveryCost: 75000, waybill: 20000, miscellaneous: 5000, totalLogisticsCost: 100000, revenueAttributed: 1800000 },
  { id: 5, agentName: 'Mrs. Sumni', stateRegion: 'Edo / Benin', productDelivered: 'Combo: Trim+Tone', orders: 60, qtyDelivered: 60, deliveryCost: 35000, waybill: 8000, miscellaneous: 0, totalLogisticsCost: 43000, revenueAttributed: 750000 },
  { id: 6, agentName: 'Mr. Adeola Isaiah', stateRegion: 'Ogun / Abeokuta', productDelivered: 'Afternatal Tea', orders: 90, qtyDelivered: 110, deliveryCost: 48000, waybill: 12000, miscellaneous: 3000, totalLogisticsCost: 63000, revenueAttributed: 1150000 },
  { id: 7, agentName: 'AirPeace Logistics', stateRegion: 'Rivers / PH', productDelivered: 'Fonio Mill', orders: 110, qtyDelivered: 130, deliveryCost: 65000, waybill: 18000, miscellaneous: 4000, totalLogisticsCost: 87000, revenueAttributed: 1400000 },
  { id: 8, agentName: 'Mr. Elijah', stateRegion: 'Kano', productDelivered: 'Vitorep Plus', orders: 75, qtyDelivered: 85, deliveryCost: 40000, waybill: 15000, miscellaneous: 2500, totalLogisticsCost: 57500, revenueAttributed: 850000 },
  { id: 9, agentName: 'GIG Logistics', stateRegion: 'Delta / Asaba', productDelivered: 'Nivel Mor Tea', orders: 130, qtyDelivered: 160, deliveryCost: 70000, waybill: 22000, miscellaneous: 6000, totalLogisticsCost: 98000, revenueAttributed: 1650000 },
  { id: 10, agentName: 'Mr. Kehinde', stateRegion: 'Ondo / Akure', productDelivered: 'Prosxact Pack', orders: 55, qtyDelivered: 65, deliveryCost: 30000, waybill: 7000, miscellaneous: 1500, totalLogisticsCost: 38500, revenueAttributed: 650000 },
];

export function DeliveryTrackerView() {
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date());

  const formatCurrency = (val: number | null) => {
    if (val === null) return '-';
    return new Intl.NumberFormat('en-NG').format(Math.abs(val));
  };

  const formatNumber = (val: number | null) => {
    if (val === null) return '';
    return new Intl.NumberFormat('en-US').format(val);
  };

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6 w-full">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-1">DELIVERY AGENT TRACKER</h2>
        <h3 className="text-[14px] font-bold text-[#107C41] uppercase tracking-wide mb-2">80+ Nationwide Agents</h3>

        <div className="text-[14px] text-gray-500 italic flex justify-center items-center gap-2 mt-2">
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
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-center uppercase tracking-wider">#</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Agent Name</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">State / Region</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Product Delivered</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Orders</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Qty Delivered</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Delivery Cost (₦)</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Waybill (₦)</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider text-purple-700">Miscellaneous (₦)</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Total Logistics Cost (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">Revenue Attributed (₦)</th>
            </tr>
          </thead>
          <tbody>
            {deliveryData.map((item, idx) => (
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
