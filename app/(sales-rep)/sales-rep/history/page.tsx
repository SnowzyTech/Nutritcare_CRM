'use client';

import React from 'react';

const historyEntries = [
  { id: '1', dateTime: 'Feb 7, 2026 - 09:42 AM', activityType: 'Login', description: 'User logged in from Chrome (Desktop)' },
  { id: '2', dateTime: 'Feb 7, 2026 - 09:48 AM', activityType: 'Analysis Created', description: 'Sales performance analysis created' },
  { id: '3', dateTime: 'Feb 7, 2026 - 10:02 AM', activityType: 'Report Generated', description: 'Monthly sales report generated (PDF)' },
  { id: '4', dateTime: 'Feb 7, 2026 - 10:15 AM', activityType: 'Order Created', description: 'Order #ORD-45821 placed Pending' },
  { id: '5', dateTime: 'Feb 7, 2026 - 10:22 AM', activityType: 'Order Processing', description: 'Order moved to processing' },
  { id: '6', dateTime: 'Feb 7, 2026 - 09:48 AM', activityType: 'Analysis Created', description: 'Sales performance analysis created' },
  { id: '7', dateTime: 'Feb 7, 2026 - 09:42 AM', activityType: 'Login', description: 'User logged in from Chrome (Desktop)' },
  { id: '8', dateTime: 'Feb 7, 2026 - 09:48 AM', activityType: 'Analysis Created', description: 'Sales performance analysis created' },
  { id: '9', dateTime: 'Feb 7, 2026 - 09:42 AM', activityType: 'Login', description: 'User logged in from Chrome (Desktop)' },
];

const iconMap: Record<string, string> = {
  'Login': '🔑',
  'Analysis Created': '📊',
  'Report Generated': '📄',
  'Order Created': '📦',
  'Order Processing': '⚙️',
};

function HistoryTable({ entries, showHeader = false }: { entries: typeof historyEntries, showHeader?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {showHeader && (
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 w-12 text-center"><input type="checkbox" className="cursor-pointer accent-purple-600 rounded" /></th>
                <th className="p-4 text-left font-bold text-gray-500 text-[10px] tracking-wider uppercase">Date & Time</th>
                <th className="p-4 text-left font-bold text-gray-500 text-[10px] tracking-wider uppercase">Activity Type</th>
                <th className="p-4 text-left font-bold text-gray-500 text-[10px] tracking-wider uppercase">Description</th>
              </tr>
            </thead>
          )}
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4 text-center w-12">
                  <input type="checkbox" className="cursor-pointer accent-purple-600 rounded" />
                </td>
                <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                  {entry.dateTime}
                </td>
                <td className="p-4 text-gray-900 font-bold whitespace-nowrap">
                  <span className="mr-2 text-base">{iconMap[entry.activityType] || '•'}</span>
                  {entry.activityType}
                </td>
                <td className="p-4 text-gray-500">{entry.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="block md:hidden">
        {showHeader && (
          <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center gap-3">
            <input type="checkbox" className="cursor-pointer accent-purple-600 rounded" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select All</span>
          </div>
        )}
        <div className="flex flex-col divide-y divide-gray-50">
          {entries.map((entry) => (
            <div key={entry.id} className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
              <div className="pt-1 shrink-0">
                <input type="checkbox" className="cursor-pointer accent-purple-600 rounded" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex justify-between items-start gap-2">
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5 truncate">
                    <span className="text-base shrink-0">{iconMap[entry.activityType] || '•'}</span>
                    <span className="truncate">{entry.activityType}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{entry.description}</p>
                <div className="text-[10px] font-medium text-gray-400">
                  {entry.dateTime}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-6xl mx-auto pb-10">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight m-0">History</h1>
        <span className="text-xs sm:text-sm font-semibold text-gray-500 bg-white border border-gray-100 shadow-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full w-fit">
          Today February 9th, 2026
        </span>
      </div>

      {/* Main Today Table */}
      <HistoryTable entries={historyEntries} showHeader={true} />

      {/* Older History Section */}
      <div className="pt-4">
        <div className="flex justify-start sm:justify-end mb-4">
          <span className="text-xs sm:text-sm font-semibold text-gray-500 bg-white border border-gray-100 shadow-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full w-fit">
            A Day Ago February 9th, 2026
          </span>
        </div>
        <HistoryTable entries={historyEntries.slice(0, 5)} showHeader={false} />
      </div>
    </div>
  );
}
