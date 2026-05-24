'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const adData = [
  { id: 1, product: 'Neuro-Vive Balm', campaign: 'Q2 Awareness', platform: 'Facebook', spend: 150000, impressions: 500000, clicks: 12500, orders: 300, revenue: 3500000 },
  { id: 2, product: 'Trim & Tone Tea', campaign: 'Summer Body Promo', platform: 'Instagram', spend: 200000, impressions: 800000, clicks: 25000, orders: 450, revenue: 5000000 },
  { id: 3, product: 'Shred Belly Tea', campaign: 'Retargeting May', platform: 'Facebook', spend: 120000, impressions: 300000, clicks: 9000, orders: 200, revenue: 2200000 },
  { id: 4, product: 'Prosxact Pack', campaign: 'Lookalike Audience', platform: 'Facebook', spend: 80000, impressions: 200000, clicks: 5000, orders: 120, revenue: 1500000 },
  { id: 5, product: 'Afternatal Tea', campaign: 'Mothers Day Special', platform: 'Instagram', spend: 90000, impressions: 250000, clicks: 7500, orders: 150, revenue: 1800000 },
  { id: 6, product: 'Fonio Mill', campaign: 'Broad Targeting', platform: 'Facebook', spend: 50000, impressions: 150000, clicks: 4000, orders: 80, revenue: 900000 },
  { id: 7, product: 'Nivel Mor Tea', campaign: 'Q2 Awareness', platform: 'Instagram', spend: 60000, impressions: 180000, clicks: 4500, orders: 90, revenue: 1100000 },
  { id: 8, product: 'Vitorep Plus', campaign: 'Retargeting May', platform: 'Facebook', spend: 75000, impressions: 220000, clicks: 6000, orders: 110, revenue: 1300000 },
];

export function AdSpendTrackerView() {
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date());

  const processedData = adData.map(item => {
    const roas = item.spend > 0 ? (item.revenue / item.spend) : 0;
    const cpa = item.orders > 0 ? (item.spend / item.orders) : 0;
    const ctr = item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0;
    
    return {
      ...item,
      roas,
      cpa,
      ctr
    };
  });

  const totals = processedData.reduce((acc, curr) => ({
    spend: acc.spend + curr.spend,
    impressions: acc.impressions + curr.impressions,
    clicks: acc.clicks + curr.clicks,
    orders: acc.orders + curr.orders,
    revenue: acc.revenue + curr.revenue,
  }), { spend: 0, impressions: 0, clicks: 0, orders: 0, revenue: 0 });

  const totalRoas = totals.spend > 0 ? (totals.revenue / totals.spend) : 0;
  const totalCpa = totals.orders > 0 ? (totals.spend / totals.orders) : 0;
  const totalCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-NG').format(Math.abs(val));
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val);

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6 w-full">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-1">ADVERTISING & DIGITAL MARKETING TRACKER</h2>
        <h3 className="text-[14px] font-bold text-[#107C41] uppercase tracking-wide mb-2">Platform: Facebook / Instagram Ads</h3>
        
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
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Product / SKU</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Campaign Name</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-center uppercase tracking-wider">Platform</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Ad Spend (₦)</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Impressions</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Clicks</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Orders Attributed</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Revenue Generated (₦)</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">ROAS</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Cost Per Acquisition (₦)</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-right uppercase tracking-wider">CTR %</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 border-r border-gray-100 text-gray-600 text-center font-bold">{item.id}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700 font-medium">{item.product}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.campaign}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-center text-[#5C2B90] font-bold">{item.platform}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600 font-bold text-blue-600">{formatCurrency(item.spend)}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600">{formatNumber(item.impressions)}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600">{formatNumber(item.clicks)}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600 font-bold">{formatNumber(item.orders)}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600 font-bold text-emerald-600">{formatCurrency(item.revenue)}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600 font-bold">{item.roas.toFixed(2)}x</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600">{formatCurrency(item.cpa)}</td>
                <td className="py-3 px-4 text-right text-gray-600">{item.ctr.toFixed(2)}%</td>
              </tr>
            ))}
            <tr className="bg-[#107C41] text-white font-bold">
              <td className="py-3 px-4 uppercase tracking-wider text-center" colSpan={4}>TOTALS / AVG</td>
              <td className="py-3 px-4 border-r border-white/20 text-right">{formatCurrency(totals.spend)}</td>
              <td className="py-3 px-4 border-r border-white/20 text-right">{formatNumber(totals.impressions)}</td>
              <td className="py-3 px-4 border-r border-white/20 text-right">{formatNumber(totals.clicks)}</td>
              <td className="py-3 px-4 border-r border-white/20 text-right">{formatNumber(totals.orders)}</td>
              <td className="py-3 px-4 border-r border-white/20 text-right">{formatCurrency(totals.revenue)}</td>
              <td className="py-3 px-4 border-r border-white/20 text-right">{totalRoas.toFixed(2)}x</td>
              <td className="py-3 px-4 border-r border-white/20 text-right">{formatCurrency(totalCpa)}</td>
              <td className="py-3 px-4 text-right">{totalCtr.toFixed(2)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
