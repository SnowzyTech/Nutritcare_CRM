'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown } from 'lucide-react';
import { SalesRepItem } from '@/modules/data-analysis/services/data-analysis.service';
import Image from 'next/image';

interface SalesRepListClientProps {
  initialReps?: SalesRepItem[];
}

export function SalesRepListClient({ initialReps = [] }: SalesRepListClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const teams = useMemo(() => {
    const names = Array.from(new Set(initialReps.map(r => r.teamName).filter(Boolean)));
    return ['All', ...names];
  }, [initialReps]);

  const filteredReps = useMemo(() => {
    return initialReps.filter(rep => {
      const matchesSearch = rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           rep.phone.includes(searchQuery);
      const matchesTeam = teamFilter === 'All' || rep.teamName === teamFilter;
      return matchesSearch && matchesTeam;
    });
  }, [initialReps, searchQuery, teamFilter]);

  const handleRowClick = (id: string) => {
    if (!id || id === 'undefined') return;
    router.push(`/data/sales-reps/${id}`);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header / Filters */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-400">
            <SlidersHorizontal size={18} />
            <span className="text-sm font-medium">Filter</span>
          </div>
          
          <div className="relative group">
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-600 border border-gray-100 shadow-sm focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>

          <div className="relative group">
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="appearance-none flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-purple-600 border border-gray-100 shadow-sm pr-8 focus:outline-none cursor-pointer"
            >
              {teams.map(t => (
                <option key={t} value={t}>{t === 'All' ? 'All Teams' : t}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-purple-600" />
          </div>

          <button className="p-2 text-gray-400">
            <ArrowUpDown size={18} />
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-200 w-64 shadow-sm"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">No of Pending Orders</th>
              <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</th>
              <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredReps.map((rep) => (
              <tr 
                key={rep.id} 
                onClick={() => handleRowClick(rep.id)}
                className="group hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-8 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100">
                      <Image
                        src={rep.avatarUrl}
                        alt={rep.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{rep.name}</span>
                  </div>
                </td>
                <td className="px-8 py-4 text-center">
                  <span className="text-sm text-gray-600 font-medium">{rep.pendingOrderCount}</span>
                </td>
                <td className="px-8 py-4">
                  <span className="text-sm text-gray-500">{rep.phone}</span>
                </td>
                <td className="px-8 py-4 text-right">
                  <span className="text-sm font-bold text-gray-700">{rep.generalPerformance}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
