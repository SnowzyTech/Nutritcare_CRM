'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, MessageCircle } from 'lucide-react';

const chartOfAccounts = [
  {
    type: 'Asset',
    description: 'What the business owns',
    instances: 'Cash, Bank, Stock, Receivables'
  },
  {
    type: 'Liability',
    description: 'What the business owes',
    instances: 'Supplier Payables, Agent Overpayments, VAT Payable'
  },
  {
    type: 'Equity',
    description: "Owner's stake in the business",
    instances: 'Capital, Retained Earnings'
  },
  {
    type: 'Revenue',
    description: 'Money earned',
    instances: 'Product Sales, Consultation Fees, Delivery Income'
  },
  {
    type: 'Expense',
    description: 'Money spent',
    instances: 'Salaries, Logistics, Office Costs'
  }
];

export function AccountingLedgerClient() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-white">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <ChevronRight size={20} />
          </button>
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <RotateCcw size={18} />
          </button>
        </div>
        <button className="w-12 h-12 bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200">
          <MessageCircle size={24} fill="currentColor" />
        </button>
      </div>

      <h1 className="text-[32px] font-bold text-gray-800 mb-12 tracking-tight leading-none">Accounting</h1>

      <div className="space-y-6">
        <h2 className="text-[18px] font-bold text-gray-600 mb-6">Chart of Accounts</h2>

        {/* Table Container */}
        <div className="bg-white rounded-xl overflow-hidden border border-gray-50">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#E5E7EB] text-[14px] font-bold text-gray-600">
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5">Description</th>
                <th className="px-8 py-5">Instances</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {chartOfAccounts.map((item, idx) => (
                <tr key={idx} className={`${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}`}>
                  <td className="px-8 py-6 text-[14px] text-gray-500 font-medium">{item.type}</td>
                  <td className="px-8 py-6 text-[14px] text-gray-500 font-medium">{item.description}</td>
                  <td className="px-8 py-6 text-[14px] text-gray-500 font-medium">{item.instances}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-4 pt-8">
          <button className="px-10 py-3.5 border border-gray-300 text-gray-600 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-colors">
            Edit
          </button>
          <button className="px-10 py-3.5 border border-[#AE00FF] text-[#AE00FF] rounded-xl text-[14px] font-bold hover:bg-purple-50 transition-colors">
            Manual Add
          </button>
          <button className="px-10 py-3.5 bg-[#AE00FF] text-white rounded-xl text-[14px] font-bold hover:bg-[#8B00CC] transition-colors shadow-lg shadow-purple-100">
            Import Excel
          </button>
        </div>
      </div>
    </div>
  );
}
