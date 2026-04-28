'use client';

import React from 'react';
import { ActivityGroup } from '@/modules/data-analysis/services/data-analysis.service';

interface HistoryClientProps {
  historyGroups?: ActivityGroup[];
}

export function HistoryClient({ historyGroups = [] }: HistoryClientProps) {
  const today = new Date().toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' });

  if (historyGroups.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <h1 className="text-3xl font-bold text-gray-900">History</h1>
          <div className="text-right">
            <span className="text-sm font-bold text-gray-900">Today</span>
            <span className="text-sm text-gray-400 ml-1">{today}</span>
          </div>
        </div>
        <div className="text-center py-16 text-gray-400">No activity history found.</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <h1 className="text-3xl font-bold text-gray-900">History</h1>
        <div className="text-right">
          <span className="text-sm font-bold text-gray-900">Today</span>
          <span className="text-sm text-gray-400 ml-1">{today}</span>
        </div>
      </div>

      <div className="space-y-12">
        {historyGroups.map((group, groupIdx) => (
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
                      <td className="py-5 px-4 text-sm text-gray-500 font-medium">{entry.dateTime}</td>
                      <td className="py-5 px-4 text-sm text-gray-700 font-semibold">{entry.activityType}</td>
                      <td className="py-5 px-4 text-sm text-gray-500">{entry.description}</td>
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
