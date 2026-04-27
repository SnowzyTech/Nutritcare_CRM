'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface HistoryEntry {
  id: string;
  dateTime: string;
  activityType: string;
  description: string;
}

interface HistoryGroup {
  label: string;
  date: string;
  entries: HistoryEntry[];
}

const mockHistory: HistoryGroup[] = [
  {
    label: "Today",
    date: "February 9th, 2026",
    entries: [
      { id: '1', dateTime: "Feb 7, 2026 – 09:42 AM", activityType: "Login", description: "User logged in from Chrome (Desktop)" },
      { id: '2', dateTime: "Feb 7, 2026 – 09:48 AM", activityType: "Analysis Created", description: "Sales performance analysis created" },
      { id: '3', dateTime: "Feb 7, 2026 – 10:02 AM", activityType: "Report Generated", description: "Monthly sales report generated (PDF)" },
      { id: '4', dateTime: "Feb 7, 2026 – 10:15 AM", activityType: "Order Created", description: "Order #ORD-45821 placedPending" },
      { id: '5', dateTime: "Feb 7, 2026 – 10:22 AM", activityType: "Order Processing", description: "Order moved to processing" },
      { id: '6', dateTime: "Feb 7, 2026 – 09:48 AM", activityType: "Analysis Created", description: "Sales performance analysis created" },
      { id: '7', dateTime: "Feb 7, 2026 – 09:42 AM", activityType: "Login", description: "User logged in from Chrome (Desktop)" },
      { id: '8', dateTime: "Feb 7, 2026 – 09:48 AM", activityType: "Analysis Created", description: "Sales performance analysis created" },
      { id: '9', dateTime: "Feb 7, 2026 – 09:42 AM", activityType: "Login", description: "User logged in from Chrome (Desktop)" },
      { id: '10', dateTime: "Feb 7, 2026 – 09:48 AM", activityType: "Analysis Created", description: "Sales performance analysis created" },
    ]
  },
  {
    label: "A Day Ago",
    date: "February 9th, 2026", // Mockup shows same date for both, I'll follow it or adjust slightly if it makes more sense, but sticking to "replicate exact design"
    entries: [
      { id: '11', dateTime: "Feb 7, 2026 – 09:42 AM", activityType: "Login", description: "User logged in from Chrome (Desktop)" },
      { id: '12', dateTime: "Feb 7, 2026 – 09:48 AM", activityType: "Analysis Created", description: "Sales performance analysis created" },
      { id: '13', dateTime: "Feb 7, 2026 – 10:02 AM", activityType: "Report Generated", description: "Monthly sales report generated (PDF)" },
      { id: '14', dateTime: "Feb 7, 2026 – 10:15 AM", activityType: "Order Created", description: "Order #ORD-45821 placedPending" },
      { id: '15', dateTime: "Feb 7, 2026 – 10:22 AM", activityType: "Order Processing", description: "Order moved to processing" },
      { id: '16', dateTime: "Feb 7, 2026 – 09:48 AM", activityType: "Analysis Created", description: "Sales performance analysis created" },
      { id: '17', dateTime: "Feb 7, 2026 – 09:42 AM", activityType: "Login", description: "User logged in from Chrome (Desktop)" },
      { id: '18', dateTime: "Feb 7, 2026 – 09:48 AM", activityType: "Analysis Created", description: "Sales performance analysis created" },
      { id: '19', dateTime: "Feb 7, 2026 – 09:42 AM", activityType: "Login", description: "User logged in from Chrome (Desktop)" },
      { id: '20', dateTime: "Feb 7, 2026 – 09:48 AM", activityType: "Analysis Created", description: "Sales performance analysis created" },
    ]
  }
];

export function HistoryClient() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <h1 className="text-3xl font-bold text-gray-900">History</h1>
        <div className="text-right">
          <span className="text-sm font-bold text-gray-900">Today</span>
          <span className="text-sm text-gray-400 ml-1">February 9th, 2026</span>
        </div>
      </div>

      <div className="space-y-12">
        {mockHistory.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-4">
            {groupIdx > 0 && (
              <div className="flex justify-end mb-4">
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">{group.label}</span>
                  <span className="text-sm text-gray-400 ml-1">{group.date}</span>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-50">
                    <th className="py-5 px-6 w-12"></th>
                    <th className="py-5 px-4 text-sm font-bold text-gray-600">Date & Time</th>
                    <th className="py-5 px-4 text-sm font-bold text-gray-600">Activity Type</th>
                    <th className="py-5 px-4 text-sm font-bold text-gray-600">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {group.entries.map((entry, idx) => (
                    <tr 
                      key={entry.id} 
                      className={`${idx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'} border-b border-gray-50/50 last:border-0 hover:bg-gray-50/80 transition-colors`}
                    >
                      <td className="py-5 px-6">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
                      </td>
                      <td className="py-5 px-4 text-sm text-gray-500 font-medium">
                        {entry.dateTime}
                      </td>
                      <td className="py-5 px-4 text-sm text-gray-700 font-semibold">
                        {entry.activityType}
                      </td>
                      <td className="py-5 px-4 text-sm text-gray-500">
                        {entry.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
