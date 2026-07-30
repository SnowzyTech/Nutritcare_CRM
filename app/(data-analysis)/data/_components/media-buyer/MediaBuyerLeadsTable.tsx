'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import type { OrderRow } from '@/modules/data-analysis/services/data-analysis.service';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Pending: { bg: 'bg-[#FFF3CD]', text: 'text-[#856404]' },
  Confirmed: { bg: 'bg-[#D1E7DD]', text: 'text-[#0F5132]' },
  Delivered: { bg: 'bg-[#198754]', text: 'text-white' },
  Cancelled: { bg: 'bg-[#F8D7DA]', text: 'text-[#842029]' },
  Failed: { bg: 'bg-[#DC3545]', text: 'text-white' },
};

const TABS = ['All', 'Pending', 'Confirmed', 'Delivered', 'Cancelled', 'Failed'] as const;

const GRID =
  'grid grid-cols-[1fr_1.3fr_1.3fr_1fr_0.9fr_0.9fr] gap-3 px-6 py-4 items-center';

/**
 * Orders attributed to a media buyer's forms. Rows carry the originating form
 * name — the whole point of the view — and link to the analyst's existing order
 * detail page, which is keyed by order number.
 */
export function MediaBuyerLeadsTable({ leads }: { leads: OrderRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>('All');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const lead of leads) map.set(lead.status, (map.get(lead.status) ?? 0) + 1);
    return map;
  }, [leads]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesTab = tab === 'All' || lead.status === tab;
      const matchesQuery =
        !q ||
        lead.id.toLowerCase().includes(q) ||
        lead.name.toLowerCase().includes(q) ||
        (lead.formName ?? '').toLowerCase().includes(q) ||
        lead.product.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [leads, tab, query]);

  return (
    <div>
      {/* Tabs + search */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
          {TABS.map((t) => {
            const active = tab === t;
            const count = t === 'All' ? leads.length : counts.get(t) ?? 0;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="search order, customer or form"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-200 w-72 shadow-sm"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
        <div
          className={`${GRID} bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider`}
        >
          <span>Order</span>
          <span>Customer</span>
          <span>Form</span>
          <span>Product</span>
          <span>Date</span>
          <span className="text-center">Status</span>
        </div>

        {visible.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400">
            {leads.length === 0
              ? 'No orders were attributed to this buyer’s forms in this period.'
              : 'No leads match this view.'}
          </div>
        ) : (
          visible.map((lead) => {
            const style = STATUS_STYLES[lead.status] ?? STATUS_STYLES.Pending;
            return (
              <div
                key={lead.id}
                onClick={() => router.push(`/data/order/${lead.id}`)}
                className={`${GRID} border-t border-gray-50 text-sm hover:bg-gray-50 transition-colors cursor-pointer`}
              >
                <span className="font-bold text-gray-800 truncate">{lead.id}</span>
                <div className="min-w-0">
                  <p className="text-gray-700 truncate">{lead.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{lead.state}</p>
                </div>
                <span className="text-gray-600 truncate">{lead.formName ?? '—'}</span>
                <div className="min-w-0">
                  <p className="text-gray-600 truncate">{lead.product}</p>
                  {lead.itemCount > 1 && (
                    <p className="text-[11px] text-gray-400">+{lead.itemCount - 1} more</p>
                  )}
                </div>
                <span className="text-gray-500">{lead.date}</span>
                <span className="flex justify-center">
                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}
                  >
                    {lead.status}
                  </span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
