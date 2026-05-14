'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const expenseData = [
  { id: 1, date: '01 May 2026', category: 'Logistics', description: 'Waybill to Lagos branch', amount: 45000, paymentMode: 'Bank Transfer', referenceNo: 'TRX-9021-A', approvedBy: 'Admin' },
  { id: 2, date: '03 May 2026', category: 'Marketing', description: 'Facebook Ads account funding', amount: 150000, paymentMode: 'Card Payment', referenceNo: 'FB-AD-101', approvedBy: 'Manager' },
  { id: 3, date: '05 May 2026', category: 'Office Supplies', description: 'Printer ink and A4 papers', amount: 18500, paymentMode: 'Petty Cash', referenceNo: 'PC-202', approvedBy: 'Admin' },
  { id: 4, date: '08 May 2026', category: 'Utilities', description: 'Monthly electricity bill', amount: 65000, paymentMode: 'Bank Transfer', referenceNo: 'PHCN-05-26', approvedBy: 'Finance Dept' },
  { id: 5, date: '10 May 2026', category: 'Maintenance', description: 'AC repair at main office', amount: 30000, paymentMode: 'Cash', referenceNo: 'MNT-44', approvedBy: 'Manager' },
  { id: 6, date: '12 May 2026', category: 'Salaries', description: 'Contract staff weekly pay', amount: 85000, paymentMode: 'Bank Transfer', referenceNo: 'SAL-W2', approvedBy: 'Admin' },
  { id: 7, date: '14 May 2026', category: 'Logistics', description: 'Fuel for delivery van', amount: 40000, paymentMode: 'Card Payment', referenceNo: 'FUEL-099', approvedBy: 'Logistics Head' },
  { id: 8, date: '15 May 2026', category: 'Marketing', description: 'Instagram influencer promo', amount: 120000, paymentMode: 'Bank Transfer', referenceNo: 'IG-INF-1', approvedBy: 'Manager' },
  { id: 9, date: '18 May 2026', category: 'Internet', description: 'Monthly Starlink subscription', amount: 38000, paymentMode: 'Card Payment', referenceNo: 'INT-SL-05', approvedBy: 'Finance Dept' },
  { id: 10, date: '20 May 2026', category: 'Miscellaneous', description: 'Staff lunch during inventory', amount: 25000, paymentMode: 'Petty Cash', referenceNo: 'PC-203', approvedBy: 'Admin' },
];

export function ExpenseLedgerView() {
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date());

  const formatCurrency = (val: number | null) => {
    if (val === null) return '-';
    return new Intl.NumberFormat('en-NG').format(Math.abs(val));
  };

  return (
    <div className="bg-white border border-gray-100 shadow-sm p-7 overflow-x-auto w-full">
      <div className="text-center mb-6 w-full">
        <h2 className="text-[20px] font-black text-white bg-[#5C2B90] py-2 uppercase tracking-wider mb-1">OPERATIONAL EXPENSES LEDGER</h2>

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
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Date</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Expense Category</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Description / Narration</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-right uppercase tracking-wider">Amount (₦)</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Payment Mode</th>
              <th className="py-4 px-4 border-r border-gray-100 font-bold text-gray-800 text-left uppercase tracking-wider">Reference No.</th>
              <th className="py-4 px-4 font-bold text-gray-800 text-left uppercase tracking-wider">Approved By</th>
            </tr>
          </thead>
          <tbody>
            {expenseData.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 border-r border-gray-100 text-gray-600 text-center font-bold">{item.id}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.date}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.category}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.description}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-right text-gray-600 font-bold text-blue-600">{formatCurrency(item.amount)}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.paymentMode}</td>
                <td className="py-3 px-4 border-r border-gray-100 text-gray-700">{item.referenceNo}</td>
                <td className="py-3 px-4 text-gray-700">{item.approvedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
