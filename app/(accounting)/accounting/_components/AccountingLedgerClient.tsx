'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, RotateCcw, MessageCircle,
  CalendarIcon, Copy, Trash2, Search, ChevronDown, ArrowUp, ArrowDown, X,
  FileText, Upload, Download,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createJournalEntryAction } from '@/modules/finance/actions/ledger.action';
import { createExpenseCategoryAction, addExpenseNamesToCategoryAction } from '@/modules/finance/actions/expenses.action';
import type { LedgerRow, ChartRow, CategoryForLedger } from '@/modules/finance/services/ledger.service';


// ── Types ─────────────────────────────────────────────────────────────────────

interface CategoryItem {
  id: string;
  name: string;
  financialStatement: string | null;
  expenseNames: { id: string; name: string }[];
}

interface JournalRow {
  code: string;
  account: string;
  accountId: string;
  name: string;
  debits: string;
  credits: string;
  description?: string;
  tax: string;
  // UI-only search state
  codeSearch: string;
  accountSearch: string;
  nameSearch: string;
}

interface SavedJournal {
  journalNo: string;
  date: string;
  rows: JournalRow[];
  totalDebits: string;
  totalCredits: string;
}

interface AccountingLedgerClientProps {
  initialChartOfAccounts?: ChartRow[];
  initialSavedJournals?: SavedJournal[];
  initialNextJournalNo?: string;
  initialGeneralLedger?: LedgerRow[];
  initialCategories?: CategoryForLedger[];
}

const TABS = ['Charts of Account', 'Journal Entry', 'Journal', 'General Ledger', 'Fixed Assets'] as const;
type Tab = typeof TABS[number];

type AttachmentItem = { file: File; preview: string };

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const getDownloadUrl = (url: string) => url.replace('/upload/', '/upload/fl_attachment/');
const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp)/i.test(url) || (url.includes('/image/upload/') && !url.endsWith('.pdf'));
const isPdfUrl = (url: string) => /\.pdf/i.test(url) || url.includes('/raw/upload/');

const emptyRow = (): JournalRow => ({
  code: '', account: '', accountId: '', name: '', debits: '', credits: '', tax: '',
  codeSearch: '', accountSearch: '', nameSearch: '',
});

// ── Fixed-asset types ─────────────────────────────────────────────────────────

interface FixedAsset {
  id: string;
  assetName: string;
  purchasePrice: string;
  purchaseDate: string;
  assetAccount: string;
  accumulatedDepreciation: string;
  remainingValue: string;
  status: 'Active' | 'Disposed' | 'Idle';
}

const SEED_ASSETS: FixedAsset[] = [
  {
    id: '1',
    assetName: 'Dell Latitude Laptop',
    purchasePrice: '₦1,250,000',
    purchaseDate: '15-Mar-2023',
    assetAccount: 'Office Equipment',
    accumulatedDepreciation: '₦500,000',
    remainingValue: '₦750,000',
    status: 'Active',
  },
  {
    id: '2',
    assetName: 'Dell Latitude Laptop',
    purchasePrice: '₦1,250,000',
    purchaseDate: '15-Mar-2023',
    assetAccount: 'Office Equipment',
    accumulatedDepreciation: '₦500,000',
    remainingValue: '₦750,000',
    status: 'Active',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function AccountingLedgerClient({
  initialChartOfAccounts = [],
  initialSavedJournals = [],
  initialNextJournalNo = '1001',
  initialGeneralLedger = [],
  initialCategories = [],
}: AccountingLedgerClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Tab state (URL-persisted) ──────────────────────────────────────────────
  const tabParam = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTabState] = useState<Tab>(
    tabParam && (TABS as readonly string[]).includes(tabParam) ? tabParam as Tab : 'Charts of Account'
  );

  const setActiveTab = (tab: Tab) => {
    setActiveTabState(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false } as any);
  };

  // ── Fixed Assets state ────────────────────────────────────────────────────
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>(SEED_ASSETS);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [newAsset, setNewAsset] = useState<Omit<FixedAsset, 'id'>>({
    assetName: '', purchasePrice: '', purchaseDate: '',
    assetAccount: '', accumulatedDepreciation: '', remainingValue: '', status: 'Active',
  });

  const handleAddAsset = () => {
    router.push('/accounting/accounting-ledger/fixed-assets/add');
  };

  // ── Chart of Accounts ──────────────────────────────────────────────────────
  const [chartAccounts, setChartAccounts] = useState<ChartRow[]>(initialChartOfAccounts);
  const [categories, setCategories] = useState<CategoryForLedger[]>(initialCategories);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [isAddingNewType, setIsAddingNewType] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [newFinancialStatement, setNewFinancialStatement] = useState('');
  const [accountNameInputs, setAccountNameInputs] = useState<string[]>(['']);
  const [savingAccount, setSavingAccount] = useState(false);

  const resetForm = () => {
    setSelectedCategoryId('');
    setNewTypeName('');
    setNewFinancialStatement('');
    setAccountNameInputs(['']);
    setIsAddingNewType(false);
    setShowManualAdd(false);
  };

  const handleAddAccount = async () => {
    const validNames = accountNameInputs.filter(n => n.trim());

    if (isAddingNewType) {
      const finalType = newTypeName.trim();
      if (!finalType) return;

      setSavingAccount(true);
      const res = await createExpenseCategoryAction(finalType, newFinancialStatement, validNames);
      setSavingAccount(false);
      if ('error' in res) { alert(res.error); return; }

      const newCategory: CategoryForLedger = {
        id: res.id,
        name: res.name,
        financialStatement: res.financialStatement ?? null,
        expenseNames: res.expenseNames ?? [],
      };
      setCategories(prev => [...prev, newCategory]);

      const baseCode = chartAccounts.length + 1000;
      const newRows: ChartRow[] = (res.expenseNames ?? []).map((n, i) => ({
        code: String(baseCode + i + 1),
        categoryId: res.id,
        categoryName: res.name,
        financialStatement: res.financialStatement ?? '',
        accountName: n.name,
        accountNameId: n.id,
      }));
      if (newRows.length > 0) setChartAccounts(prev => [...prev, ...newRows]);
    } else {
      if (!selectedCategoryId || validNames.length === 0) return;

      setSavingAccount(true);
      const res = await addExpenseNamesToCategoryAction(selectedCategoryId, validNames);
      setSavingAccount(false);
      if ('error' in res) { alert(res.error); return; }

      const cat = categories.find(c => c.id === selectedCategoryId);
      const baseCode = chartAccounts.length + 1000;
      const newRows: ChartRow[] = (res.names ?? []).map((n, i) => ({
        code: String(baseCode + i + 1),
        categoryId: selectedCategoryId,
        categoryName: cat?.name ?? '',
        financialStatement: cat?.financialStatement ?? '',
        accountName: n.name,
        accountNameId: n.id,
      }));
      if (newRows.length > 0) setChartAccounts(prev => [...prev, ...newRows]);

      setCategories(prev => prev.map(c =>
        c.id === selectedCategoryId
          ? { ...c, expenseNames: [...c.expenseNames, ...(res.names ?? [])] }
          : c
      ));
    }

    resetForm();
  };

  // ── Journal Entry ──────────────────────────────────────────────────────────
  const [journalDate, setJournalDate] = useState<Date | undefined>(undefined);
  const [journalNo, setJournalNo] = useState(initialNextJournalNo);
  const [rows, setRows] = useState<JournalRow[]>(Array.from({ length: 10 }, emptyRow));
  const [saving, setSaving] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<{ idx: number; field: 'code' | 'account' | 'name' } | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newItems: AttachmentItem[] = Array.from(e.target.files).map(file => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      }));
      setAttachments(prev => [...prev, ...newItems]);
      e.target.value = '';
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => {
      const item = prev[idx];
      if (item.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const uploadJournalFiles = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    const res = await fetch('/api/upload/expense', { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'File upload failed');
    }
    const { urls } = await res.json();
    return urls as string[];
  };

  const updateRow = (index: number, field: keyof JournalRow, value: string) => {
    // Restrict Debits, Credits, and Tax to numeric input only
    if (['debits', 'credits', 'tax'].includes(field)) {
      if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;
    }
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const copyRow = (index: number) =>
    setRows(prev => [...prev.slice(0, index + 1), { ...prev[index] }, ...prev.slice(index + 1)]);

  const deleteRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const totalDebits = rows.reduce((s, r) => s + (parseFloat(r.debits) || 0), 0);
  const totalCredits = rows.reduce((s, r) => s + (parseFloat(r.credits) || 0), 0);

  // ── Saved Journals ─────────────────────────────────────────────────────────
  const [savedJournals, setSavedJournals] = useState<SavedJournal[]>(initialSavedJournals);

  const handleSave = async () => {
    const validRows = rows.filter(r => r.account.trim());
    if (validRows.length === 0) {
      alert('Add at least one row with an account');
      return;
    }
    setSaving(true);
    let uploadedUrls: string[] = [];
    try {
      uploadedUrls = await uploadJournalFiles(attachments.map(a => a.file));
    } catch (err: any) {
      setSaving(false);
      alert(err.message ?? 'File upload failed');
      return;
    }
    const res = await createJournalEntryAction({
      date: journalDate ?? new Date(),
      rows: validRows.map(r => ({
        account: r.account,
        debits: parseFloat(r.debits) || 0,
        credits: parseFloat(r.credits) || 0,
        description: '',
        name: r.name,
        tax: parseFloat(r.tax) || 0,
      })),
      attachmentUrls: uploadedUrls,
    });
    setSaving(false);
    if ('error' in res) { alert(res.error); return; }
    const newJournal: SavedJournal = {
      journalNo: res.journalNo!,
      date: journalDate ? format(journalDate, 'dd-MM-yyyy') : format(new Date(), 'dd-MM-yyyy'),
      rows: validRows,
      totalDebits: `N${totalDebits.toLocaleString()}.00`,
      totalCredits: `N${totalCredits.toLocaleString()}.00`,
    };
    setSavedJournals(prev => [newJournal, ...prev]);
    setJournalNo(String(parseInt(res.journalNo!) + 1));
    setRows(Array.from({ length: 10 }, emptyRow));
    setJournalDate(undefined);
    setAttachments(prev => { prev.forEach(a => { if (a.preview) URL.revokeObjectURL(a.preview); }); return []; });
    router.refresh();
    setActiveTab('Journal');
  };

  // ── General Ledger ─────────────────────────────────────────────────────────
  const [glSearch, setGlSearch] = useState('');
  const [glAccount, setGlAccount] = useState('All');
  const [glDateFrom, setGlDateFrom] = useState<Date | undefined>();
  const [glDateTo, setGlDateTo] = useState<Date | undefined>();

  // Derive General Ledger from Saved Journals
  const allGlEntries = useMemo(() => {
    const entries: LedgerRow[] = [];
    savedJournals.forEach(j => {
      j.rows.forEach((row: any) => {
        if (!row.account) return;
        entries.push({
          account: row.account,
          description: j.journalNo,
          ref: j.journalNo,
          debit: row.debits ? `₦${parseFloat(row.debits).toLocaleString()}` : '—',
          credit: row.credits ? `₦${parseFloat(row.credits).toLocaleString()}` : '—',
          balance: '—', 
          date: j.date
        });
      });
    });
    return [...entries, ...initialGeneralLedger];
  }, [savedJournals, initialGeneralLedger]);

  const filteredGL = allGlEntries.filter(row => {
    const matchesAccount = glAccount === 'All' || row.account === glAccount;
    const matchesSearch =
      !glSearch ||
      row.account.toLowerCase().includes(glSearch.toLowerCase()) ||
      row.description.toLowerCase().includes(glSearch.toLowerCase()) ||
      row.ref.toLowerCase().includes(glSearch.toLowerCase());
    
    const dateParts = row.date.split('-');
    const rowDate = dateParts.length === 3 ? new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`) : new Date(row.date);
    
    const matchesFrom = !glDateFrom || rowDate >= glDateFrom;
    const matchesTo = !glDateTo || rowDate <= glDateTo;
    return matchesAccount && matchesSearch && matchesFrom && matchesTo;
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-[#FAFAFA] font-sans">
      {/* Navigation Controls */}
      <div className="flex items-center gap-3 mb-6">
        <button className="w-10 h-10 flex items-center justify-center text-[#AE00FF] bg-[#F3E8FF] rounded-full hover:bg-purple-200 transition-colors">
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-[#AE00FF] bg-[#F3E8FF] rounded-full hover:bg-purple-200 transition-colors">
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-[#AE00FF] bg-[#F3E8FF] rounded-full hover:bg-purple-200 transition-colors ml-1">
          <RotateCcw size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Header Row — matches image: title left | tabs centre | Add New + chat right */}
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex items-center justify-between">
          <h1 className="text-[32px] font-bold text-gray-700 tracking-tight">
            {activeTab === 'Charts of Account' ? 'Accounting' :
              activeTab === 'Journal Entry' ? 'Journal Entry' :
                activeTab === 'Journal' ? 'Journal' :
                  activeTab === 'General Ledger' ? 'General Ledger' : 'Fixed assets'}
          </h1>

          <div className="flex items-center gap-3">
            {/* Tab pills */}
            <div className="flex bg-white rounded-lg p-1 border border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-[12px] font-bold transition-all tracking-wide whitespace-nowrap ${
                    activeTab === tab ? 'bg-[#AE00FF] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Add New — only visible on Fixed Assets tab */}
            {activeTab === 'Fixed Assets' && (
              <button
                id="fixed-asset-add-new-btn"
                onClick={handleAddAsset}
                className="h-10 px-6 bg-[#AE00FF] text-white rounded-lg text-[13px] font-bold hover:bg-[#9900E6] transition-colors shadow-sm shadow-purple-200 whitespace-nowrap"
              >
                Add New
              </button>
            )}

            {/* Chat bubble */}
            <div className="w-12 h-12 bg-[#F3E8FF] rounded-full flex items-center justify-center cursor-pointer flex-shrink-0">
              <div className="w-[34px] h-[34px] bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-105 transition-transform">
                <MessageCircle fill="currentColor" size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Charts of Account ===== */}
      {activeTab === 'Charts of Account' && (
        <div className="animate-in fade-in duration-400">
          <h2 className="text-[18px] font-bold text-gray-600 mb-6">Chart of Accounts</h2>

          {chartAccounts.length === 0 ? (
            <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-400 text-[15px]">No account names yet. Use &ldquo;Manual Add&rdquo; to create categories and account names.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl overflow-hidden border border-gray-50">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#E5E7EB] text-[14px] font-bold text-gray-600">
                    <th className="px-8 py-5">Code</th>
                    <th className="px-8 py-5">Category</th>
                    <th className="px-8 py-5">Financial Statement</th>
                    <th className="px-8 py-5">Account Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {chartAccounts.map((item, idx) => (
                    <tr key={item.accountNameId || idx} className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                      <td className="px-8 py-6 text-[14px] text-gray-500 font-mono font-medium">{item.code}</td>
                      <td className="px-8 py-6 text-[14px] text-gray-700 font-medium">{item.categoryName}</td>
                      <td className="px-8 py-6 text-[14px] text-gray-500">{item.financialStatement || '—'}</td>
                      <td className="px-8 py-6 text-[14px] text-gray-700 font-semibold">{item.accountName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showManualAdd && (
            <div className="mt-6 bg-white rounded-xl border border-purple-100 p-8 animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl shadow-purple-50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[18px] font-bold text-gray-700">Add Account Entry</h3>
                <button onClick={() => setShowManualAdd(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Expense Category</label>
                    <Select
                      value={isAddingNewType ? "ADD_NEW" : selectedCategoryId}
                      onValueChange={(val) => {
                        if (val === "ADD_NEW") {
                          setIsAddingNewType(true);
                          setSelectedCategoryId('');
                        } else {
                          setIsAddingNewType(false);
                          setSelectedCategoryId(val ?? '');
                        }
                      }}
                    >
                      <SelectTrigger className="w-full h-[52px] px-5 bg-gray-50 border-0 rounded-2xl text-[14px] font-medium text-gray-700 focus:ring-2 focus:ring-purple-200">
                        <SelectValue placeholder="Select existing category..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-purple-50 shadow-xl">
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id} className="rounded-xl py-3 px-4 focus:bg-purple-50">
                            {c.name}
                          </SelectItem>
                        ))}
                        <div className="h-px bg-gray-100 my-1" />
                        <SelectItem value="ADD_NEW" className="rounded-xl py-3 px-4 text-purple-600 font-bold focus:bg-purple-50">
                          + Add New Category
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isAddingNewType && (
                    <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                      <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">New Category Name</label>
                      <input
                        value={newTypeName}
                        onChange={e => setNewTypeName(e.target.value)}
                        placeholder="e.g. Operating Expense"
                        className="w-full h-[52px] px-5 bg-gray-50 border-0 rounded-2xl text-[14px] font-medium text-gray-700 focus:ring-2 focus:ring-purple-200"
                      />
                    </div>
                  )}
                </div>

                {isAddingNewType && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Financial Statement</label>
                    <Select value={newFinancialStatement} onValueChange={(val) => setNewFinancialStatement(val ?? '')}>
                      <SelectTrigger className="w-full h-[52px] px-5 bg-gray-50 border-0 rounded-2xl text-[14px] font-medium text-gray-700 focus:ring-2 focus:ring-purple-200">
                        <SelectValue placeholder="Select financial statement..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-purple-50 shadow-xl">
                        <SelectItem value="Profit & Loss Statement" className="rounded-xl py-3 px-4 focus:bg-purple-50">Profit &amp; Loss Statement</SelectItem>
                        <SelectItem value="Balance Sheet" className="rounded-xl py-3 px-4 focus:bg-purple-50">Balance Sheet</SelectItem>
                        <SelectItem value="Cash Flow Statement" className="rounded-xl py-3 px-4 focus:bg-purple-50">Cash Flow Statement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!isAddingNewType && selectedCategoryId && (() => {
                  const existing = categories.find(c => c.id === selectedCategoryId);
                  return existing ? (
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 animate-in fade-in duration-300">
                      {existing.financialStatement && (
                        <p className="text-[11px] font-bold text-purple-500 uppercase tracking-tight mb-2">
                          Financial Statement: {existing.financialStatement}
                        </p>
                      )}
                      <p className="text-[12px] font-bold text-purple-700 uppercase tracking-tight mb-1">Existing Account Names:</p>
                      <p className="text-[14px] text-purple-900 font-medium italic">
                        {existing.expenseNames.map(n => n.name).join(', ') || 'No names added yet'}
                      </p>
                      <p className="text-[11px] text-purple-400 mt-2">Add more below to append to this category.</p>
                    </div>
                  ) : null;
                })()}

                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Account Name(s)</label>
                  <div className="space-y-3">
                    {accountNameInputs.map((input, idx) => (
                      <div key={idx} className="flex gap-3 animate-in fade-in duration-200">
                        <input
                          value={input}
                          onChange={e => {
                            const next = [...accountNameInputs];
                            next[idx] = e.target.value;
                            setAccountNameInputs(next);
                          }}
                          placeholder="Enter account name..."
                          className="flex-1 h-[52px] px-5 bg-gray-50 border-0 rounded-2xl text-[14px] font-medium text-gray-700 focus:ring-2 focus:ring-purple-200"
                        />
                        {idx === accountNameInputs.length - 1 && (
                          <button
                            onClick={() => setAccountNameInputs([...accountNameInputs, ''])}
                            className="w-[52px] h-[52px] flex items-center justify-center bg-purple-50 text-purple-600 rounded-2xl hover:bg-purple-100 transition-colors"
                          >
                            <ArrowUp size={20} className="rotate-90" /> {/* Using Lucide arrow for plus-like feel if needed, or better use ChevronDown or just a label */}
                            <span className="font-bold text-[20px]">+</span>
                          </button>
                        )}
                        {accountNameInputs.length > 1 && (
                          <button
                            onClick={() => setAccountNameInputs(accountNameInputs.filter((_, i) => i !== idx))}
                            className="w-[52px] h-[52px] flex items-center justify-center bg-red-50 text-red-400 rounded-2xl hover:bg-red-100 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                  <button
                    onClick={handleAddAccount}
                    disabled={savingAccount}
                    className="flex-1 py-4 bg-[#AE00FF] text-white rounded-2xl text-[15px] font-bold hover:bg-[#8B00CC] transition-all shadow-lg shadow-purple-100 active:scale-[0.98] disabled:opacity-50"
                  >
                    {savingAccount ? 'Saving…' : 'Confirm & Save'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-10 py-4 border border-gray-200 text-gray-400 rounded-2xl text-[15px] font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-8">
            <button className="px-10 py-3.5 border border-gray-300 text-gray-600 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-colors">
              Edit
            </button>
            <button
              onClick={() => setShowManualAdd(!showManualAdd)}
              className={`px-10 py-3.5 border border-[#AE00FF] text-[#AE00FF] rounded-xl text-[14px] font-bold hover:bg-purple-50 transition-colors ${showManualAdd ? 'bg-purple-50' : ''}`}
            >
              Manual Add
            </button>
            <button className="px-10 py-3.5 bg-[#AE00FF] text-white rounded-xl text-[14px] font-bold hover:bg-[#8B00CC] transition-colors shadow-lg shadow-purple-100">
              Import Excel
            </button>
          </div>
        </div>
      )}

      {/* ===== Journal Entry ===== */}
      {activeTab === 'Journal Entry' && (
        <div className="animate-in fade-in duration-400">
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
              <button className="px-8 py-3.5 bg-gray-900 text-white rounded-xl text-[14px] font-bold hover:bg-gray-800 transition-colors">
                Import Excel
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden border border-gray-50 mb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-[#4A0A77] to-[#7B2FBF] text-white text-[13px] font-bold">
                  <th className="px-4 py-4 w-[40px]">#</th>
                  <th className="px-4 py-4 w-[110px]">Code</th>
                  <th className="px-4 py-4">Account Type</th>
                  <th className="px-4 py-4">Account Name</th>
                  <th className="px-4 py-4 w-[100px]">Debits</th>
                  <th className="px-4 py-4 w-[100px]">Credits</th>
                  <th className="px-4 py-4 w-[80px]">Tax</th>
                  <th className="px-4 py-4 w-[70px]"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const isCodeOpen = openDropdown?.idx === idx && openDropdown?.field === 'code';
                  const isAccountOpen = openDropdown?.idx === idx && openDropdown?.field === 'account';
                  const isNameOpen = openDropdown?.idx === idx && openDropdown?.field === 'name';
                  const availableNames = chartAccounts.filter(a => a.categoryId === row.accountId);
                  const filteredCodes = chartAccounts.filter(a =>
                    !row.codeSearch || a.code.includes(row.codeSearch) || a.accountName.toLowerCase().includes(row.codeSearch.toLowerCase())
                  );
                  const filteredAccounts = categories.filter(c =>
                    !row.accountSearch || c.name.toLowerCase().includes(row.accountSearch.toLowerCase())
                  );
                  const filteredNames = availableNames.filter(a =>
                    !row.nameSearch || a.accountName.toLowerCase().includes(row.nameSearch.toLowerCase())
                  );

                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-[13px] text-gray-400 font-medium border-r border-gray-100">{idx + 1}</td>

                      {/* Code — searchable select */}
                      <td className="px-2 py-2 border-r border-gray-100 relative">
                        <input
                          value={isCodeOpen ? row.codeSearch : row.code}
                          onChange={e => updateRow(idx, 'codeSearch', e.target.value)}
                          onFocus={() => { updateRow(idx, 'codeSearch', ''); setOpenDropdown({ idx, field: 'code' }); }}
                          onBlur={() => setTimeout(() => setOpenDropdown(prev => prev?.idx === idx && prev?.field === 'code' ? null : prev), 150)}
                          placeholder="Code"
                          className="w-full px-3 py-2 text-[13px] font-mono text-gray-700 bg-transparent border-0 focus:outline-none focus:bg-purple-50/50 rounded-lg transition-colors"
                        />
                        {isCodeOpen && filteredCodes.length > 0 && (
                          <div className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl min-w-[260px] max-h-[200px] overflow-y-auto">
                            {filteredCodes.map(a => (
                              <div
                                key={a.accountNameId}
                                onMouseDown={() => {
                                  setRows(prev => prev.map((r, i) => i === idx ? {
                                    ...r, code: a.code, account: a.categoryName, accountId: a.categoryId, name: a.accountName,
                                    codeSearch: '', accountSearch: '', nameSearch: '',
                                  } : r));
                                  setOpenDropdown(null);
                                }}
                                className="px-4 py-2.5 text-[12px] hover:bg-purple-50 cursor-pointer flex items-center gap-3"
                              >
                                <span className="font-mono font-bold text-purple-700 w-[48px]">{a.code}</span>
                                <span className="text-gray-600">{a.accountName}</span>
                                <span className="text-gray-400 text-[11px] ml-auto">{a.categoryName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Account Type — searchable select */}
                      <td className="px-2 py-2 border-r border-gray-100 relative">
                        <input
                          value={isAccountOpen ? row.accountSearch : row.account}
                          onChange={e => updateRow(idx, 'accountSearch', e.target.value)}
                          onFocus={() => { updateRow(idx, 'accountSearch', ''); setOpenDropdown({ idx, field: 'account' }); }}
                          onBlur={() => setTimeout(() => setOpenDropdown(prev => prev?.idx === idx && prev?.field === 'account' ? null : prev), 150)}
                          placeholder="Select account type…"
                          className="w-full px-3 py-2 text-[13px] text-gray-700 bg-transparent border-0 focus:outline-none focus:bg-purple-50/50 rounded-lg transition-colors"
                        />
                        {isAccountOpen && filteredAccounts.length > 0 && (
                          <div className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl min-w-[220px] max-h-[200px] overflow-y-auto">
                            {filteredAccounts.map(cat => (
                              <div
                                key={cat.id}
                                onMouseDown={() => {
                                  setRows(prev => prev.map((r, i) => i === idx ? {
                                    ...r, account: cat.name, accountId: cat.id, name: '', code: '',
                                    accountSearch: '', codeSearch: '', nameSearch: '',
                                  } : r));
                                  setOpenDropdown(null);
                                }}
                                className="px-4 py-2.5 text-[13px] hover:bg-purple-50 cursor-pointer"
                              >
                                <span className="font-medium text-gray-700">{cat.name}</span>
                                {cat.financialStatement && (
                                  <span className="text-[11px] text-gray-400 block">{cat.financialStatement}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Account Name — filtered by selected category */}
                      <td className="px-2 py-2 border-r border-gray-100 relative">
                        {row.accountId ? (
                          <>
                            <input
                              value={isNameOpen ? row.nameSearch : row.name}
                              onChange={e => updateRow(idx, 'nameSearch', e.target.value)}
                              onFocus={() => { updateRow(idx, 'nameSearch', ''); setOpenDropdown({ idx, field: 'name' }); }}
                              onBlur={() => setTimeout(() => setOpenDropdown(prev => prev?.idx === idx && prev?.field === 'name' ? null : prev), 150)}
                              placeholder="Select account name…"
                              className="w-full px-3 py-2 text-[13px] text-gray-700 bg-transparent border-0 focus:outline-none focus:bg-purple-50/50 rounded-lg transition-colors"
                            />
                            {isNameOpen && filteredNames.length > 0 && (
                              <div className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl min-w-[200px] max-h-[200px] overflow-y-auto">
                                {filteredNames.map(a => (
                                  <div
                                    key={a.accountNameId}
                                    onMouseDown={() => {
                                      setRows(prev => prev.map((r, i) => i === idx ? {
                                        ...r, name: a.accountName, code: a.code, nameSearch: '',
                                      } : r));
                                      setOpenDropdown(null);
                                    }}
                                    className="px-4 py-2.5 text-[13px] hover:bg-purple-50 cursor-pointer flex items-center justify-between"
                                  >
                                    <span className="text-gray-700">{a.accountName}</span>
                                    <span className="font-mono text-[11px] text-purple-600">{a.code}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {isNameOpen && filteredNames.length === 0 && (
                              <div className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl min-w-[200px] px-4 py-3 text-[12px] text-gray-400">
                                No account names found
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="px-3 py-2 text-[12px] text-gray-300 italic block">Select type first</span>
                        )}
                      </td>

                      <td className="px-2 py-2 border-r border-gray-100">
                        <input type="text" inputMode="numeric" value={row.debits} onChange={e => updateRow(idx, 'debits', e.target.value)} className="w-full px-3 py-2 text-[13px] text-gray-700 bg-transparent border-0 focus:outline-none focus:bg-purple-50/50 rounded-lg transition-colors" placeholder="0" />
                      </td>
                      <td className="px-2 py-2 border-r border-gray-100">
                        <input type="text" inputMode="numeric" value={row.credits} onChange={e => updateRow(idx, 'credits', e.target.value)} className="w-full px-3 py-2 text-[13px] text-gray-700 bg-transparent border-0 focus:outline-none focus:bg-purple-50/50 rounded-lg transition-colors" placeholder="0" />
                      </td>
                      <td className="px-2 py-2 border-r border-gray-100">
                        <input type="text" inputMode="numeric" value={row.tax} onChange={e => updateRow(idx, 'tax', e.target.value)} className="w-full px-3 py-2 text-[13px] text-gray-700 bg-transparent border-0 focus:outline-none focus:bg-purple-50/50 rounded-lg transition-colors" placeholder="0" />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => copyRow(idx)} className="text-gray-300 hover:text-purple-500 transition-colors">
                            <Copy size={16} />
                          </button>
                          <button onClick={() => deleteRow(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#F3F4F6] border-t border-gray-200">
                  <td colSpan={4} className="px-6 py-4 text-[14px] font-bold text-gray-600 text-right">Total</td>
                  <td className="px-5 py-4 text-[14px] font-bold text-gray-700">₦{totalDebits.toLocaleString()}.00</td>
                  <td className="px-5 py-4 text-[14px] font-bold text-gray-700">₦{totalCredits.toLocaleString()}.00</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setRows(prev => [...prev, ...Array.from({ length: 5 }, emptyRow)])}
              className="px-8 py-3 border border-gray-300 text-gray-600 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-colors"
            >
              Add Lines
            </button>
            <button
              onClick={() => setRows(Array.from({ length: 10 }, emptyRow))}
              className="px-8 py-3 border border-gray-300 text-gray-600 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-colors"
            >
              Clear Lines
            </button>
          </div>

          <div className="border border-dashed border-gray-200 rounded-2xl bg-white mb-8 overflow-hidden">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
            {/* File list */}
            {attachments.length > 0 && (
              <div className="p-4 space-y-2 border-b border-gray-100">
                {attachments.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    {item.preview ? (
                      <img src={item.preview} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-red-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-700 truncate">{item.file.name}</p>
                      <p className="text-[11px] text-gray-400">{formatFileSize(item.file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Upload trigger */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-8 cursor-pointer hover:bg-gray-50/50 transition-all"
            >
              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                <Upload size={18} className="text-[#AE00FF]" />
              </div>
              <span className="text-[#AE00FF] text-[14px] font-bold">
                {attachments.length > 0 ? 'Add More Files' : 'Add Attachments'}
              </span>
              <p className="text-[12px] text-gray-400">Images · PDF · Docs · Max 20 MB each</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => { setRows(Array.from({ length: 10 }, emptyRow)); setJournalDate(undefined); setAttachments(prev => { prev.forEach(a => { if (a.preview) URL.revokeObjectURL(a.preview); }); return []; }); }}
              className="px-10 py-3.5 border border-gray-300 text-gray-600 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-10 py-3.5 bg-[#AE00FF] text-white rounded-xl text-[14px] font-bold hover:bg-[#8B00CC] transition-colors shadow-lg shadow-purple-100 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* ===== Journal (saved entries) ===== */}
      {activeTab === 'Journal' && (
        <div className="animate-in fade-in duration-400">
          {savedJournals.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-400 font-medium text-[16px]">
                No journal entries yet. Go to Journal Entry tab to create one.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {savedJournals.map((journal, jIdx) => (
                <div key={jIdx} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between px-8 py-5 bg-[#F9FAFB] border-b border-gray-100">
                    <div className="flex items-center gap-6">
                      <span className="text-[14px] font-bold text-gray-700">
                        Journal No: <span className="text-[#AE00FF]">{journal.journalNo}</span>
                      </span>
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
                        <th className="px-6 py-3">#</th>
                        <th className="px-4 py-3">Account</th>
                        <th className="px-4 py-3">Debits</th>
                        <th className="px-4 py-3">Credits</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journal.rows
                        .filter(r => r.account)
                        .map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                            <td className="px-6 py-4 text-[13px] text-gray-400">{rIdx + 1}</td>
                            <td className="px-4 py-4 text-[13px] text-gray-700 font-medium">{row.account}</td>
                            <td className="px-4 py-4 text-[13px] text-gray-700">{row.debits || '—'}</td>
                            <td className="px-4 py-4 text-[13px] text-gray-700">{row.credits || '—'}</td>
                            <td className="px-4 py-4 text-[13px] text-gray-500">{row.description || '—'}</td>
                            <td className="px-4 py-4 text-[13px] text-gray-500">{row.name || '—'}</td>
                            <td className="px-4 py-4 text-[13px] text-gray-500">{row.tax || '—'}</td>
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
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            {/* Account filter */}
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

            {/* Date from */}
            <Popover>
              <PopoverTrigger className="flex items-center gap-2 px-5 py-2.5 bg-[#AE00FF] text-white rounded-full text-[13px] font-bold h-[42px]">
                <CalendarIcon size={16} />
                {glDateFrom ? format(glDateFrom, 'dd/MM/yy') : 'From'}
                {glDateFrom && (
                  <button onClick={(e) => { e.stopPropagation(); setGlDateFrom(undefined); }} className="ml-1 text-white/70 hover:text-white">
                    <X size={12} />
                  </button>
                )}
                <ChevronDown size={14} />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                <Calendar mode="single" selected={glDateFrom} onSelect={setGlDateFrom} />
              </PopoverContent>
            </Popover>

            {/* Date to */}
            <Popover>
              <PopoverTrigger className="flex items-center gap-2 px-5 py-2.5 bg-[#AE00FF] text-white rounded-full text-[13px] font-bold h-[42px]">
                <CalendarIcon size={16} />
                {glDateTo ? format(glDateTo, 'dd/MM/yy') : 'To'}
                {glDateTo && (
                  <button onClick={(e) => { e.stopPropagation(); setGlDateTo(undefined); }} className="ml-1 text-white/70 hover:text-white">
                    <X size={12} />
                  </button>
                )}
                <ChevronDown size={14} />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                <Calendar mode="single" selected={glDateTo} onSelect={setGlDateTo} />
              </PopoverContent>
            </Popover>

            {/* Search */}
            <div className="ml-auto relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                placeholder="Search account, description, ref…"
                value={glSearch}
                onChange={e => setGlSearch(e.target.value)}
                className="pl-10 pr-6 py-2.5 bg-white border border-gray-200 rounded-full text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-200 w-[280px] shadow-sm"
              />
            </div>
          </div>

          {/* General Ledger Table */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-50 mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 text-[13px] font-bold text-gray-600 border-b border-gray-100">
                  <th className="px-8 py-5">Account</th>
                  <th className="px-8 py-5">Description</th>
                  <th className="px-8 py-5">Ref</th>
                  <th className="px-8 py-5 text-right">Debit</th>
                  <th className="px-8 py-5 text-right">Credit</th>
                  <th className="px-8 py-5 text-right">Balance</th>
                  <th className="px-8 py-5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredGL.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-[15px] text-gray-400">
                      No ledger entries found. Save a Journal Entry to see it here.
                    </td>
                  </tr>
                ) : (
                  filteredGL.map((row, idx) => (
                    <tr key={idx} className={`${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'} hover:bg-purple-50/30 transition-colors`}>
                      <td className="px-8 py-6 text-[14px] text-gray-700 font-bold">{row.account}</td>
                      <td className="px-8 py-6 text-[14px] text-gray-500">{row.description}</td>
                      <td className="px-8 py-6 text-[13px] text-gray-400 font-mono">{row.ref}</td>
                      <td className="px-8 py-6 text-[14px] text-green-600 font-bold text-right">{row.debit}</td>
                      <td className="px-8 py-6 text-[14px] text-red-500 font-bold text-right">{row.credit}</td>
                      <td className="px-8 py-6 text-[14px] text-gray-700 font-bold text-right">{row.balance}</td>
                      <td className="px-8 py-6 text-[14px] text-gray-400 font-medium">{row.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[13px] text-gray-400 font-medium">
              {filteredGL.length} entr{filteredGL.length === 1 ? 'y' : 'ies'} total
            </p>
          </div>
        </div>
      )}
      {/* ===== Fixed Assets ===== */}
      {activeTab === 'Fixed Assets' && (
        <div className="animate-in fade-in duration-400">

          {/* Fixed Assets table */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F3F4F6] text-[13px] font-bold text-gray-600">
                  <th className="px-6 py-5 whitespace-nowrap">Asset Name</th>
                  <th className="px-6 py-5 whitespace-nowrap">Purchase Price</th>
                  <th className="px-6 py-5 whitespace-nowrap">Purchase Date</th>
                  <th className="px-6 py-5 whitespace-nowrap">Asset Account</th>
                  <th className="px-6 py-5 whitespace-nowrap">Accumulated Depreciation</th>
                  <th className="px-6 py-5 whitespace-nowrap">Remaining Value</th>
                  <th className="px-6 py-5 whitespace-nowrap">Status</th>
                  <th className="px-6 py-5 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fixedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-[14px] text-gray-400 font-medium">
                      No fixed assets yet. Click &ldquo;Add New&rdquo; to get started.
                    </td>
                  </tr>
                ) : (
                  fixedAssets.map((asset, idx) => (
                    <tr
                      key={asset.id}
                      className={`hover:bg-gray-50/60 transition-colors ${
                        idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                      }`}
                    >
                      <td className="px-6 py-5 text-[13px] text-gray-700 font-medium">{asset.assetName}</td>
                      <td className="px-6 py-5 text-[13px] text-gray-700 font-medium">{asset.purchasePrice}</td>
                      <td className="px-6 py-5 text-[13px] text-gray-600 font-medium">{asset.purchaseDate}</td>
                      <td className="px-6 py-5 text-[13px] text-gray-600">{asset.assetAccount}</td>
                      <td className="px-6 py-5 text-[13px] text-gray-600">{asset.accumulatedDepreciation}</td>
                      <td className="px-6 py-5 text-[13px] text-gray-700 font-medium">{asset.remainingValue}</td>
                      <td className="px-6 py-5">
                        <span className={`text-[12px] font-semibold ${
                          asset.status === 'Active' ? 'text-gray-700' :
                          asset.status === 'Disposed' ? 'text-red-500' : 'text-yellow-600'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <button
                          id={`fixed-asset-view-${asset.id}`}
                          className="text-[13px] font-bold text-[#AE00FF] hover:text-[#8B00CC] transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
