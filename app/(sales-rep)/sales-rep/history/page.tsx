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

function HistoryTable({ entries }: { entries: typeof historyEntries }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-gray-100">
              <td className="p-4 text-center w-12">
                <input type="checkbox" className="cursor-pointer accent-purple-600" />
              </td>
              <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                {entry.dateTime}
              </td>
              <td className="p-4 text-gray-900 font-medium">
                <span className="mr-2">{iconMap[entry.activityType] || '•'}</span>
                {entry.activityType}
              </td>
              <td className="p-4 text-gray-500">{entry.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 m-0">History</h1>
        <span className="text-sm text-gray-500">Today February 9th, 2026</span>
      </div>

      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 w-12"><input type="checkbox" className="cursor-pointer accent-purple-600" /></th>
              <th className="p-4 text-left font-semibold text-gray-500 text-xs uppercase">Date & Time</th>
              <th className="p-4 text-left font-semibold text-gray-500 text-xs uppercase">Activity Type</th>
              <th className="p-4 text-left font-semibold text-gray-500 text-xs uppercase">Description</th>
            </tr>
          </thead>
          <tbody>
            {historyEntries.map((entry) => (
              <tr key={entry.id} className="border-b border-gray-100">
                <td className="p-4 text-center"><input type="checkbox" className="cursor-pointer accent-purple-600" /></td>
                <td className="p-4 text-gray-500 text-xs whitespace-nowrap">{entry.dateTime}</td>
                <td className="p-4 text-gray-900 font-medium">
                  <span className="mr-2">{iconMap[entry.activityType] || '•'}</span>
                  {entry.activityType}
                </td>
                <td className="p-4 text-gray-500">{entry.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <div className="flex justify-end mb-4">
          <span className="text-sm text-gray-500">A Day Ago February 9th, 2026</span>
        </div>
        <HistoryTable entries={historyEntries.slice(0, 5)} />
      </div>
    </div>
  );
}
