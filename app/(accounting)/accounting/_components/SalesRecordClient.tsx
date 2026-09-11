'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircle,
  Box,
  MapPin,
  User,
  CreditCard,
  Calendar as CalendarIcon,
  ChevronDown,
  Edit2,
  Check,
  ClipboardList,
  X,
} from 'lucide-react';
import { SalesRecord } from '@/lib/mock-data/sales-records';
import { updateOrderDeliveryFeeAction } from '@/modules/finance/actions/sales-record.action';

type SalesRecordRow = Omit<SalesRecord, 'orderStatus' | 'remStatus'> & {
  orderStatus: string;
  remStatus: string;
  // Supplied by getSalesRecords (the mock SalesRecord shape predates them):
  // raw components behind the formatted Net Amount / Delivery Fee columns.
  netBeforeDeliveryNum: number;
  deliveryFeeNum: number;
  // Waybill charge for the order (a PAYMENT settlement adjustment), pre-formatted
  // by the service; "—" when the order carries none.
  waybill: string;
  waybillNum: number;
  // Stable key for the agent filter — company names are not unique.
  agentId: string | null;
  // Status-change date (delivered/cancelled/failed/confirmed day); null while PENDING.
  statusDate: string | null;
};

interface SalesRecordClientProps {
  initialRecords?: SalesRecordRow[];
  products?: string[];
  agents?: { id: string; name: string }[];
  states?: string[];
}

const PAGE_SIZE = 20;

/** Query-string keys the filter bar reads and writes. Filter state lives in the
 *  URL so it survives back/forward navigation — most notably drilling into an
 *  order and coming back to the list. */
const PARAM = {
  product: 'product',
  state: 'state',
  agent: 'agent',
  status: 'status',
  payment: 'payment',
  from: 'from',
  to: 'to',
  search: 'q',
  page: 'page',
} as const;

const ALL = 'All';

export function SalesRecordClient({ initialRecords = [], products: productProp, agents: agentProp, states: stateProp }: SalesRecordClientProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<SalesRecordRow[]>(initialRecords);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters are read straight off the URL rather than mirrored into component
  // state, so a back/forward navigation restores them with no extra wiring.
  const productFilter = searchParams.get(PARAM.product) ?? ALL;
  const stateFilter = searchParams.get(PARAM.state) ?? ALL;
  const agentFilter = searchParams.get(PARAM.agent) ?? ALL; // an Agent.id, or 'All'
  const statusFilter = searchParams.get(PARAM.status) ?? ALL;
  const paymentStatusFilter = searchParams.get(PARAM.payment) ?? ALL;
  const dateFrom = searchParams.get(PARAM.from) ?? '';
  const dateTo = searchParams.get(PARAM.to) ?? '';
  const pageParam = Number(searchParams.get(PARAM.page));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  // The free-text box keeps local state for instant typing feedback and is
  // debounced into the URL; `popstate` pulls it back in line on back/forward.
  const [search, setSearch] = useState(() => searchParams.get(PARAM.search) ?? '');

  /** Writes filter changes into the URL via the native History API, which Next
   *  syncs into `useSearchParams` without re-running the server component (so
   *  filtering stays instant instead of refetching on every click).
   *  `replace` is for high-frequency updates that shouldn't flood history. */
  const updateParams = useCallback(
    (updates: Record<string, string | null>, { replace = false }: { replace?: boolean } = {}) => {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || value === ALL) params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
      if (replace) window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    },
    [],
  );

  // Debounce the search box into the URL. The equality check stops a resync
  // from `popstate` (below) from immediately writing the value straight back.
  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get(PARAM.search) ?? '';
    if (search === current) return;
    const timer = setTimeout(
      () => updateParams({ [PARAM.search]: search || null, [PARAM.page]: null }, { replace: true }),
      300,
    );
    return () => clearTimeout(timer);
  }, [search, updateParams]);

  useEffect(() => {
    const syncSearchFromUrl = () =>
      setSearch(new URLSearchParams(window.location.search).get(PARAM.search) ?? '');
    window.addEventListener('popstate', syncSearchFromUrl);
    return () => window.removeEventListener('popstate', syncSearchFromUrl);
  }, []);

  // UI state for dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [agentQuery, setAgentQuery] = useState('');
  const [agentHighlight, setAgentHighlight] = useState(0);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const agentListRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
    if (name === 'agent') {
      setAgentQuery('');
      setAgentHighlight(0);
    }
  };

  // Close any open filter dropdown when clicking outside the filter bar.
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Net Amount is shown net of the delivery fee, so editing the fee has to
  // recompute it — the two columns are adjacent and would otherwise disagree
  // until the page reloads.
  const fmtNaira = (n: number) =>
    `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

  const updateDeliveryFee = (id: string, newNumber: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== id) return r;
      const feeNum = parseFloat(newNumber.replace(/[^0-9.]/g, '')) || 0;
      return {
        ...r,
        deliveryFee: `₦${newNumber}`,
        deliveryFeeNum: feeNum,
        netAmount: fmtNaira(r.netBeforeDeliveryNum - feeNum),
      };
    }));
  };

  const persistDeliveryFee = async (id: string, value: string) => {
    const numeric = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
    setEditingId(null);
    try { await updateOrderDeliveryFeeAction({ orderId: id, deliveryFee: numeric }); } catch {}
  };

  // States are derived from the orders' customers so the filter values match
  // exactly how state was recorded at order creation.
  const nigerianStates = stateProp ?? [];

  const products = productProp ?? ["Fonio Mill", "Trim & Tone", "Prosxact", "Shred Belly", "Neuro-Vive Balm"];
  const agentOptions = useMemo(() => agentProp ?? [], [agentProp]);
  const statuses = ["Pending", "Confirmed", "Delivered", "Cancelled", "Failed"];
  const paymentStatuses = ["Paid", "Not Paid"];

  const selectedAgentName =
    agentFilter === ALL ? null : agentOptions.find(a => a.id === agentFilter)?.name ?? null;

  // What the agent dropdown renders, in render order — the keyboard highlight
  // indexes into this exact list. "All Agents" is only offered while the search
  // box is empty; once the user is searching, only matches make sense.
  const agentChoices = useMemo(() => {
    const query = agentQuery.trim().toLowerCase();
    if (!query) return [{ id: ALL, name: 'All Agents' }, ...agentOptions];
    return agentOptions.filter(a => a.name.toLowerCase().includes(query));
  }, [agentOptions, agentQuery]);

  // Keep the keyboard-highlighted option in view while arrowing a long list.
  useEffect(() => {
    if (openDropdown !== 'agent') return;
    agentListRef.current
      ?.querySelector<HTMLElement>('[data-highlighted="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [agentHighlight, openDropdown]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchSearch = !query ||
        r.customer.toLowerCase().includes(query) ||
        r.orderId.toLowerCase().includes(query);
      const matchProduct = productFilter === ALL || r.products.includes(productFilter);
      const matchState = stateFilter === ALL || r.state === stateFilter;
      const matchAgent = agentFilter === ALL || r.agentId === agentFilter;
      const matchStatus = statusFilter === ALL || r.orderStatus === statusFilter;
      const matchPaymentStatus = paymentStatusFilter === ALL || r.remStatus === paymentStatusFilter;
      const matchDate = (!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo);

      return matchSearch && matchProduct && matchState && matchAgent && matchStatus && matchPaymentStatus && matchDate;
    });
  }, [records, search, productFilter, stateFilter, agentFilter, statusFilter, paymentStatusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // A `?page=` left over from a wider filter can point past the end of the list.
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (p: number) => updateParams({ [PARAM.page]: p > 1 ? String(p) : null });

  // Any filter change invalidates the current page offset.
  const handleFilterChange = (key: string, value: string) => {
    updateParams({ [key]: value, [PARAM.page]: null });
    setOpenDropdown(null);
  };

  const handleAgentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAgentHighlight(i => Math.min(i + 1, agentChoices.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAgentHighlight(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const choice = agentChoices[agentHighlight];
      if (choice) handleFilterChange(PARAM.agent, choice.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpenDropdown(null);
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-[#F9FAFB]">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronRight size={20} />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
        <button className="w-12 h-12 bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-105 transition-transform">
          <MessageCircle size={24} fill="currentColor" />
        </button>
      </div>

      <h1 className="text-[32px] font-bold text-gray-800 mb-8 tracking-tight">Sales Record</h1>

      {/* Filter Bar */}
      <div ref={filterBarRef} className="flex flex-wrap items-center gap-3 mb-8">
        {/* Product Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('product')}
            className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[130px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Box size={16} strokeWidth={2.5} />
              <span>{productFilter === 'All' ? 'Product' : productFilter}</span>
            </div>
            <ChevronDown size={14} strokeWidth={3} className={`transition-transform ${openDropdown === 'product' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'product' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => handleFilterChange(PARAM.product, ALL)}
              >
                All Products
              </div>
              {products.map(p => (
                <div
                  key={p}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => handleFilterChange(PARAM.product, p)}
                >
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* State Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('state')}
            className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[120px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MapPin size={16} strokeWidth={2.5} />
              <span>{stateFilter === 'All' ? 'State' : stateFilter}</span>
            </div>
            <ChevronDown size={14} strokeWidth={3} className={`transition-transform ${openDropdown === 'state' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'state' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3 max-h-[300px] overflow-y-auto custom-scrollbar">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => handleFilterChange(PARAM.state, ALL)}
              >
                All States
              </div>
              {nigerianStates.map(s => (
                <div
                  key={s}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => handleFilterChange(PARAM.state, s)}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Filter — searchable: the agent list grows unbounded, so a plain
            dropdown is unusable once there are more than a screenful. */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('agent')}
            className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[120px] max-w-[220px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <User size={16} strokeWidth={2.5} className="shrink-0" />
              <span className="truncate">{selectedAgentName ?? 'Agent'}</span>
            </div>
            <ChevronDown size={14} strokeWidth={3} className={`shrink-0 transition-transform ${openDropdown === 'agent' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'agent' && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3">
              <div className="relative px-1 pb-2">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 -mt-1 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={agentQuery}
                  onChange={(e) => { setAgentQuery(e.target.value); setAgentHighlight(0); }}
                  onKeyDown={handleAgentKeyDown}
                  placeholder="Search agent..."
                  className="w-full h-9 pl-8 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-purple-300 focus:bg-white"
                />
                {agentQuery && (
                  <button
                    onClick={() => { setAgentQuery(''); setAgentHighlight(0); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 -mt-1 p-0.5 text-gray-300 hover:text-gray-500"
                    aria-label="Clear agent search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div ref={agentListRef} className="max-h-[260px] overflow-y-auto custom-scrollbar">
                {agentChoices.map((a, idx) => (
                  <div
                    key={a.id}
                    data-highlighted={idx === agentHighlight ? 'true' : undefined}
                    onMouseEnter={() => setAgentHighlight(idx)}
                    className={`px-3 py-2 text-[13px] rounded-lg cursor-pointer font-medium truncate ${
                      a.id === agentFilter
                        ? 'bg-purple-50 text-[#AE00FF]'
                        : idx === agentHighlight
                          ? 'bg-gray-50 text-gray-600'
                          : 'text-gray-600'
                    }`}
                    title={a.name}
                    onClick={() => handleFilterChange(PARAM.agent, a.id)}
                  >
                    {a.name}
                  </div>
                ))}
                {agentChoices.length === 0 && (
                  <div className="px-3 py-4 text-[13px] text-gray-400 font-medium text-center">
                    No agents found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Filter (Order Status) */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('status')}
            className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[130px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ClipboardList size={16} strokeWidth={2.5} />
              <span>{statusFilter === 'All' ? 'Status' : statusFilter}</span>
            </div>
            <ChevronDown size={14} strokeWidth={3} className={`transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'status' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => handleFilterChange(PARAM.status, ALL)}
              >
                All Statuses
              </div>
              {statuses.map(s => (
                <div
                  key={s}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => handleFilterChange(PARAM.status, s)}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Status Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('paymentStatus')}
            className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[160px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CreditCard size={16} strokeWidth={2.5} />
              <span>{paymentStatusFilter === 'All' ? 'Payment Status' : paymentStatusFilter}</span>
            </div>
            <ChevronDown size={14} strokeWidth={3} className={`transition-transform ${openDropdown === 'paymentStatus' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'paymentStatus' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => handleFilterChange(PARAM.payment, ALL)}
              >
                All
              </div>
              {paymentStatuses.map(s => (
                <div
                  key={s}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => handleFilterChange(PARAM.payment, s)}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('date')}
            className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[140px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} strokeWidth={2.5} />
              <span>{dateFrom || dateTo ? `${dateFrom || '…'} → ${dateTo || '…'}` : 'Date Range'}</span>
            </div>
            <ChevronDown size={14} strokeWidth={3} className={`transition-transform ${openDropdown === 'date' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'date' && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-4 w-72">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => updateParams({ [PARAM.from]: e.target.value || null, [PARAM.page]: null })}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-purple-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => updateParams({ [PARAM.to]: e.target.value || null, [PARAM.page]: null })}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-purple-300"
                  />
                </div>
                <button
                  onClick={() => setOpenDropdown(null)}
                  className="w-full bg-[#AE00FF] text-white py-2 rounded-lg text-sm font-bold mt-2"
                >
                  Apply Filter
                </button>
                <button
                  onClick={() => { updateParams({ [PARAM.from]: null, [PARAM.to]: null, [PARAM.page]: null }); setOpenDropdown(null); }}
                  className="w-full text-gray-400 py-1 text-[12px] font-medium"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[300px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-[48px] pl-12 pr-4 bg-white  rounded-xl text-[14px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-200"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[#E5E7EB]/80">
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Order ID</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Customer</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">State</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Product(s)</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Qty</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Total</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Discount</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Net Amount</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Delivery Fee</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Waybill</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Rem. Status</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Agent</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Order Date</th>
                <th className="px-5 py-4 text-[12px] font-bold text-gray-600 whitespace-nowrap">Status Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/accounting/sales-record/${r.id}`)}
                >
                  <td className="px-5 py-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-gray-800 tracking-tight">{r.orderId}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase ${r.orderStatus === 'Delivered' ? 'bg-[#10B981] text-white' :
                        r.orderStatus === 'Confirmed' ? 'bg-[#6EE7B7] text-[#065F46]' :
                          r.orderStatus === 'Pending' ? 'bg-[#F59E0B] text-white' :
                            'bg-[#EF4444] text-white'
                        }`}>
                        {r.orderStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-6">
                    <div className="text-[13px] text-gray-700 leading-[1.3] font-medium whitespace-pre-line">{r.customer}</div>
                  </td>
                  <td className="px-5 py-6 text-[13px] text-gray-600 font-medium">{r.state}</td>
                  <td className="px-5 py-6 text-[13px] text-gray-800 font-bold tracking-tight">
                    <div className="line-clamp-2 max-w-[220px]" title={r.products}>{r.products}</div>
                  </td>
                  <td className="px-5 py-6 text-[13px] text-gray-600 font-medium whitespace-nowrap">{r.qty}</td>
                  <td className="px-5 py-6 text-[13px] font-bold text-gray-800">{r.total}</td>
                  <td className="px-5 py-6 text-[13px] text-gray-600 font-medium">{r.discount}</td>
                  <td className="px-5 py-6 text-[13px] font-black text-gray-900">{r.netAmount}</td>
                  <td className="px-5 py-6">
                    {editingId === r.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[13px] text-gray-400 font-bold">₦</span>
                        <input
                          type="text"
                          value={r.deliveryFee.replace('₦', '')}
                          autoFocus
                          onChange={(e) => updateDeliveryFee(r.id, e.target.value)}
                          className="w-16 bg-transparent border-b border-purple-400 focus:outline-none text-[13px] text-gray-800 font-bold px-0 py-0"
                        />
                        <button
                          onClick={() => persistDeliveryFee(r.id, r.deliveryFee)}
                          className="p-1 text-green-500 hover:bg-green-50 rounded"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group min-w-[80px]">
                        <span className="text-[13px] text-gray-600 font-medium">{r.deliveryFee}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingId(r.id); }}
                          className="p-1.5 text-gray-300 hover:text-purple-500 hover:bg-purple-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-6 text-[13px] font-medium whitespace-nowrap">
                    <span className={r.waybillNum > 0 ? 'text-gray-600' : 'text-gray-300'}>{r.waybill}</span>
                  </td>
                  <td className="px-5 py-6">
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap ${r.remStatus === 'Paid' ? 'bg-[#10B981] text-white' :
                      'bg-[#E5E7EB] text-gray-600'
                      }`}>
                      {r.remStatus}
                    </span>
                  </td>
                  <td className="px-5 py-6">
                    <div className="text-[13px] text-gray-700 leading-[1.3] font-medium whitespace-pre-line">{r.agent}</div>
                  </td>
                  <td className="px-5 py-6 text-[13px] text-gray-500 font-medium whitespace-nowrap">{r.date}</td>
                  <td className="px-5 py-6 text-[13px] text-gray-700 font-medium whitespace-nowrap">{r.statusDate ?? '—'}</td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-5 py-16 text-center text-[14px] text-gray-400 font-medium">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-1">
          <p className="text-[13px] text-gray-500 font-medium">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-[13px]">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={`w-9 h-9 rounded-lg text-[13px] font-semibold transition-colors ${
                      currentPage === p
                        ? 'bg-[#AE00FF] text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
