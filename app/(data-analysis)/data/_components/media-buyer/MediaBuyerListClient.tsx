'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import type { MediaBuyerOverviewRow } from '@/modules/media-buyer/services/media-buyer.service';
import { DateRangeFilter } from '@/components/admin/date-range-filter';
import { TrendDelta } from './MediaBuyerKpiCard';

type SortKey = 'name' | 'totalForms' | 'views' | 'leads' | 'delivered' | 'conversion';

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'name', label: 'Name', numeric: false },
  { key: 'totalForms', label: 'Forms', numeric: true },
  { key: 'views', label: 'Views', numeric: true },
  { key: 'leads', label: 'Leads', numeric: true },
  { key: 'delivered', label: 'Delivered', numeric: true },
  { key: 'conversion', label: 'Conversion', numeric: true },
];

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

interface MediaBuyerListClientProps {
  buyers?: MediaBuyerOverviewRow[];
  periodLabel: string;
}

export function MediaBuyerListClient({ buyers = [], periodLabel }: MediaBuyerListClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('delivered');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const teams = useMemo(() => {
    const names = [...new Set(buyers.map((b) => b.team).filter((t): t is string => !!t))];
    return ['All', ...names.sort()];
  }, [buyers]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rows = buyers.filter((b) => {
      const matchesSearch =
        !q || b.name.toLowerCase().includes(q) || (b.phone ?? '').includes(q);
      const matchesTeam = teamFilter === 'All' || b.team === teamFilter;
      return matchesSearch && matchesTeam;
    });
    return [...rows].sort((a, b) => {
      if (sortKey === 'name') {
        return sortDir === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [buyers, searchQuery, teamFilter, sortKey, sortDir]);

  // Department roll-up over whatever is currently in view.
  const summary = useMemo(() => {
    const views = filtered.reduce((s, r) => s + r.views, 0);
    const leads = filtered.reduce((s, r) => s + r.leads, 0);
    const delivered = filtered.reduce((s, r) => s + r.delivered, 0);
    const ranked = [...filtered].sort((a, b) => b.delivered - a.delivered);
    return {
      buyers: filtered.length,
      forms: filtered.reduce((s, r) => s + r.totalForms, 0),
      views,
      leads,
      delivered,
      conversion: leads > 0 ? Math.round((delivered / leads) * 100) : 0,
      top: ranked[0] && ranked[0].delivered > 0 ? ranked[0] : null,
    };
  }, [filtered]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const handleRowClick = (id: string) => {
    if (!id || id === 'undefined') return;
    router.push(`/data/media-buyers/${id}`);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Media Buyers</h1>
          <p className="text-sm text-gray-400 mt-1">
            Showing <span className="font-semibold text-gray-600">{periodLabel}</span>
          </p>
        </div>
        <DateRangeFilter defaultPreset="month" />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <SummaryCard label="Buyers" value={summary.buyers} sub={`${summary.forms} forms`} />
        <SummaryCard label="Views" value={summary.views} />
        <SummaryCard label="Leads" value={summary.leads} />
        <SummaryCard label="Delivered" value={summary.delivered} />
        <SummaryCard label="Conversion" value={`${summary.conversion}%`} sub="Delivered ÷ Leads" />
        <div className="rounded-2xl bg-gradient-to-br from-[#5b00a3] to-[#A020F0] text-white p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
            Top Performer
          </span>
          {summary.top ? (
            <div className="mt-2">
              <p className="text-sm font-bold leading-tight truncate">{summary.top.name}</p>
              <p className="text-[11px] opacity-80">
                {summary.top.delivered} delivered · {summary.top.conversion}% conv
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium opacity-70 mt-2">No activity</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-400">
            <SlidersHorizontal size={18} />
            <span className="text-sm font-medium">Filter</span>
          </div>

          <div className="relative group">
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="appearance-none flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-purple-600 border border-gray-100 shadow-sm pr-8 focus:outline-none cursor-pointer"
            >
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Teams' : t}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-purple-600"
            />
          </div>
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
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={`px-8 py-5 ${c.numeric ? 'text-center' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(c.key)}
                    className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                      sortKey === c.key ? 'text-purple-600' : 'text-gray-500 hover:text-purple-600'
                    }`}
                  >
                    {c.label}
                    {sortKey === c.key ? (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-40" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-8 py-16 text-center text-sm text-gray-400">
                  No media buyers match this view.
                </td>
              </tr>
            ) : (
              filtered.map((buyer) => (
                <tr
                  key={buyer.id}
                  onClick={() => handleRowClick(buyer.id)}
                  className="group hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100 bg-gray-100 shrink-0">
                        {buyer.avatarUrl ? (
                          <Image
                            src={buyer.avatarUrl}
                            alt={buyer.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                            {initials(buyer.name)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">
                          {buyer.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {buyer.team ?? 'No Team'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <NumCell value={buyer.totalForms} sub={`${buyer.newForms} new`} />
                  <NumCell value={buyer.views} trend={buyer.trends.views} />
                  <NumCell value={buyer.leads} trend={buyer.trends.leads} />
                  <NumCell value={buyer.delivered} trend={buyer.trends.delivered} />
                  <NumCell
                    value={`${buyer.conversion}%`}
                    trend={buyer.trends.conversion}
                    strong
                  />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-50 shadow-sm p-4">
      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <p className="text-2xl font-black leading-none mt-2 text-gray-800">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function NumCell({
  value,
  trend,
  sub,
  strong,
}: {
  value: string | number;
  trend?: string;
  sub?: string;
  strong?: boolean;
}) {
  return (
    <td className="px-8 py-4">
      <div className="flex flex-col items-center justify-center">
        <span className={`text-sm ${strong ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {trend && <TrendDelta value={trend} />}
        {sub && <span className="text-[11px] text-gray-400">{sub}</span>}
      </div>
    </td>
  );
}
