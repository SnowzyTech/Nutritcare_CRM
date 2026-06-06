'use client';

import React from 'react';
import { DeletedOrderGroup } from '@/modules/data-analysis/services/data-analysis.service';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Pending: { bg: 'bg-[#FFF3CD]', text: 'text-[#856404]' },
  Confirmed: { bg: 'bg-[#D1E7DD]', text: 'text-[#0F5132]' },
  Delivered: { bg: 'bg-[#198754]', text: 'text-white' },
  Cancelled: { bg: 'bg-[#F8D7DA]', text: 'text-[#842029]' },
  Failed: { bg: 'bg-[#DC3545]', text: 'text-white' },
};

interface HistoryClientProps {
  deletedOrderGroups?: DeletedOrderGroup[];
}

export function HistoryClient({ deletedOrderGroups = [] }: HistoryClientProps) {
  const today = new Date().toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' });

  const header = (
    <div className="flex justify-between items-end mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">History</h1>
        <p className="text-sm text-gray-400 mt-1">Orders you&apos;ve permanently deleted</p>
      </div>
      <div className="text-right">
        <span className="text-sm font-bold text-gray-900">Today</span>
        <span className="text-sm text-gray-400 ml-1">{today}</span>
      </div>
    </div>
  );

  if (deletedOrderGroups.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        {header}
        <div className="text-center py-16 text-gray-400">No deleted orders yet.</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {header}

      <div className="space-y-12">
        {deletedOrderGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-4">
            <div className="flex justify-end mb-4">
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">{group.label}</span>
                <span className="text-sm text-gray-400 ml-1">{group.date}</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-x-auto">
              <table className="w-full min-w-[900px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-50">
                    <th className="py-5 px-6 text-sm font-bold text-gray-600">Order #</th>
                    <th className="py-5 px-4 text-sm font-bold text-gray-600">Customer</th>
                    <th className="py-5 px-4 text-sm font-bold text-gray-600">Product</th>
                    <th className="py-5 px-4 text-sm font-bold text-gray-600 text-center">Qty</th>
                    <th className="py-5 px-4 text-sm font-bold text-gray-600">Status</th>
                    <th className="py-5 px-4 text-sm font-bold text-gray-600 text-right">Total</th>
                    <th className="py-5 px-4 text-sm font-bold text-gray-600">Sales Rep</th>
                    <th className="py-5 px-4 text-sm font-bold text-gray-600 whitespace-nowrap">Deleted On</th>
                  </tr>
                </thead>
                <tbody>
                  {group.entries.map((entry, idx) => {
                    const style = STATUS_STYLES[entry.status] ?? STATUS_STYLES.Pending;
                    return (
                      <tr
                        key={entry.id}
                        className={`${idx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'} border-b border-gray-50/50 last:border-0 hover:bg-gray-50/80 transition-colors`}
                      >
                        <td className="py-5 px-6 text-sm font-semibold text-gray-700">{entry.orderNumber}</td>
                        <td className="py-5 px-4">
                          <p className="text-sm font-medium text-gray-700">{entry.customerName}</p>
                          {entry.customerEmail && (
                            <p className="text-[11px] text-gray-400">{entry.customerEmail}</p>
                          )}
                        </td>
                        <td className="py-5 px-4 text-sm text-gray-600">{entry.product}</td>
                        <td className="py-5 px-4 text-sm text-gray-600 text-center">{entry.quantity}</td>
                        <td className="py-5 px-4">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${style.bg} ${style.text}`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-5 px-4 text-sm font-medium text-gray-700 text-right whitespace-nowrap">{entry.total}</td>
                        <td className="py-5 px-4 text-sm text-gray-600">{entry.salesRep}</td>
                        <td className="py-5 px-4 text-sm text-gray-500 whitespace-nowrap">{entry.deletedAt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
