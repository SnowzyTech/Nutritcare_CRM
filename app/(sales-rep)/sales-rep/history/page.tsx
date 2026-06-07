import React from 'react';
import { auth } from '@/lib/auth/auth';
import {
  getUserActivityHistory,
  type ActivityGroup,
} from '@/modules/data-analysis/services/data-analysis.service';

type HistoryEntry = ActivityGroup['entries'][number];

const iconMap: Record<string, string> = {
  'Log In': '🔑',
  'Log Out': '🚪',
  'Order Confirmed': '✅',
  'Delivered': '📦',
  'Cancel': '❌',
  'Failed': '⚠️',
};

function HistoryTable({ entries, showHeader = false }: { entries: HistoryEntry[]; showHeader?: boolean }) {
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

export default async function HistoryPage() {
  const session = await auth();
  const historyGroups = session?.user?.id
    ? await getUserActivityHistory(session.user.id)
    : [];

  const today = new Date().toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-6xl mx-auto pb-10">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight m-0">History</h1>
        <span className="text-xs sm:text-sm font-semibold text-gray-500 bg-white border border-gray-100 shadow-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full w-fit">
          Today {today}
        </span>
      </div>

      {historyGroups.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center text-sm text-gray-400">
          No activity history yet.
        </div>
      ) : (
        historyGroups.map((group, idx) => (
          <div key={group.label} className={idx === 0 ? undefined : 'pt-4'}>
            {idx > 0 && (
              <div className="flex justify-start sm:justify-end mb-4">
                <span className="text-xs sm:text-sm font-semibold text-gray-500 bg-white border border-gray-100 shadow-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full w-fit">
                  {group.label} {group.date}
                </span>
              </div>
            )}
            <HistoryTable entries={group.entries} showHeader={idx === 0} />
          </div>
        ))
      )}
    </div>
  );
}
