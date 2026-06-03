'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  ChevronDown, 
  MessageCircle,
  X
} from 'lucide-react';
import { OrderRow } from '@/modules/data-analysis/services/data-analysis.service';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar } from '@/components/ui/calendar';

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  Pending: { dot: 'bg-yellow-400', bg: 'bg-[#FFF3CD]', text: 'text-[#856404]', label: 'Pending' },
  Confirmed: { dot: 'bg-green-400', bg: 'bg-[#D1E7DD]', text: 'text-[#0F5132]', label: 'Confirmed' },
  Delivered: { dot: 'bg-green-600', bg: 'bg-[#198754]', text: 'text-white', label: 'Delivered' },
  Cancelled: { dot: 'bg-red-300', bg: 'bg-[#F8D7DA]', text: 'text-[#842029]', label: 'Cancelled' },
  Failed: { dot: 'bg-red-600', bg: 'bg-[#DC3545]', text: 'text-white', label: 'Failed' },
};

const TABS = ['All', 'Pending', 'Confirmed', 'Delivered', 'Cancelled', 'Failed'];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

const MOCK_AGENTS = [
  { name: 'Emeka Nwankwo', orders: 20 },
  { name: 'Zainab Bello', orders: 25 },
  { name: 'Tunde Ajayi', orders: 29 },
  { name: 'Blessing Efiong', orders: 31 },
  { name: 'Chioma Okafor', orders: 31 },
  { name: 'Adebayo Salami', orders: 31 },
  { name: 'Fatima Yusuf', orders: 31 },
  { name: 'Obinna Eze', orders: 31 },
  { name: 'Amara Obi', orders: 31 },
  { name: 'Kelechi Udo', orders: 31 },
  { name: 'Ngozi Ike', orders: 31 },
  { name: 'Yemi Adeyemi', orders: 31 },
  { name: 'Hassan Musa', orders: 31 },
  { name: 'Ifeoma Chukwu', orders: 31 },
  { name: 'Damilola Oni', orders: 31 },
];

interface OrdersClientProps {
  initialOrders?: OrderRow[];
}

export function OrdersClient({ initialOrders = [] }: OrdersClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  // Multi-select product filter
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [pendingProducts, setPendingProducts] = useState<string[]>([]);
  // Multi-select team filter
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [pendingTeams, setPendingTeams] = useState<string[]>([]);
  // Date range state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isDateOpen, setIsDateOpen] = useState(false);

  // Multi-select state filter
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [pendingStates, setPendingStates] = useState<string[]>([]);
  const [isStateOpen, setIsStateOpen] = useState(false);

  // Del. Agent dialog
  const [selectedDelAgents, setSelectedDelAgents] = useState<string[]>([]);
  const [pendingDelAgents, setPendingDelAgents] = useState<string[]>([]);
  const [isDelAgentOpen, setIsDelAgentOpen] = useState(false);
  const [delAgentSearch, setDelAgentSearch] = useState('');

  // CS Agent dialog
  const [selectedCSAgents, setSelectedCSAgents] = useState<string[]>([]);
  const [pendingCSAgents, setPendingCSAgents] = useState<string[]>([]);
  const [isCSAgentOpen, setIsCSAgentOpen] = useState(false);
  const [csAgentSearch, setCSAgentSearch] = useState('');

  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);

  const closeAllDropdowns = () => {
    setIsProductOpen(false);
    setIsStateOpen(false);
    setIsTeamOpen(false);
    setIsDateOpen(false);
    setIsCSAgentOpen(false);
  };

  const counts = useMemo(() => ({
    All: initialOrders.length,
    Pending: initialOrders.filter(o => o.status === 'Pending').length,
    Confirmed: initialOrders.filter(o => o.status === 'Confirmed').length,
    Delivered: initialOrders.filter(o => o.status === 'Delivered').length,
    Cancelled: initialOrders.filter(o => o.status === 'Cancelled').length,
    Failed: initialOrders.filter(o => o.status === 'Failed').length,
  }), [initialOrders]);

  const filteredOrders = useMemo(() => {
    return initialOrders.filter(o => {
      const matchesTab = activeTab === 'All' || o.status === activeTab;
      const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           o.gmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           o.salesRep.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProduct = selectedProducts.length === 0 || selectedProducts.includes(o.product);
      const matchesState = selectedStates.length === 0 || selectedStates.includes(o.state);
      const matchesTeam = selectedTeams.length === 0 || selectedTeams.includes(o.salesRep);
      return matchesTab && matchesSearch && matchesProduct && matchesState && matchesTeam;
    });
  }, [initialOrders, activeTab, searchQuery, selectedProducts, selectedStates, selectedTeams]);

  const uniqueProducts = useMemo(() => Array.from(new Set(initialOrders.map(o => o.product))), [initialOrders]);
  const uniqueSalesReps = useMemo(() => Array.from(new Set(initialOrders.map(o => o.salesRep))), [initialOrders]);

  const filteredMockAgents = useMemo(() => {
    if (!delAgentSearch) return MOCK_AGENTS;
    return MOCK_AGENTS.filter(a => a.name.toLowerCase().includes(delAgentSearch.toLowerCase()));
  }, [delAgentSearch]);

  const filteredCSAgents = useMemo(() => {
    if (!csAgentSearch) return MOCK_AGENTS;
    return MOCK_AGENTS.filter(a => a.name.toLowerCase().includes(csAgentSearch.toLowerCase()));
  }, [csAgentSearch]);

  const dateLabel = useMemo(() => {
    if (startDate && endDate) {
      const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return `${fmt(startDate)} - ${fmt(endDate)}`;
    }
    if (startDate) return startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    return 'Date';
  }, [startDate, endDate]);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-700">Welcome Back, Favour</h1>
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 cursor-pointer shadow-sm hover:bg-purple-200 transition-colors">
          <MessageCircle size={22} fill="currentColor" />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl shadow-sm p-1.5 overflow-x-auto no-scrollbar gap-2 w-full">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const count = (counts as any)[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 hover:cursor-pointer ${
                isActive ? 'bg-[#F9F5FF] text-[#6941C6]' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className={`text-sm font-medium ${isActive ? 'text-[#6941C6] font-bold' : 'text-gray-500'}`}>
                {tab}
                {!isActive && tab !== 'All' && count > 0 ? `(${count})` : ''}
              </span>
              {tab === 'All' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isActive ? 'bg-[#C282FA] text-white absolute top-1.5 right-2 sm:static sm:translate-y-0' : 'bg-gray-100 text-gray-500 hidden'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2 text-gray-400">
          <SlidersHorizontal size={18} />
          <span className="text-sm font-medium">Filter</span>
        </div>
        
        {/* ── Date Filter (Dual Calendar) ── */}
        <div className="relative">
          <button
            onClick={() => {
              closeAllDropdowns();
              setIsDateOpen(!isDateOpen);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium"
          >
            <span>{dateLabel}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isDateOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDateOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDateOpen(false)} />
              <div className="absolute left-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 p-4">
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Start Date</p>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      className="rounded-md border border-gray-200"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">End Date</p>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      className="rounded-md border border-gray-200"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => { setStartDate(undefined); setEndDate(undefined); }}
                    className="px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsDateOpen(false)}
                    className="px-4 py-1.5 bg-[#A020F0] text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Product Filter (Multi-Select) ── */}
        <div className="relative">
          <button 
            onClick={() => {
              const wasOpen = isProductOpen;
              closeAllDropdowns();
              if (!wasOpen) setPendingProducts([...selectedProducts]);
              setIsProductOpen(!wasOpen);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium"
          >
            <span>{selectedProducts.length > 0 ? `Product (${selectedProducts.length})` : 'Product'}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isProductOpen ? 'rotate-180' : ''}`} />
          </button>
          {isProductOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProductOpen(false)} />
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 min-w-[220px] max-h-[350px] flex flex-col">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-700">Select Products</span>
                  <button
                    onClick={() => setPendingProducts([])}
                    className="text-[10px] font-medium text-[#A020F0] hover:text-purple-700"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-1">
                  {uniqueProducts.map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-purple-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={pendingProducts.includes(p)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPendingProducts(prev => [...prev, p]);
                          } else {
                            setPendingProducts(prev => prev.filter(x => x !== p));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#A020F0] accent-[#A020F0]"
                      />
                      <span className={`text-xs font-medium ${pendingProducts.includes(p) ? 'text-[#A020F0]' : 'text-gray-600'}`}>
                        {p}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="px-4 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => { setSelectedProducts(pendingProducts); setIsProductOpen(false); }}
                    className="w-full py-2 bg-[#A020F0] text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── State Filter (Multi-Select) ── */}
        <div className="relative">
          <button 
            onClick={() => {
              const wasOpen = isStateOpen;
              closeAllDropdowns();
              if (!wasOpen) setPendingStates([...selectedStates]);
              setIsStateOpen(!wasOpen);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium"
          >
            <span>{selectedStates.length > 0 ? `State (${selectedStates.length})` : 'State'}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isStateOpen ? 'rotate-180' : ''}`} />
          </button>
          {isStateOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsStateOpen(false)} />
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 min-w-[220px] max-h-[350px] flex flex-col">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-700">Select States</span>
                  <button
                    onClick={() => setPendingStates([])}
                    className="text-[10px] font-medium text-[#A020F0] hover:text-purple-700"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-1">
                  {NIGERIAN_STATES.map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-purple-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={pendingStates.includes(s)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPendingStates(prev => [...prev, s]);
                          } else {
                            setPendingStates(prev => prev.filter(st => st !== s));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#A020F0] accent-[#A020F0]"
                      />
                      <span className={`text-xs font-medium ${pendingStates.includes(s) ? 'text-[#A020F0]' : 'text-gray-600'}`}>
                        {s}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="px-4 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => { setSelectedStates(pendingStates); setIsStateOpen(false); }}
                    className="w-full py-2 bg-[#A020F0] text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Team Filter (Multi-Select) ── */}
        <div className="relative">
          <button 
            onClick={() => {
              const wasOpen = isTeamOpen;
              closeAllDropdowns();
              if (!wasOpen) setPendingTeams([...selectedTeams]);
              setIsTeamOpen(!wasOpen);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:cursor-pointer"
          >
            <span>{selectedTeams.length > 0 ? `Team (${selectedTeams.length})` : 'Team'}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isTeamOpen ? 'rotate-180' : ''}`} />
          </button>
          {isTeamOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsTeamOpen(false)} />
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 min-w-[220px] max-h-[350px] flex flex-col">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-700">Select Teams</span>
                  <button 
                    onClick={() => setPendingTeams([])}
                    className="text-[10px] font-medium text-[#A020F0] hover:text-purple-700"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-1">
                  {uniqueSalesReps.map((s) => (
                    <label 
                      key={s}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-purple-50 cursor-pointer transition-colors"
                    >
                      <input 
                        type="checkbox"
                        checked={pendingTeams.includes(s)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPendingTeams(prev => [...prev, s]);
                          } else {
                            setPendingTeams(prev => prev.filter(t => t !== s));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#A020F0] accent-[#A020F0]"
                      />
                      <span className={`text-xs font-medium ${pendingTeams.includes(s) ? 'text-[#A020F0]' : 'text-gray-600'}`}>
                        {s}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="px-4 pt-2 border-t border-gray-100">
                  <button 
                    onClick={() => { setSelectedTeams(pendingTeams); setIsTeamOpen(false); }}
                    className="w-full py-2 bg-[#A020F0] text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Del. Agent Filter (Dialog) ── */}
        <div className="relative">
          <button 
            onClick={() => {
              closeAllDropdowns();
              setPendingDelAgents([...selectedDelAgents]);
              setDelAgentSearch('');
              setIsDelAgentOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium"
          >
            <span>{selectedDelAgents.length > 0 ? `Del. Agent (${selectedDelAgents.length})` : 'Del. Agent'}</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {/* ── CS Agent Filter (Dialog) ── */}
        <div className="relative">
          <button 
            onClick={() => {
              closeAllDropdowns();
              setPendingCSAgents([...selectedCSAgents]);
              setCSAgentSearch('');
              setIsCSAgentOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:cursor-pointer"
          >
            <span>{selectedCSAgents.length > 0 ? `CS Agent (${selectedCSAgents.length})` : 'CS Agent'}</span>
            <ChevronDown size={14} />
          </button>
        </div>

        <button className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowUpDown size={18} />
        </button>

        <div className="flex items-center gap-2 ml-2">
          {Object.entries(STATUS_STYLES).map(([key, style]) => (
            <span key={key} className={`px-3 py-1 rounded text-[10px] font-bold shadow-sm ${style.bg} ${style.text}`}>
              {style.label}
            </span>
          ))}
        </div>

        <div className="ml-auto relative">
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-200 w-48 shadow-sm"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        </div>
      </div>

      {/* ══ Del. Agent Dialog Modal ══ */}
      {isDelAgentOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsDelAgentOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[85vh] flex flex-col mx-4">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="search"
                  value={delAgentSearch}
                  onChange={(e) => setDelAgentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <button onClick={() => setIsDelAgentOpen(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-4" style={{ scrollbarWidth: 'thin' }}>
              {/* Agent grid */}
              <div className="grid grid-cols-5 gap-3 pb-6 border-b border-gray-200">
                {filteredMockAgents.map((agent) => {
                  const isSelected = pendingDelAgents.includes(agent.name);
                  return (
                    <button
                      key={agent.name}
                      onClick={() => {
                        if (isSelected) {
                          setPendingDelAgents(prev => prev.filter(n => n !== agent.name));
                        } else {
                          setPendingDelAgents(prev => [...prev, agent.name]);
                        }
                      }}
                      className="flex items-center gap-2 py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200">
                        <Image
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=random&size=32`}
                          alt={agent.name}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{agent.name}</p>
                        <p className="text-[10px] text-gray-400">{agent.orders} Orders Today</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        isSelected ? 'border-[#A020F0] bg-[#A020F0]' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected section */}
              {pendingDelAgents.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-bold text-gray-800 mb-4">{pendingDelAgents.length} Delivery Agents Selected</p>
                  <div className="grid grid-cols-4 gap-3">
                    {pendingDelAgents.map((name) => {
                      const agent = MOCK_AGENTS.find(a => a.name === name);
                      return (
                        <div key={name} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-2">
                          <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
                            <Image
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=28`}
                              alt={name}
                              fill
                              className="object-cover"
                              sizes="28px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
                            <p className="text-[9px] text-gray-400">{agent?.orders || 20} Orders Today</p>
                          </div>
                          <button
                            onClick={() => setPendingDelAgents(prev => prev.filter(n => n !== name))}
                            className="p-0.5 text-gray-400 hover:text-gray-600 shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedDelAgents(pendingDelAgents);
                  setIsDelAgentOpen(false);
                }}
                className="px-8 py-2.5 bg-[#A020F0] text-white rounded-full text-sm font-bold hover:bg-purple-700 transition-colors hover:cursor-pointer"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CS Agent Dialog Modal ══ */}
      {isCSAgentOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsCSAgentOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[85vh] flex flex-col mx-4">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="search"
                  value={csAgentSearch}
                  onChange={(e) => setCSAgentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <button onClick={() => setIsCSAgentOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:cursor-pointer">
                <X size={22} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-4" style={{ scrollbarWidth: 'thin' }}>
              {/* Agent grid */}
              <div className="grid grid-cols-5 gap-3 pb-6 border-b border-gray-200">
                {filteredCSAgents.map((agent) => {
                  const isSelected = pendingCSAgents.includes(agent.name);
                  return (
                    <button
                      key={agent.name}
                      onClick={() => {
                        if (isSelected) {
                          setPendingCSAgents(prev => prev.filter(n => n !== agent.name));
                        } else {
                          setPendingCSAgents(prev => [...prev, agent.name]);
                        }
                      }}
                      className="flex items-center gap-2 py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors text-left hover:cursor-pointer"
                    >
                      <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200">
                        <Image
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=random&size=32`}
                          alt={agent.name}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{agent.name}</p>
                        <p className="text-[10px] text-gray-400">{agent.orders} Orders Today</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        isSelected ? 'border-[#A020F0] bg-[#A020F0]' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected section */}
              {pendingCSAgents.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-bold text-gray-800 mb-4">{pendingCSAgents.length} CS Agents Selected</p>
                  <div className="grid grid-cols-4 gap-3">
                    {pendingCSAgents.map((name) => {
                      const agent = MOCK_AGENTS.find(a => a.name === name);
                      return (
                        <div key={name} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-2">
                          <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
                            <Image
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=28`}
                              alt={name}
                              fill
                              className="object-cover"
                              sizes="28px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
                            <p className="text-[9px] text-gray-400">{agent?.orders || 20} Orders Today</p>
                          </div>
                          <button
                            onClick={() => setPendingCSAgents(prev => prev.filter(n => n !== name))}
                            className="p-0.5 text-gray-400 hover:text-gray-600 shrink-0 hover:cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedCSAgents(pendingCSAgents);
                  setIsCSAgentOpen(false);
                }}
                className="px-8 py-2.5 bg-[#A020F0] text-white rounded-full text-sm font-bold hover:bg-purple-700 transition-colors hover:cursor-pointer"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#F8F9FA] rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left border-separate border-spacing-y-0">
          <thead>
            <tr className="bg-gray-100/50">
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">G-Mail</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Agent</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">State</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sales Rep</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Quantity</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Date</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status Date</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredOrders.map((order) => {
              const style = STATUS_STYLES[order.status];
              return (
                <tr 
                  key={order.id} 
                  onClick={() => router.push(`/data/order/${order.id}`)}
                  className="group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                      <span className="text-sm text-gray-500 group-hover:text-gray-900 transition-colors">{order.gmail}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-700">{order.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    {order.agent ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700">{order.agent.name}</p>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{order.state}</p>
                      <p className="text-[10px] text-gray-400">{order.state} State</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-medium">{order.salesRep}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-medium">{order.product}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">{order.quantity}</span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="text-sm text-gray-500">{order.date}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.status === 'Pending' ? (
                      <span className="text-sm text-gray-500">---</span>
                    ) : (
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${style.bg} ${style.text} ${order.status === 'Failed' ? '!bg-[#E53E3E] !text-white' : order.status === 'Confirmed' ? '!bg-[#38A169] !text-white' : order.status === 'Cancelled' ? '!bg-[#ED8936] !text-white' : order.status === 'Delivered' ? '!bg-[#02C39A] !text-white' : ''}`}>
                          {style.label}
                        </span>
                        <span className="text-sm text-gray-700">
                          {['Confirmed', 'Cancelled'].includes(order.status) ? 'Today' : '03-02-2026'}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
