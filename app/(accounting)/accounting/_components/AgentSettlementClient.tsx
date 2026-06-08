'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircle,
  MapPin,
  Truck,
  CreditCard,
  Calendar as CalendarIcon,
  ChevronDown,
  ArrowUpDown,
  History,
  Check,
  User,
  X
} from 'lucide-react';
import { AgentSettlement, AgentLedgerEntry } from '@/lib/mock-data/agent-settlement';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { createRemittanceAction, createSettlementAdjustmentAction } from "@/modules/finance/actions/settlements.action";
import { fetchDeliveredOrdersAction, fetchAgentRemittancesAction, fetchAgentBalanceAction, fetchAgentAdjustmentsAction, fetchAgentLedgerRefsAction } from "@/modules/finance/actions/agent-data.action";

interface AgentSettlementWithId extends AgentSettlement { agentId?: string }
type AnyLedgerEntry = Omit<AgentLedgerEntry, 'referenceType'> & { referenceType: string; agentId?: string };

interface DeliveryAgentRow {
  agentId: string;
  agentName: string;
  state: string;
  totalSalesValue: string;
  delFeesEarned: string;
  totalRemitted: string;
  balance: string;
  overpayment: string;
  underpayment: string;
  date: string;
}

interface AgentSettlementClientProps {
  initialAgents?: DeliveryAgentRow[];
  initialLedger?: AnyLedgerEntry[];
  agentOptions?: { id: string; companyName: string; state: string | null }[];
}

type DateRangeFilter = { from: string; to: string };

interface AgentLedgerViewProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  openDropdown: string | null;
  toggleDropdown: (name: string) => void;
  initialLedger?: AnyLedgerEntry[];
  referenceTypeFilter: string;
  setReferenceTypeFilter: React.Dispatch<React.SetStateAction<string>>;
  dateRange: DateRangeFilter;
  setDateRange: React.Dispatch<React.SetStateAction<DateRangeFilter>>;
  setOpenDropdown: React.Dispatch<React.SetStateAction<string | null>>;
}

interface FilterButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isOpen: boolean;
}

export function AgentSettlementClient({ initialAgents, initialLedger, agentOptions }: AgentSettlementClientProps = {}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'ledger' | 'remittance' | 'adjustment'>('list');
  const [search, setSearch] = useState('');

  // Filter States
  const [stateFilter, setStateFilter] = useState('All');
  const [agentTypeFilter, setAgentTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [ledgerReferenceTypeFilter, setLedgerReferenceTypeFilter] = useState('All');
  const [ledgerDateRange, setLedgerDateRange] = useState({ from: '', to: '' });

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const tabs = [
    { id: 'list', label: 'Agent List' },
    { id: 'ledger', label: 'Agent Ledger' },
    { id: 'remittance', label: 'Remittance Entry' },
    { id: 'adjustment', label: 'Settlement Adjustment' }
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-[#F9FAFB]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <ChevronRight size={20} />
          </button>
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <RotateCcw size={18} />
          </button>
        </div>
        <button className="w-12 h-12 bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200">
          <MessageCircle size={24} fill="currentColor" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[32px] font-bold text-gray-800 tracking-tight">
          {activeTab === 'list' ? 'Agent List' : 'Agents Ledger'}
        </h1>

        {/* Tab Switcher */}
        <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-200 ${activeTab === tab.id
                ? 'bg-[#AE00FF] text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'list' ? (
        <AgentListView
          search={search}
          setSearch={setSearch}
          openDropdown={openDropdown}
          toggleDropdown={toggleDropdown}
          stateFilter={stateFilter}
          setStateFilter={setStateFilter}
          agentTypeFilter={agentTypeFilter}
          setAgentTypeFilter={setAgentTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          setOpenDropdown={setOpenDropdown}
          router={router}
          initialAgents={initialAgents}
        />
      ) : activeTab === 'ledger' ? (
        <AgentLedgerView
          search={search}
          setSearch={setSearch}
          openDropdown={openDropdown}
          toggleDropdown={toggleDropdown}
          initialLedger={initialLedger}
          referenceTypeFilter={ledgerReferenceTypeFilter}
          setReferenceTypeFilter={setLedgerReferenceTypeFilter}
          dateRange={ledgerDateRange}
          setDateRange={setLedgerDateRange}
          setOpenDropdown={setOpenDropdown}
        />
      ) : activeTab === 'remittance' ? (
        <RemittanceEntryView agentOptions={agentOptions} />
      ) : activeTab === 'adjustment' ? (
        <SettlementAdjustmentView agentOptions={agentOptions} />
      ) : (
        <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
          <p className="text-gray-400 font-medium">Content for {activeTab} coming soon...</p>
        </div>
      )}
    </div>
  );
}

function SettlementAdjustmentView({ agentOptions }: { agentOptions?: { id: string; companyName: string; state: string | null }[] }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [adjustmentType, setAdjustmentType] = useState('Correction');
  const [paymentType, setPaymentType] = useState('Waybill');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  const [agentId, setAgentId] = useState(agentOptions?.[0]?.id ?? '');
  const [referenceId, setReferenceId] = useState('');
  const [amountText, setAmountText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [savingAdj, setSavingAdj] = useState(false);
  const routerAdj = useRouter();

  // Real data state
  const [deliveredOrders, setDeliveredOrders] = useState<any[]>([]);
  const [recentRemittances, setRecentRemittances] = useState<any[]>([]);
  const [adjustmentHistory, setAdjustmentHistory] = useState<any[]>([]);
  const [ledgerRefs, setLedgerRefs] = useState<any[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [loadingOrders, setLoadingOrders] = useState(false);

  React.useEffect(() => {
    if (!agentId) return;
    setLoadingOrders(true);
    setSelectedOrders([]);
    setTempSelected([]);
    setReferenceId('');
    Promise.all([
      fetchDeliveredOrdersAction(agentId),
      fetchAgentRemittancesAction(agentId),
      fetchAgentAdjustmentsAction(agentId),
      fetchAgentLedgerRefsAction(agentId),
      fetchAgentBalanceAction(agentId),
    ]).then(([orders, remittances, adjustments, refs, balance]) => {
      setDeliveredOrders(orders);
      setRecentRemittances(remittances);
      setAdjustmentHistory(adjustments);
      setLedgerRefs(refs);
      setCurrentBalance(balance);
      setLoadingOrders(false);
    });
  }, [agentId]);

  const selectedAgent = agentOptions?.find(a => a.id === agentId);
  const fmt = (n: number) => `₦${Number(n).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  const parsedAmount = parseFloat(amountText.replace(/[^0-9.]/g, '')) || 0;

  const adjTypeMap: Record<string, 'PAYMENT' | 'OVERPAYMENT' | 'CORRECTION'> = {
    Correction: 'CORRECTION',
    'Overpayment/Refund': 'OVERPAYMENT',
    'Balance/Underpayment': 'CORRECTION',
    Payment: 'PAYMENT',
  };

  const submitAdjustment = async () => {
    if (!agentId) { alert('Select agent'); return; }
    if (!amountText) { alert('Enter amount'); return; }
    // Payment adjustments (Waybill / Delivery fee / Miscellaneous) must be tied
    // to a single order so they can be consumed per-order elsewhere.
    if (adjustmentType === 'Payment' && selectedOrders.length === 0) { alert('Select an order'); return; }
    setSavingAdj(true);
    const resolvedPaymentType =
      adjustmentType === 'Correction' ? 'CORRECTION_IN_PLACE' :
      adjustmentType === 'Balance/Underpayment' ? 'UNDERPAYMENT' :
      paymentType;
    const orderIds = selectedOrders
      .map(id => deliveredOrders.find((o: any) => o.id === id)?.orderId)
      .filter(Boolean) as string[];
    // For payments the linked reference IS the order; other types keep their ref.
    const linkedReferenceId =
      adjustmentType === 'Payment'
        ? (orderIds[0] ?? `MANUAL-${Date.now()}`)
        : (referenceId || `MANUAL-${Date.now()}`);
    const res = await createSettlementAdjustmentAction({
      agentId,
      date: date ?? new Date(),
      adjustmentType: adjTypeMap[adjustmentType] ?? 'CORRECTION',
      paymentType: resolvedPaymentType,
      linkedReferenceId,
      amount: parsedAmount,
      note: noteText,
      ordersJson: adjustmentType === 'Payment' && orderIds.length > 0 ? orderIds : undefined,
    });
    setSavingAdj(false);
    if ('error' in res) { alert(res.error); return; }
    const [adjustments, balance] = await Promise.all([
      fetchAgentAdjustmentsAction(agentId),
      fetchAgentBalanceAction(agentId),
    ]);
    setAdjustmentHistory(adjustments);
    setCurrentBalance(balance);
    setAmountText('');
    setReferenceId('');
    setNoteText('');
    setSelectedOrders([]);
    routerAdj.refresh();
  };

  const handleConfirm = () => { setSelectedOrders(tempSelected); setIsModalOpen(false); };
  // Payment adjustments are tied to exactly one order, so selecting an order
  // replaces any previous pick (single-select).
  const toggleTempOrder = (id: string) => setTempSelected(prev => prev.includes(id) ? [] : [id]);

  const titleCaseType = (t: string) => t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, '/');

  return (
    <div className="animate-in fade-in duration-500">
      {/* Order Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[1100px] h-[85vh] rounded-[48px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-12 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-[36px] font-black text-gray-800 tracking-tight leading-tight">Select Delivered Order</h2>
                <p className="text-gray-400 text-[18px] font-medium mt-2">Pick the order to tie this adjustment to</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all hover:rotate-90">
                <RotateCcw size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#F9FAFB]/50">
              {loadingOrders ? (
                <div className="flex items-center justify-center h-full text-gray-400 font-medium">Loading orders…</div>
              ) : deliveredOrders.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 font-medium">No delivered orders for this agent</div>
              ) : (
                <div className="grid grid-cols-3 gap-8">
                  {deliveredOrders.map((order: any) => (
                    <div key={order.id} onClick={() => toggleTempOrder(order.id)}
                      className={`p-8 rounded-[40px] border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[220px] ${tempSelected.includes(order.id) ? 'border-[#AE00FF] bg-white shadow-2xl shadow-purple-100 ring-4 ring-purple-50' : 'border-white bg-white hover:border-purple-200 shadow-sm hover:shadow-md'}`}>
                      <div className="flex justify-between items-start mb-6">
                        <span className={`text-[12px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider ${tempSelected.includes(order.id) ? 'bg-[#AE00FF] text-white' : 'bg-gray-100 text-gray-500'}`}>{order.orderId}</span>
                        {tempSelected.includes(order.id) && <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-100"><Check size={18} strokeWidth={4} /></div>}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[20px] font-black text-gray-800 line-clamp-1">{order.customer}</p>
                        <p className="text-[14px] text-gray-400 font-bold uppercase tracking-tight flex items-center gap-2"><MapPin size={14} className="text-purple-300" />{order.state}</p>
                      </div>
                      <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                        <div><span className="text-[10px] text-gray-400 font-black uppercase mb-1 block">Net Amount</span><span className="text-[18px] font-black text-[#AE00FF]">{order.netAmount}</span></div>
                        <div className="text-right"><span className="text-[10px] text-gray-400 font-black uppercase mb-1 block">Date</span><span className="text-[13px] font-bold text-gray-600">{order.date}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-12 border-t border-gray-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center text-[#AE00FF]"><Check size={32} strokeWidth={3} /></div>
                <div><p className="text-[24px] font-black text-gray-800 leading-none">{tempSelected.length} Order{tempSelected.length === 1 ? '' : 's'}</p><p className="text-gray-400 font-bold uppercase tracking-widest text-[12px] mt-1">Selected</p></div>
              </div>
              <div className="flex gap-6">
                <button onClick={() => setIsModalOpen(false)} className="px-10 py-5 rounded-2xl text-gray-400 font-black text-[16px] hover:bg-gray-50 transition-colors uppercase tracking-widest">Cancel</button>
                <button onClick={handleConfirm} className="px-16 py-5 bg-[#AE00FF] text-white rounded-[24px] text-[20px] font-black shadow-2xl shadow-purple-200 hover:scale-[1.05] active:scale-95 transition-all uppercase tracking-widest">Okay</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Details Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 p-12 relative border border-gray-100">
            <button onClick={() => setSelectedHistory(null)} className="absolute top-8 right-8 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all hover:rotate-90">
              <X size={20} />
            </button>
            <h3 className="text-[20px] font-medium text-gray-500 mb-8">Adjustment Details</h3>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-[#AE00FF] font-bold text-[18px] flex items-center justify-center shadow-sm">
                {selectedAgent?.companyName?.charAt(0) ?? '?'}
              </div>
              <p className="text-[18px] text-gray-600 font-medium">{selectedAgent?.companyName ?? '—'}</p>
            </div>

            <div className="flex items-center justify-between mb-8">
              <p className="text-[20px] font-black text-gray-800 w-[200px]">{titleCaseType(selectedHistory.adjustmentType)}</p>
              <p className="text-[18px] text-gray-500 font-medium">{selectedHistory.linkedReferenceId}</p>
              <p className="text-[14px] text-gray-500 font-medium w-[100px] text-right">{selectedHistory.date}</p>
            </div>

            <div className="w-full h-[1px] bg-gray-200 mb-8" />

            {Array.isArray(selectedHistory.ordersJson) && selectedHistory.ordersJson.length > 0 && (
              <div className="mb-8">
                <p className="text-[13px] text-gray-500 font-medium mb-2">Orders Covered</p>
                <p className="text-[18px] font-black text-gray-800 mb-6">{selectedHistory.ordersJson.length} Orders</p>
                <div className="flex flex-wrap gap-2.5">
                  {selectedHistory.ordersJson.map((id: string, i: number) => (
                    <span key={i} className="px-5 py-2 bg-[#F4E6FF] text-[#AE00FF] text-[11px] font-bold rounded-full">{id}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-8 mb-8">
              <div><p className="text-[11px] text-gray-400 font-bold uppercase mb-1">Amount</p><p className="text-[20px] font-black text-gray-800">{fmt(selectedHistory.amount)}</p></div>
              <div><p className="text-[11px] text-gray-400 font-bold uppercase mb-1">Running Balance After</p><p className="text-[20px] font-black text-gray-800">{fmt(selectedHistory.autoRunningBalance)}</p></div>
            </div>

            {selectedHistory.note && (
              <div className="w-full min-h-[80px] border border-[#E9D5FF] rounded-[20px] p-6 mb-10 shadow-sm">
                <p className="text-[16px] text-gray-600 font-medium">{selectedHistory.note}</p>
              </div>
            )}

            {selectedHistory.createdBy && (
              <div>
                <p className="text-[18px] text-gray-600 font-medium mb-6">Adjusted by</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                    <User size={26} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[18px] font-black text-gray-800 leading-tight mb-1">{selectedHistory.createdBy.name}</p>
                    <p className="text-[14px] text-gray-400 font-medium">{selectedHistory.createdBy.role.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-12 items-start mb-16">
        {/* Left Form Column */}
        <div className="flex-1 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[14px] font-bold text-gray-700">Agent Name</label>
              <div className="relative">
                <select
                  value={agentId}
                  onChange={e => setAgentId(e.target.value)}
                  className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl px-6 text-[14px] text-gray-800 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-200 font-medium"
                >
                  {(agentOptions ?? []).map(a => (
                    <option key={a.id} value={a.id}>{a.companyName}{a.state ? ` | ${a.state}` : ''}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[14px] font-bold text-gray-700">Date</label>
              <Popover>
                <PopoverTrigger className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl px-6 flex items-center justify-between text-[14px] text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-purple-200">
                  <span>{date ? format(date, "PPP") : "Pick a date"}</span>
                  <CalendarIcon size={18} className="text-gray-400" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-gray-100 shadow-xl" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="rounded-2xl border-none" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[14px] font-bold text-gray-700">Adjustment Type</label>
              <div className="relative">
                <select value={adjustmentType} onChange={e => { setAdjustmentType(e.target.value); setSelectedOrders([]); setReferenceId(''); }}
                  className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl px-6 text-[14px] text-gray-800 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-200 font-medium">
                  <option value="Correction">Correction</option>
                  <option value="Overpayment/Refund">Overpayment/Refund</option>
                  <option value="Balance/Underpayment">Balance/Underpayment</option>
                  <option value="Payment">Payment</option>
                </select>
                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {adjustmentType === 'Payment' && (
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-gray-700">Payment Type</label>
                <div className="relative">
                  <select value={paymentType} onChange={e => setPaymentType(e.target.value)}
                    className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl px-6 text-[14px] text-gray-800 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-200 font-medium">
                    <option value="Waybill">Waybill</option>
                    <option value="Delivery fee">Delivery fee</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {adjustmentType === 'Payment' ? (
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-gray-700">Order</label>
                <div onClick={() => { setTempSelected(selectedOrders); setIsModalOpen(true); }}
                  className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl px-6 flex items-center justify-between text-[14px] font-medium cursor-pointer hover:border-purple-200 transition-colors">
                  <span className={selectedOrders.length > 0 ? 'text-gray-800 font-bold' : 'text-gray-300'}>
                    {selectedOrders.length > 0
                      ? (deliveredOrders.find((o: any) => o.id === selectedOrders[0])?.orderId ?? 'Order selected')
                      : 'Select Order'}
                  </span>
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
              </div>
            ) : adjustmentType === 'Correction' ? (
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-gray-700">Ledger Entry to Correct</label>
                <div className="relative">
                  <select
                    value={referenceId}
                    onChange={e => setReferenceId(e.target.value)}
                    className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl px-6 text-[14px] text-gray-800 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-200 font-medium"
                  >
                    <option value="">— Select a ledger entry —</option>
                    {ledgerRefs.map((r: any) => (
                      <option key={r.id} value={r.referenceId}>
                        {r.referenceId} · {r.referenceType} · {r.date}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {ledgerRefs.length === 0 && !loadingOrders && (
                  <p className="text-[12px] text-gray-400 font-medium mt-1">No ledger entries found for this agent</p>
                )}
              </div>
            ) : (adjustmentType === 'Overpayment/Refund' || adjustmentType === 'Balance/Underpayment') && (
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-gray-700">
                  {adjustmentType === 'Overpayment/Refund' ? 'Remittance to Refund' : 'Remittance to Balance'}
                </label>
                <div className="relative">
                  <select
                    value={referenceId}
                    onChange={e => setReferenceId(e.target.value)}
                    className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl px-6 text-[14px] text-gray-800 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-200 font-medium"
                  >
                    <option value="">— Select a remittance entry —</option>
                    {recentRemittances.map((r: any) => (
                      <option key={r.id} value={r.referenceId}>
                        {r.referenceId} · {r.date} · {r.credit}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {recentRemittances.length === 0 && !loadingOrders && (
                  <p className="text-[12px] text-gray-400 font-medium mt-1">No remittance entries found for this agent</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 items-center">
            <div className="space-y-2">
              <label className="text-[14px] font-bold text-gray-400">
                {adjustmentType === 'Correction' ? 'Amount Remitted' :
                 adjustmentType === 'Overpayment/Refund' ? 'Amount to be subtracted' :
                 adjustmentType === 'Balance/Underpayment' ? 'Balance' : 'Amount'}
              </label>
              <input type="text" value={amountText} onChange={e => setAmountText(e.target.value)}
                placeholder="₦0.00"
                className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl px-6 text-[14px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-200 font-medium" />
            </div>
            <div />
          </div>

          <div className="space-y-2">
            <label className="text-[16px] font-bold text-gray-400">Note</label>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note here…"
              className="w-full h-[180px] bg-white border border-purple-200 rounded-[24px] p-8 text-[18px] text-gray-800 focus:outline-none font-medium resize-none" />
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="w-[420px] space-y-6">
          <div className="bg-white rounded-[32px] border-[12px] border-gray-400 shadow-xl p-10 min-h-[500px]">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-[14px] font-bold text-gray-800">Reference ID</h3>
              <span className="text-[12px] font-bold text-gray-400 uppercase">
                {adjustmentType === 'Payment'
                  ? (deliveredOrders.find((o: any) => o.id === selectedOrders[0])?.orderId ?? '—')
                  : (referenceId || '—')}
              </span>
            </div>

            <div className="flex items-center gap-12 mb-10">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-[#AE00FF] font-bold text-[18px]">
                {selectedAgent?.companyName?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase">Agent Name</span>
                <span className="text-[11px] font-bold text-gray-400 uppercase">Date</span>
                <span className="text-[14px] font-bold text-gray-800 truncate">{selectedAgent?.companyName ?? '—'}</span>
                <span className="text-[14px] font-bold text-gray-800">{date ? format(date, "yyyy-MM-dd") : '—'}</span>
              </div>
            </div>

            {adjustmentType === 'Payment' ? (
              <div className="mb-10">
                <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Order</p>
                <p className="text-[14px] font-bold text-gray-700 italic mb-4">Payment for {paymentType}</p>
                <div className="grid grid-cols-4 gap-2">
                  {selectedOrders.map((id) => {
                    const o = deliveredOrders.find((o: any) => o.id === id);
                    return <div key={id} className="bg-purple-50 text-[#AE00FF] text-[9px] font-bold py-1 px-2 rounded flex items-center justify-center">{o?.orderId ?? id}</div>;
                  })}
                  {selectedOrders.length === 0 && (
                    <div className="col-span-4 text-center py-4 border-2 border-dashed border-gray-100 rounded-xl text-gray-300 text-[11px] font-bold uppercase">No Order Selected</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-10 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Adjustment Details</p>
                <p className="text-[14px] font-bold text-gray-700 italic">
                  {adjustmentType === 'Payment' ? `Payment for ${paymentType}` :
                   adjustmentType === 'Overpayment/Refund' ? 'Processing Refund' :
                   adjustmentType === 'Balance/Underpayment' ? 'Balance Settlement' : 'Correction'}
                </p>
              </div>
            )}

            <div className="space-y-6 pt-6 border-t border-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-gray-400 font-medium">
                  {adjustmentType === 'Correction' ? 'Amount Remitted' :
                   adjustmentType === 'Overpayment/Refund' ? 'Amount to subtract' :
                   adjustmentType === 'Balance/Underpayment' ? 'Balance' : 'Amount'}
                </span>
                <span className="text-[22px] font-black text-gray-800">{parsedAmount > 0 ? fmt(parsedAmount) : '₦0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-400 font-medium uppercase">Current Balance</span>
                <span className="text-[14px] font-bold text-gray-600">{fmt(currentBalance)}</span>
              </div>
            </div>
          </div>

          <button onClick={submitAdjustment} disabled={savingAdj}
            className="w-full h-[70px] bg-[#AE00FF] text-white rounded-2xl text-[20px] font-black shadow-lg shadow-purple-200 hover:scale-[1.02] transition-transform disabled:opacity-50">
            {savingAdj ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </div>

      <div>
        {/* Adjustment History — Corrections only */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 min-h-[300px]">
          <h3 className="text-[18px] font-bold text-gray-500 mb-8">Correction History</h3>
          {adjustmentHistory.filter((item: any) => item.adjustmentType === 'CORRECTION').length === 0 ? (
            <p className="text-[13px] text-gray-400 font-medium text-center py-8">No corrections recorded yet</p>
          ) : (
            <div className="flex gap-8 flex-wrap">
              {adjustmentHistory
                .filter((item: any) => item.adjustmentType === 'CORRECTION')
                .map((item: any) => (
                  <div key={item.id}
                    className="flex gap-6 relative cursor-pointer hover:bg-gray-50 p-4 rounded-xl transition-colors border border-gray-100 min-w-[280px]"
                    onClick={() => setSelectedHistory(item)}>
                    <div className="w-6 h-6 rounded-full bg-[#300066] border-4 border-white shadow-sm z-10 flex-shrink-0 mt-1" />
                    <div className="space-y-1">
                      <p className="text-[15px] font-bold text-gray-800">
                        {item.paymentType === 'CORRECTION_IN_PLACE' ? 'Entry Correction' : 'Balance / Underpayment'}
                      </p>
                      <p className="text-[13px] font-bold text-gray-400">{item.linkedReferenceId}</p>
                      <p className="text-[11px] font-bold text-gray-300">{item.date}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function RemittanceEntryView({ agentOptions }: { agentOptions?: { id: string; companyName: string; state: string | null }[] }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agentId, setAgentId] = useState(agentOptions?.[0]?.id ?? '');
  const [amountRemitted, setAmountRemitted] = useState('');
  const [noteText, setNoteText] = useState('');
  const [savingRem, setSavingRem] = useState(false);
  const router = useRouter();

  // Real data state
  const [deliveredOrders, setDeliveredOrders] = useState<any[]>([]);
  const [recentRemittances, setRecentRemittances] = useState<any[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fetch agent data whenever agentId changes
  React.useEffect(() => {
    if (!agentId) return;
    setLoadingOrders(true);
    setSelectedOrders([]);
    setTempSelected([]);
    Promise.all([
      fetchDeliveredOrdersAction(agentId),
      fetchAgentRemittancesAction(agentId),
      fetchAgentBalanceAction(agentId),
    ]).then(([orders, remittances, balance]) => {
      setDeliveredOrders(orders);
      setRecentRemittances(remittances);
      setCurrentBalance(balance);
      setLoadingOrders(false);
    });
  }, [agentId]);

  const selectedAgent = agentOptions?.find(a => a.id === agentId);

  // Sum netAmount for selected orders
  const totalExpected = selectedOrders.reduce((sum, id) => {
    const o = deliveredOrders.find((o: any) => o.id === id);
    return sum + (o?.netAmountNum ?? 0);
  }, 0);

  const fmt = (n: number) => `₦${Number(n).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  const projectedBalance = currentBalance - (parseFloat(amountRemitted) || 0);

  const handleSubmitRemittance = async () => {
    if (!agentId || selectedOrders.length === 0 || !amountRemitted) {
      alert('Select agent, orders, and amount');
      return;
    }
    setSavingRem(true);
    const res = await createRemittanceAction({
      agentId,
      date: date ?? new Date(),
      orderIds: selectedOrders,
      amountRemitted: parseFloat(amountRemitted) || 0,
      note: noteText,
    });
    setSavingRem(false);
    if ('error' in res) { alert(res.error); return; }
    // Refresh remittances and balance after submission
    const [remittances, balance] = await Promise.all([
      fetchAgentRemittancesAction(agentId),
      fetchAgentBalanceAction(agentId),
    ]);
    setRecentRemittances(remittances);
    setCurrentBalance(balance);
    setSelectedOrders([]);
    setAmountRemitted('');
    setNoteText('');
    router.refresh();
  };

  const handleConfirm = () => {
    setSelectedOrders(tempSelected);
    setIsModalOpen(false);
  };

  const toggleTempOrder = (recordId: string) => {
    setTempSelected(prev =>
      prev.includes(recordId) ? prev.filter(id => id !== recordId) : [...prev, recordId]
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Order Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[1100px] h-[85vh] rounded-[48px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-12 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-[36px] font-black text-gray-800 tracking-tight leading-tight">Select Delivered Orders</h2>
                <p className="text-gray-400 text-[18px] font-medium mt-2">Pick the orders to include in this remittance entry</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all hover:rotate-90"
              >
                <RotateCcw size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#F9FAFB]/50">
              {loadingOrders ? (
                <div className="flex items-center justify-center h-full text-gray-400 font-medium">Loading orders…</div>
              ) : deliveredOrders.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 font-medium">No delivered orders for this agent</div>
              ) : (
                <div className="grid grid-cols-3 gap-8">
                  {deliveredOrders.map((order: any) => (
                    <div
                      key={order.id}
                      onClick={() => toggleTempOrder(order.id)}
                      className={`p-8 rounded-[40px] border-2 transition-all cursor-pointer relative group flex flex-col justify-between min-h-[220px] ${
                        tempSelected.includes(order.id)
                          ? 'border-[#AE00FF] bg-white shadow-2xl shadow-purple-100 ring-4 ring-purple-50'
                          : 'border-white bg-white hover:border-purple-200 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <span className={`text-[12px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider ${
                          tempSelected.includes(order.id) ? 'bg-[#AE00FF] text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {order.orderId}
                        </span>
                        {tempSelected.includes(order.id) && (
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-100">
                            <Check size={18} strokeWidth={4} />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-[20px] font-black text-gray-800 line-clamp-1">{order.customer}</p>
                        <p className="text-[14px] text-gray-400 font-bold uppercase tracking-tight flex items-center gap-2">
                          <MapPin size={14} className="text-purple-300" /> {order.state}
                        </p>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-black uppercase mb-1">Net Amount</span>
                          <span className="text-[18px] font-black text-[#AE00FF]">{order.netAmount}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-black uppercase mb-1 block">Date</span>
                          <span className="text-[13px] font-bold text-gray-600">{order.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-12 border-t border-gray-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center text-[#AE00FF]">
                  <Check size={32} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-[24px] font-black text-gray-800 leading-none">{tempSelected.length} Orders</p>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[12px] mt-1">Ready for settlement</p>
                </div>
              </div>
              <div className="flex gap-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-10 py-5 rounded-2xl text-gray-400 font-black text-[16px] hover:bg-gray-50 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-16 py-5 bg-[#AE00FF] text-white rounded-[24px] text-[20px] font-black shadow-2xl shadow-purple-200 hover:scale-[1.05] active:scale-95 transition-all uppercase tracking-widest"
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-12 items-start mb-16">
        {/* Left Form Column */}
        <div className="flex-1 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[14px] font-bold text-gray-700">Agent Name</label>
              <div className="relative">
                <select
                  value={agentId}
                  onChange={e => setAgentId(e.target.value)}
                  className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl px-6 text-[14px] text-gray-800 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-200 font-medium"
                >
                  {(agentOptions ?? []).map(a => (
                    <option key={a.id} value={a.id}>{a.companyName}{a.state ? ` | ${a.state}` : ''}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[14px] font-bold text-gray-700">Date</label>
              <Popover>
                <PopoverTrigger className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl px-6 flex items-center justify-between text-[14px] text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-purple-200">
                  <span>{date ? format(date, "PPP") : "Pick a date"}</span>
                  <CalendarIcon size={18} className="text-gray-400" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-gray-100 shadow-xl" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="rounded-2xl border-none" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[14px] font-bold text-gray-700">Orders Covered (multi-select)</label>
              <div
                onClick={() => { setTempSelected(selectedOrders); setIsModalOpen(true); }}
                className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl px-6 flex items-center justify-between text-[14px] text-gray-400 font-medium focus:outline-none focus:ring-1 focus:ring-purple-200 cursor-pointer hover:border-purple-200 transition-colors"
              >
                <span className={selectedOrders.length > 0 ? "text-gray-800 font-bold" : "text-gray-300"}>
                  {selectedOrders.length > 0 ? `${selectedOrders.length} Orders Selected` : 'Select Orders'}
                </span>
                <ChevronDown size={18} className="text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[14px] font-bold text-gray-700">Amount Remitted</label>
              <input
                type="number"
                value={amountRemitted}
                onChange={e => setAmountRemitted(e.target.value)}
                placeholder="Amount Remitted"
                className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl px-6 text-[14px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-200 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 items-center">
            <div className="space-y-2">
              <label className="text-[14px] font-bold text-gray-400">Total Expected Amount (auto-calculated)</label>
              <div className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl px-6 flex items-center text-[14px] text-gray-800 font-bold">
                {fmt(totalExpected)}
              </div>
            </div>
            {(() => {
              const remitted = parseFloat(amountRemitted) || 0;
              const tallies = totalExpected > 0 && remitted === totalExpected;
              return (
                <div className="flex items-center gap-3 text-[13px] font-medium pt-6">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white transition-colors ${tallies ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <Check size={12} strokeWidth={4} />
                  </div>
                  <span className={tallies ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                    {tallies
                      ? 'Amount remitted matches expected'
                      : totalExpected > 0 && remitted > 0
                        ? 'Amount remitted does not match expected'
                        : 'Select orders and enter amount to verify'}
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="space-y-2">
            <label className="text-[16px] font-bold text-gray-400">Note</label>
            <div className="relative">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note…"
                className="w-full h-[180px] bg-white border border-purple-200 rounded-[24px] p-8 text-[18px] text-gray-800 focus:outline-none font-medium resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="w-[420px] space-y-6">
          <div className="bg-white rounded-[32px] border-[12px] border-gray-400 shadow-xl p-10 min-h-[500px]">
            <h3 className="text-[18px] font-bold text-gray-800 text-center mb-10">Summary</h3>

            <div className="flex items-center gap-12 mb-10">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-[#AE00FF] font-bold text-[18px]">
                {selectedAgent?.companyName?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase">Agent Name</span>
                <span className="text-[11px] font-bold text-gray-400 uppercase">Date</span>
                <span className="text-[14px] font-bold text-gray-800 truncate">{selectedAgent?.companyName ?? '—'}</span>
                <span className="text-[14px] font-bold text-gray-800">{date ? format(date, "yyyy-MM-dd") : '—'}</span>
              </div>
            </div>

            <div className="mb-10">
              <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Orders Covered</p>
              <p className="text-[16px] font-bold text-gray-800 mb-4">{selectedOrders.length} Orders</p>
              <div className="grid grid-cols-4 gap-2">
                {selectedOrders.map((id) => {
                  const o = deliveredOrders.find((o: any) => o.id === id);
                  return (
                    <div key={id} className="bg-purple-50 text-[#AE00FF] text-[9px] font-bold py-1 px-2 rounded flex items-center justify-center">
                      {o?.orderId ?? id}
                    </div>
                  );
                })}
                {selectedOrders.length === 0 && (
                  <div className="col-span-4 text-center py-4 border-2 border-dashed border-gray-100 rounded-xl text-gray-300 text-[11px] font-bold uppercase">
                    No Orders Selected
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-gray-400 font-medium">Amount Remitted</span>
                <span className="text-[22px] font-black text-gray-800">
                  {amountRemitted ? fmt(parseFloat(amountRemitted)) : '₦0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-400 font-medium uppercase">Current Balance</span>
                <span className="text-[14px] font-bold text-gray-600">{fmt(currentBalance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-400 font-medium uppercase">Projected Balance</span>
                <span className={`text-[14px] font-bold ${projectedBalance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {fmt(projectedBalance)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitRemittance}
            disabled={savingRem}
            className="w-full h-[70px] bg-[#AE00FF] text-white rounded-2xl text-[20px] font-black shadow-lg shadow-purple-200 hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {savingRem ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>

      {/* Recent Remittances Table */}
      <h3 className="text-[18px] font-bold text-gray-500 mb-6">Recent Remittances</h3>
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#E5E7EB]/80 text-[12px] font-bold text-gray-600">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Reference ID</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Running Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentRemittances.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-[13px] text-gray-400 font-medium">
                  No remittances recorded for this agent yet
                </td>
              </tr>
            )}
            {recentRemittances.map((row: any, idx: number) => (
              <tr key={row.id} className={`${idx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'} hover:bg-gray-50/50 transition-colors`}>
                <td className="px-6 py-5 text-[13px] text-gray-400 font-medium">{row.date}</td>
                <td className="px-6 py-5 text-[13px] text-gray-800 font-bold tracking-tight">{row.referenceId}</td>
                <td className="px-6 py-5 text-[13px] font-bold text-gray-800">{row.credit}</td>
                <td className="px-6 py-5 text-[13px] font-bold text-gray-800">{row.runningBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AgentListView({
  search,
  setSearch,
  openDropdown,
  toggleDropdown,
  stateFilter,
  setStateFilter,
  agentTypeFilter,
  setAgentTypeFilter,
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
  setOpenDropdown,
  router,
  initialAgents,
}: any) {
  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
    "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
    "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
    "Sokoto", "Taraba", "Yobe", "Zamfara"
  ];

  const agentTypes = ["Independent", "Logistics Partner", "In-house"];
  const statuses = ["Paid", "Underpayment", "Overpayment", "Pending"];

  const agentsSource: any[] = initialAgents ?? [];
  const filtered = agentsSource.filter((a: any) => {
    const matchSearch = a.agentName.toLowerCase().includes(search.toLowerCase());
    const matchState = stateFilter === 'All' || a.state === stateFilter;
    const matchStatus = statusFilter === 'All' ||
      (statusFilter === 'Paid' && a.balance === '₦0') ||
      (statusFilter === 'Underpayment' && a.underpayment !== '₦0') ||
      (statusFilter === 'Overpayment' && a.overpayment !== '₦0');
    return matchSearch && matchState && matchStatus;
  });

  return (
    <>
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* State Filter */}
        <div className="relative">
          <FilterButton
            icon={<MapPin size={16} strokeWidth={2.5} />}
            label={stateFilter === 'All' ? 'State' : stateFilter}
            onClick={() => toggleDropdown('state')}
            isOpen={openDropdown === 'state'}
          />
          {openDropdown === 'state' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3 max-h-[300px] overflow-y-auto custom-scrollbar">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => { setStateFilter('All'); setOpenDropdown(null); }}
              >
                All States
              </div>
              {nigerianStates.map(s => (
                <div
                  key={s}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => { setStateFilter(s); setOpenDropdown(null); }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Type Filter */}
        <div className="relative">
          <FilterButton
            icon={<Truck size={16} strokeWidth={2.5} />}
            label={agentTypeFilter === 'All' ? 'Agent Type' : agentTypeFilter}
            onClick={() => toggleDropdown('type')}
            isOpen={openDropdown === 'type'}
          />
          {openDropdown === 'type' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => { setAgentTypeFilter('All'); setOpenDropdown(null); }}
              >
                All Types
              </div>
              {agentTypes.map(t => (
                <div
                  key={t}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => { setAgentTypeFilter(t); setOpenDropdown(null); }}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Status Filter */}
        <div className="relative">
          <FilterButton
            icon={<CreditCard size={16} strokeWidth={2.5} />}
            label={statusFilter === 'All' ? 'Payment Status' : statusFilter}
            onClick={() => toggleDropdown('status')}
            isOpen={openDropdown === 'status'}
          />
          {openDropdown === 'status' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => { setStatusFilter('All'); setOpenDropdown(null); }}
              >
                All Statuses
              </div>
              {statuses.map(s => (
                <div
                  key={s}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => { setStatusFilter(s); setOpenDropdown(null); }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="relative">
          <FilterButton
            icon={<CalendarIcon size={16} strokeWidth={2.5} />}
            label="Date Range"
            onClick={() => toggleDropdown('date')}
            isOpen={openDropdown === 'date'}
          />
          {openDropdown === 'date' && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-4 w-72">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">From</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange((prev: any) => ({ ...prev, from: e.target.value }))}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-purple-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">To</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange((prev: any) => ({ ...prev, to: e.target.value }))}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-purple-300"
                  />
                </div>
                <button
                  onClick={() => setOpenDropdown(null)}
                  className="w-full bg-[#AE00FF] text-white py-2 rounded-lg text-sm font-bold mt-2"
                >
                  Apply Filter
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
            className="w-full h-[48px] pl-12 pr-4 bg-white border border-gray-100 rounded-xl text-[14px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-200 shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white  overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[#E5E7EB]/80 text-[12px] font-bold text-gray-600">
                <th className="px-6 py-4 whitespace-nowrap">Agent Name</th>
                <th className="px-6 py-4 whitespace-nowrap">State</th>
                <th className="px-6 py-4 whitespace-nowrap">Total Sales Value</th>
                <th className="px-6 py-4 whitespace-nowrap">Del. Fees Earned</th>
                <th className="px-6 py-4 whitespace-nowrap">Total Remitted</th>
                <th className="px-6 py-4 whitespace-nowrap">Balance</th>
                <th className="px-6 py-4 whitespace-nowrap">Overpayment</th>
                <th className="px-6 py-4 whitespace-nowrap">Underpayment</th>
                <th className="px-6 py-4 whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((a, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => router.push(`/accounting/agent-settlement/${a.agentId}`)}
                  className={`${idx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'} hover:bg-gray-50/50 transition-colors cursor-pointer group`}
                >
                  <td className="px-6 py-5 text-[13px] font-bold text-gray-800 group-hover:text-[#AE00FF] transition-colors">{a.agentName}</td>
                  <td className="px-6 py-5 text-[13px] text-gray-600 font-medium">{a.state}</td>
                  <td className="px-6 py-5 text-[13px] font-bold text-gray-800">{a.totalSalesValue}</td>
                  <td className="px-6 py-5 text-[13px] text-gray-600 font-medium">{a.delFeesEarned}</td>
                  <td className="px-6 py-5 text-[13px] font-bold text-gray-800">{a.totalRemitted}</td>
                  <td className="px-6 py-5 text-[13px] font-bold text-gray-800">{a.balance}</td>
                  <td className="px-6 py-5 text-[13px] text-gray-600 font-medium">{a.overpayment}</td>
                  <td className="px-6 py-5 text-[13px] text-gray-600 font-medium">{a.underpayment}</td>
                  <td className="px-6 py-5 text-[13px] text-gray-400 font-medium">{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AgentLedgerView({
  search,
  setSearch,
  openDropdown,
  toggleDropdown,
  initialLedger,
  referenceTypeFilter,
  setReferenceTypeFilter,
  dateRange,
  setDateRange,
  setOpenDropdown,
}: AgentLedgerViewProps) {
  const ledgerSource = initialLedger ?? [];
  const referenceTypes = ["Remittance", "Delivery Fee", "Adjustment"];
  const dateRangeLabel = dateRange?.from && dateRange?.to
    ? `${dateRange.from} - ${dateRange.to}`
    : dateRange?.from
      ? `From ${dateRange.from}`
      : dateRange?.to
        ? `To ${dateRange.to}`
        : "Date Range";
  const filteredLedger = ledgerSource.filter((l) => {
    const query = search.toLowerCase().trim();
    const matchSearch = !query ||
      l.agent?.toLowerCase().includes(query) ||
      l.referenceType?.toLowerCase().includes(query) ||
      l.referenceId?.toLowerCase().includes(query);
    const matchReferenceType = referenceTypeFilter === "All" || l.referenceType === referenceTypeFilter;
    const matchFrom = !dateRange?.from || l.date >= dateRange.from;
    const matchTo = !dateRange?.to || l.date <= dateRange.to;

    return matchSearch && matchReferenceType && matchFrom && matchTo;
  });

  return (
    <>
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="relative">
          <FilterButton
            icon={<History size={16} strokeWidth={2.5} />}
            label={referenceTypeFilter === "All" ? "Reference Type" : referenceTypeFilter}
            onClick={() => toggleDropdown('ref')}
            isOpen={openDropdown === 'ref'}
          />
          {openDropdown === 'ref' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3">
              <div
                className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                onClick={() => { setReferenceTypeFilter('All'); setOpenDropdown(null); }}
              >
                All Types
              </div>
              {referenceTypes.map(type => (
                <div
                  key={type}
                  className="px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                  onClick={() => { setReferenceTypeFilter(type); setOpenDropdown(null); }}
                >
                  {type}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <FilterButton
            icon={<CalendarIcon size={16} strokeWidth={2.5} />}
            label={dateRangeLabel}
            onClick={() => toggleDropdown('date')}
            isOpen={openDropdown === 'date'}
          />
          {openDropdown === 'date' && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-4 w-72">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">From</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-purple-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">To</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-purple-300"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDateRange({ from: '', to: '' }); setOpenDropdown(null); }}
                    className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-bold"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setOpenDropdown(null)}
                    className="flex-1 bg-[#AE00FF] text-white py-2 rounded-lg text-sm font-bold"
                  >
                    Apply
                  </button>
                </div>
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
            className="w-full h-[48px] pl-12 pr-4 bg-white border border-gray-100 rounded-xl text-[14px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-200 shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#E5E7EB]/80 text-[12px] font-bold text-gray-600">
                <th className="px-6 py-4 whitespace-nowrap">Date</th>
                <th className="px-6 py-4 whitespace-nowrap">Agent</th>
                <th className="px-6 py-4 whitespace-nowrap">Reference Type</th>
                <th className="px-6 py-4 whitespace-nowrap">Reference ID</th>
                <th className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    Debit <ArrowUpDown size={14} className="text-orange-500" />
                  </div>
                </th>
                <th className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    Credit <ArrowUpDown size={14} className="text-green-500 rotate-180" />
                  </div>
                </th>
                <th className="px-6 py-4 whitespace-nowrap">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[13px] text-gray-400 font-medium">
                    {ledgerSource.length === 0 ? "No ledger entries yet" : "No ledger entries match the selected filters"}
                  </td>
                </tr>
              )}
              {filteredLedger.map((l, idx: number) => (
                <tr key={l.id ?? idx} className={`${idx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'} hover:bg-gray-50/50 transition-colors`}>
                  <td className="px-6 py-5 text-[13px] text-gray-400 font-medium">{l.date}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white ${['bg-orange-400', 'bg-blue-400', 'bg-purple-400', 'bg-green-400', 'bg-pink-400'][idx % 5]}`}>
                        {l.agent.charAt(0)}
                      </div>
                      <span className="text-[13px] font-bold text-gray-800">{l.agent}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[13px] text-gray-600 font-medium">{l.referenceType}</td>
                  <td className="px-6 py-5 text-[13px] text-gray-800 font-bold tracking-tight">{l.referenceId}</td>
                  <td className="px-6 py-5 text-[13px] font-bold text-gray-800">{l.debit}</td>
                  <td className="px-6 py-5 text-[13px] font-bold text-gray-800">{l.credit}</td>
                  <td className="px-6 py-5 text-[13px] font-black text-gray-900">{l.runningBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function FilterButton({ icon, label, onClick, isOpen }: FilterButtonProps) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl text-[13px] font-semibold min-w-[130px] justify-between shadow-sm hover:bg-gray-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </div>
        <ChevronDown size={14} strokeWidth={3} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}
