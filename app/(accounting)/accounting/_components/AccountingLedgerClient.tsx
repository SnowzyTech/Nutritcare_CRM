'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, MessageCircle, CalendarIcon, Copy, Trash2, Search, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const chartOfAccounts = [
  { type: 'Asset', description: 'What the business owns', instances: 'Cash, Bank, Stock, Receivables' },
  { type: 'Liability', description: 'What the business owes', instances: 'Supplier Payables, Agent Overpayments, VAT Payable' },
  { type: 'Equity', description: "Owner's stake in the business", instances: 'Capital, Retained Earnings' },
  { type: 'Revenue', description: 'Money earned', instances: 'Product Sales, Consultation Fees, Delivery Income' },
  { type: 'Expense', description: 'Money spent', instances: 'Salaries, Logistics, Office Costs' },
];

const generalLedgerData = [
  { account: 'Asset', description: 'What the business owns', debit: 'N200,000', credit: 'N300,000', balance: 'N100,000', date: '12 - 06 -26' },
  { account: 'Asset', description: 'What the business owes', debit: 'N300,000', credit: 'N200,000', balance: 'N100,000', date: '12 - 06 -26' },
  { account: 'Asset', description: 'What the business owns', debit: 'N200,000', credit: 'N300,000', balance: 'N100,000', date: '12 - 06 -26' },
  { account: 'Revenue', description: 'What the business owes', debit: 'N200,000', credit: 'N300,000', balance: 'N100,000', date: '12 - 06 -26' },
  { account: 'Asset', description: 'What the business owns', debit: 'N200,000', credit: 'N300,000', balance: 'N100,000', date: '12 - 06 -26' },
  { account: 'Expense', description: 'What the business owns', debit: 'N300,000', credit: 'N200,000', balance: 'N100,000', date: '12 - 06 -26' },
  { account: 'Liability', description: 'What the business owes', debit: 'N300,000', credit: 'N200,000', balance: 'N100,000', date: '12 - 06 -26' },
  { account: 'Expense', description: 'What the business owns', debit: 'N300,000', credit: 'N200,000', balance: 'N100,000', date: '12 - 06 -26' },
  { account: 'Revenue', description: 'What the business owes', debit: 'N200,000', credit: 'N300,000', balance: 'N100,000', date: '12 - 06 -26' },
  { account: 'Expense', description: 'What the business owns', debit: 'N300,000', credit: 'N200,000', balance: 'N100,000', date: '12 - 06 -26' },
  { account: 'Liability', description: 'What the business owes', debit: 'N200,000', credit: 'N300,000', balance: 'N100,000', date: '12 - 06 -26' },
];

interface JournalRow {
  account: string;
  debits: string;
  credits: string;
  description: string;
  name: string;
  tax: string;
}

interface SavedJournal {
  journalNo: string;
  date: string;
  rows: JournalRow[];
  totalDebits: string;
  totalCredits: string;
}

const tabs = ['Charts of Account', 'Journal Entry', 'Journal', 'General Ledger'] as const;
type TabType = typeof tabs[number];

const emptyRow = (): JournalRow => ({ account: '', debits: '', credits: '', description: '', name: '', tax: '' });

export function AccountingLedgerClient() {
  const [activeTab, setActiveTab] = useState<TabType>('Charts of Account');
  const [journalDate, setJournalDate] = useState<Date | undefined>(undefined);
  const [journalNo, setJournalNo] = useState('1001');
  const [rows, setRows] = useState<JournalRow[]>(Array.from({ length: 10 }, emptyRow));
  const [savedJournals, setSavedJournals] = useState<SavedJournal[]>([]);
  const [glSearch, setGlSearch] = useState('');
  const [glAccount, setGlAccount] = useState('All');
  const [accounts, setAccounts] = useState(chartOfAccounts);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [newType, setNewType] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInstances, setNewInstances] = useState('');

  const updateRow = (index: number, field: keyof JournalRow, value: string) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const copyRow = (index: number) => {
    setRows(prev => [...prev.slice(0, index + 1), { ...prev[index] }, ...prev.slice(index + 1)]);
  };

  const deleteRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const totalDebits = rows.reduce((sum, r) => sum + (parseFloat(r.debits) || 0), 0);
  const totalCredits = rows.reduce((sum, r) => sum + (parseFloat(r.credits) || 0), 0);

  const handleSave = () => {
    const hasData = rows.some(r => r.account || r.debits || r.credits);
    if (!hasData) return;
    const entry: SavedJournal = {
      journalNo: journalNo,
      date: journalDate ? format(journalDate, 'dd-MM-yyyy') : format(new Date(), 'dd-MM-yyyy'),
      rows: rows.filter(r => r.account || r.debits || r.credits),
      totalDebits: `N${totalDebits.toLocaleString()}.00`,
      totalCredits: `N${totalCredits.toLocaleString()}.00`,
    };
    setSavedJournals(prev => [...prev, entry]);
    setJournalNo(String(parseInt(journalNo) + 1));
    setRows(Array.from({ length: 10 }, emptyRow));
    setJournalDate(undefined);
    setActiveTab('Journal');
  };

  const filteredGL = generalLedgerData.filter(row => {
    const matchesAccount = glAccount === 'All' || row.account === glAccount;
    const matchesSearch = row.account.toLowerCase().includes(glSearch.toLowerCase()) || row.description.toLowerCase().includes(glSearch.toLowerCase());
    return matchesAccount && matchesSearch;
  });

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-[#FAFAFA] font-sans">
      {/* Navigation Controls */}
      <div className="flex items-center gap-3 mb-6">
        <button className="w-10 h-10 flex items-center justify-center text-[#AE00FF] bg-[#F3E8FF] rounded-full hover:bg-purple-200 transition-colors"><ChevronLeft size={20} strokeWidth={2.5} /></button>
        <button className="w-10 h-10 flex items-center justify-center text-[#AE00FF] bg-[#F3E8FF] rounded-full hover:bg-purple-200 transition-colors"><ChevronRight size={20} strokeWidth={2.5} /></button>
        <button className="w-10 h-10 flex items-center justify-center text-[#AE00FF] bg-[#F3E8FF] rounded-full hover:bg-purple-200 transition-colors ml-1"><RotateCcw size={18} strokeWidth={2.5} /></button>
      </div>

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 relative">
        <h1 className="text-[32px] font-bold text-gray-700 tracking-tight">
          {activeTab === 'Charts of Account' ? 'Accounting' : activeTab === 'Journal Entry' ? 'Journal Entry' : activeTab === 'Journal' ? 'Journal' : 'General Ledger'}
        </h1>
        <div className="flex bg-white rounded-lg p-1 border border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)] absolute left-1/2 -translate-x-1/2 z-10">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-md text-[12px] font-bold transition-all tracking-wide whitespace-nowrap ${activeTab === tab ? 'bg-[#AE00FF] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="w-16 h-16 bg-[#F3E8FF] rounded-full flex items-center justify-center ml-auto z-10 cursor-pointer">
          <div className="w-[42px] h-[42px] bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-105 transition-transform">
            <MessageCircle fill="currentColor" size={22} />
          </div>
        </div>
      </div>

      {/* ===== Charts of Account ===== */}
      {activeTab === 'Charts of Account' && (
        <div className="animate-in fade-in duration-400">
          <h2 className="text-[18px] font-bold text-gray-600 mb-6">Chart of Accounts</h2>
          <div className="bg-white rounded-xl overflow-hidden border border-gray-50">
            <table className="w-full text-left">
              <thead><tr className="bg-[#E5E7EB] text-[14px] font-bold text-gray-600"><th className="px-8 py-5">Type</th><th className="px-8 py-5">Description</th><th className="px-8 py-5">Instances</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {accounts.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                    <td className="px-8 py-6 text-[14px] text-gray-500 font-medium">{item.type}</td>
                    <td className="px-8 py-6 text-[14px] text-gray-500 font-medium">{item.description}</td>
                    <td className="px-8 py-6 text-[14px] text-gray-500 font-medium">{item.instances}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Manual Add Form */}
          {showManualAdd && (
            <div className="mt-6 bg-white rounded-xl border border-purple-100 p-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="text-[16px] font-bold text-gray-700 mb-4">Add New Account</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-gray-500">Type</label>
                  <input value={newType} onChange={e => setNewType(e.target.value)} placeholder="e.g. Asset" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-gray-500">Description</label>
                  <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="e.g. What the business owns" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-gray-500">Instances</label>
                  <input value={newInstances} onChange={e => setNewInstances(e.target.value)} placeholder="e.g. Cash, Bank" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-200" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { if (newType) { setAccounts(prev => [...prev, { type: newType, description: newDesc, instances: newInstances }]); setNewType(''); setNewDesc(''); setNewInstances(''); setShowManualAdd(false); } }} className="px-8 py-3 bg-[#AE00FF] text-white rounded-xl text-[13px] font-bold hover:bg-[#8B00CC] transition-colors">Add</button>
                <button onClick={() => { setShowManualAdd(false); setNewType(''); setNewDesc(''); setNewInstances(''); }} className="px-8 py-3 border border-gray-300 text-gray-500 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-8">
            <button className="px-10 py-3.5 border border-gray-300 text-gray-600 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-colors">Edit</button>
            <button onClick={() => setShowManualAdd(!showManualAdd)} className={`px-10 py-3.5 border border-[#AE00FF] text-[#AE00FF] rounded-xl text-[14px] font-bold hover:bg-purple-50 transition-colors ${showManualAdd ? 'bg-purple-50' : ''}`}>Manual Add</button>
            <button className="px-10 py-3.5 bg-[#AE00FF] text-white rounded-xl text-[14px] font-bold hover:bg-[#8B00CC] transition-colors shadow-lg shadow-purple-100">Import Excel</button>
          </div>
        </div>
      )}

      {/* ===== Journal Entry ===== */}
      {activeTab === 'Journal Entry' && (
        <div className="animate-in fade-in duration-400">
          {/* Top Controls */}
          <div className="flex items-center gap-4 mb-6">
            <Popover>
              <PopoverTrigger className="flex items-center gap-3 px-6 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-400 font-medium hover:border-purple-200 transition-colors w-[240px] justify-between">
                  {journalDate ? format(journalDate, 'dd/MM/yyyy') : 'Journal Date'}
                  <CalendarIcon size={18} className="text-gray-400" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                <Calendar mode="single" selected={journalDate} onSelect={setJournalDate} />
              </PopoverContent>
            </Popover>
            <div className="px-6 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-400 font-medium w-[240px]">
              Journal No : <span className="text-gray-700 font-bold">{journalNo}</span>
            </div>
            <div className="ml-auto">
              <button className="px-8 py-3.5 bg-gray-900 text-white rounded-xl text-[14px] font-bold hover:bg-gray-800 transition-colors">Import Excel</button>
            </div>
          </div>

          {/* Journal Entry Table */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-50 mb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-[#4A0A77] to-[#7B2FBF] text-white text-[13px] font-bold">
                  <th className="px-4 py-4 w-[50px]">#</th>
                  <th className="px-4 py-4">Account</th>
                  <th className="px-4 py-4">Debits</th>
                  <th className="px-4 py-4">Credits</th>
                  <th className="px-4 py-4">Description</th>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Tax</th>
                  <th className="px-4 py-4 w-[80px]"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-[13px] text-gray-400 font-medium border-r border-gray-100">{idx + 1}</td>
                    <td className="px-2 py-2 border-r border-gray-100"><input value={row.account} onChange={e => updateRow(idx, 'account', e.target.value)} className="w-full px-3 py-2 text-[13px] text-gray-700 bg-transparent border-0 focus:outline-none focus:bg-purple-50/50 rounded-lg transition-colors" placeholder="" /></td>
                    <td className="px-2 py-2 border-r border-gray-100"><input value={row.debits} onChange={e => updateRow(idx, 'debits', e.target.value)} className="w-full px-3 py-2 text-[13px] text-gray-700 bg-transparent border-0 focus:outline-none focus:bg-purple-50/50 rounded-lg transition-colors" placeholder="" /></td>
                    <td className="px-2 py-2 border-r border-gray-100"><input value={row.credits} onChange={e => updateRow(idx, 'credits', e.target.value)} className="w-full px-3 py-2 text-[13px] text-gray-700 bg-transparent border-0 focus:outline-none focus:bg-purple-50/50 rounded-lg transition-colors" placeholder="" /></td>
                    <td className="px-2 py-2 border-r border-gray-100"><input value={row.description} onChange={e => updateRow(idx, 'description', e.target.value)} className="w-full px-3 py-2 text-[13px] text-gray-700 bg-transparent border-0 focus:outline-none focus:bg-purple-50/50 rounded-lg transition-colors" placeholder="" /></td>
                    <td className="px-2 py-2 border-r border-gray-100"><input value={row.name} onChange={e => updateRow(idx, 'name', e.target.value)} className="w-full px-3 py-2 text-[13px] text-gray-700 bg-transparent border-0 focus:outline-none focus:bg-purple-50/50 rounded-lg transition-colors" placeholder="" /></td>
                    <td className="px-2 py-2 border-r border-gray-100"><input value={row.tax} onChange={e => updateRow(idx, 'tax', e.target.value)} className="w-full px-3 py-2 text-[13px] text-gray-700 bg-transparent border-0 focus:outline-none focus:bg-purple-50/50 rounded-lg transition-colors" placeholder="" /></td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyRow(idx)} className="text-gray-300 hover:text-purple-500 transition-colors"><Copy size={16} /></button>
                        <button onClick={() => deleteRow(idx)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Total Row */}
            <div className="flex items-center px-4 py-4 bg-[#F3F4F6] border-t border-gray-200">
              <span className="w-[50px]"></span>
              <span className="text-[14px] font-bold text-gray-600 w-[200px] px-4">Total</span>
              <span className="text-[14px] font-bold text-gray-700 w-[120px] px-4">N{totalDebits.toLocaleString()}.00</span>
              <span className="text-[14px] font-bold text-gray-700 w-[120px] px-4">N{totalCredits.toLocaleString()}.00</span>
            </div>
          </div>

          {/* Add / Clear Lines */}
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setRows(prev => [...prev, ...Array.from({ length: 5 }, emptyRow)])} className="px-8 py-3 border border-gray-300 text-gray-600 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-colors">Add Lines</button>
            <button onClick={() => setRows(Array.from({ length: 10 }, emptyRow))} className="px-8 py-3 border border-gray-300 text-gray-600 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-colors">Clear Lines</button>
          </div>

          {/* Attachment Area */}
          <div className="border border-dashed border-gray-200 rounded-2xl p-8 mb-8 flex flex-col items-center justify-center bg-white">
            <button className="text-[#AE00FF] text-[14px] font-bold hover:underline">Add Attachment</button>
            <p className="text-[12px] text-gray-400 mt-1">Max file size: 20 MB</p>
          </div>

          {/* Cancel / Save */}
          <div className="flex items-center justify-end gap-4">
            <button onClick={() => { setRows(Array.from({ length: 10 }, emptyRow)); setJournalDate(undefined); }} className="px-10 py-3.5 border border-gray-300 text-gray-600 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-10 py-3.5 bg-[#AE00FF] text-white rounded-xl text-[14px] font-bold hover:bg-[#8B00CC] transition-colors shadow-lg shadow-purple-100">Save</button>
          </div>
        </div>
      )}

      {/* ===== Journal (saved entries) ===== */}
      {activeTab === 'Journal' && (
        <div className="animate-in fade-in duration-400">
          {savedJournals.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-400 font-medium text-[16px]">No journal entries yet. Go to Journal Entry tab to create one.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {savedJournals.map((journal, jIdx) => (
                <div key={jIdx} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between px-8 py-5 bg-[#F9FAFB] border-b border-gray-100">
                    <div className="flex items-center gap-6">
                      <span className="text-[14px] font-bold text-gray-700">Journal No: <span className="text-[#AE00FF]">{journal.journalNo}</span></span>
                      <span className="text-[13px] text-gray-400 font-medium">Date: {journal.date}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] font-bold text-green-600">Debits: {journal.totalDebits}</span>
                      <span className="text-[13px] font-bold text-red-500">Credits: {journal.totalCredits}</span>
                    </div>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#4A0A77] to-[#7B2FBF] text-white text-[12px] font-bold">
                        <th className="px-6 py-3">#</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Debits</th><th className="px-4 py-3">Credits</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journal.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                          <td className="px-6 py-4 text-[13px] text-gray-400">{rIdx + 1}</td>
                          <td className="px-4 py-4 text-[13px] text-gray-700 font-medium">{row.account}</td>
                          <td className="px-4 py-4 text-[13px] text-gray-700">{row.debits}</td>
                          <td className="px-4 py-4 text-[13px] text-gray-700">{row.credits}</td>
                          <td className="px-4 py-4 text-[13px] text-gray-500">{row.description}</td>
                          <td className="px-4 py-4 text-[13px] text-gray-500">{row.name}</td>
                          <td className="px-4 py-4 text-[13px] text-gray-500">{row.tax}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== General Ledger ===== */}
      {activeTab === 'General Ledger' && (
        <div className="animate-in fade-in duration-400">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <Select value={glAccount} onValueChange={(val) => setGlAccount(val ?? 'All')}>
              <SelectTrigger className="w-[160px] rounded-full bg-[#AE00FF] text-white border-0 h-[42px] px-5 text-[13px] font-bold focus:ring-0 [&>svg]:text-white">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="All">All Accounts</SelectItem>
                <SelectItem value="Asset">Asset</SelectItem>
                <SelectItem value="Liability">Liability</SelectItem>
                <SelectItem value="Equity">Equity</SelectItem>
                <SelectItem value="Revenue">Revenue</SelectItem>
                <SelectItem value="Expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger className="flex items-center gap-2 px-5 py-2.5 bg-[#AE00FF] text-white rounded-full text-[13px] font-bold h-[42px]">
                  <CalendarIcon size={16} /> Date Range <ChevronDown size={14} />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                <Calendar mode="single" />
              </PopoverContent>
            </Popover>
            <div className="ml-auto relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" placeholder="search" value={glSearch} onChange={e => setGlSearch(e.target.value)}
                className="pl-10 pr-6 py-2.5 bg-white border border-gray-200 rounded-full text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-200 w-[250px] shadow-sm" />
            </div>
          </div>

          {/* General Ledger Table */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-50 mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#E5E7EB] text-[13px] font-bold text-gray-600">
                  <th className="px-6 py-4">Account</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Debit <ArrowUp size={12} className="inline text-green-500 ml-1" /></th>
                  <th className="px-6 py-4">Credit <ArrowDown size={12} className="inline text-red-500 ml-1" /></th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredGL.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                    <td className="px-6 py-5 text-[14px] text-gray-500 font-medium">{row.account}</td>
                    <td className="px-6 py-5 text-[14px] text-gray-500 font-medium">{row.description}</td>
                    <td className="px-6 py-5 text-[14px] text-gray-700 font-medium">{row.debit}</td>
                    <td className="px-6 py-5 text-[14px] text-gray-700 font-medium">{row.credit}</td>
                    <td className="px-6 py-5 text-[14px] text-gray-700 font-medium">{row.balance}</td>
                    <td className="px-6 py-5 text-[14px] text-gray-400 font-medium">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="px-8 py-3.5 bg-[#AE00FF] text-white rounded-xl text-[14px] font-bold hover:bg-[#8B00CC] transition-colors shadow-lg shadow-purple-100">Import Excel</button>
        </div>
      )}
    </div>
  );
}
