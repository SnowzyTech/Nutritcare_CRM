'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircleMore,
  Plus,
  Calendar as CalendarIcon,
  ChevronDown,
  Trash2,
  Search,
  ArrowRight,
  X
} from 'lucide-react';
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  createExpenseAction,
  createExpenseCategoryAction,
  createPaymentAccountAction,
} from "@/modules/finance/actions/expenses.action";
import { createSupplierAction } from "@/modules/finance/actions/suppliers.action";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface ExpenseHistoryRow {
  id?: string;
  category: string;
  ref: string;
  account: string;
  accountType: string;
  val1: string;
  val2: string;
  date: string;
  notes?: string;
  attachmentUrl?: string | null;
  createdBy?: string;
}

interface ExpensesClientProps {
  initialHistory?: ExpenseHistoryRow[];
  initialCategories?: { id: string; name: string }[];
  initialAccounts?: { id: string; name: string }[];
  initialSuppliers?: { id?: string; name: string; contact: string; balance: string }[];
  nextRef?: string;
}

const tabs = [
  { id: 'new', label: 'New Expense' },
  { id: 'history', label: 'Expense History' },
  { id: 'supplier', label: 'Supplier' },
];

const fallbackHistoryData = [
  { category: 'Delivery Costs', ref: 'EXP 1202', account: 'MoniePoint', accountType: 'moniepoint', val1: 'REM-1023', val2: '₦0', date: '12 - 06 -26' },
  { category: 'Office Supplies', ref: 'EXP 1002', account: 'Gt Bank', accountType: 'gtbank', val1: 'DF-204', val2: '₦2,500', date: '13 - 06 -26' },
  { category: 'Staff Salaries', ref: 'EXP 1342', account: 'MoniePoint', accountType: 'moniepoint', val1: 'ADJ-001', val2: '₦30,000', date: '12 - 03 -26' },
  { category: 'Marketing', ref: 'EXP 1022', account: 'Gt Bank', accountType: 'gtbank', val1: 'DF-204', val2: '₦2,500', date: '12 - 06 -26' },
  { category: 'Utilities', ref: 'EXP 1342', account: 'Gt Bank', accountType: 'gtbank', val1: 'REM-1023', val2: '₦0', date: '12 - 06 -26' },
  { category: 'Utilities', ref: 'EXP 1002', account: 'Gt Bank', accountType: 'gtbank', val1: 'REM-1023', val2: '₦0', date: '12 - 06 -26' },
  { category: 'Bank Charges', ref: 'EXP 1002', account: 'MoniePoint', accountType: 'moniepoint', val1: 'ADJ-001', val2: '₦2,500', date: '12 - 06 -26' },
  { category: 'Bank Charges', ref: 'EXP 1002', account: 'MoniePoint', accountType: 'moniepoint', val1: 'ADJ-001', val2: '₦2,500', date: '12 - 06 -26' },
  { category: 'Bank Charges', ref: 'EXP 1002', account: 'MoniePoint', accountType: 'moniepoint', val1: 'ADJ-001', val2: '₦2,500', date: '12 - 06 -26' },
  { category: 'Utilities', ref: 'EXP 1342', account: 'Gt Bank', accountType: 'gtbank', val1: 'REM-1023', val2: '₦0', date: '12 - 06 -26' },
  { category: 'Bank Charges', ref: 'EXP 1332', account: 'MoniePoint', accountType: 'moniepoint', val1: 'ADJ-001', val2: '₦2,500', date: '12 - 06 -26' },
  { category: 'Bank Charges', ref: 'EXP 1222', account: 'MoniePoint', accountType: 'moniepoint', val1: 'ADJ-001', val2: '₦2,500', date: '12 - 06 -26' },
  { category: 'Utilities', ref: 'EXP 1232', account: 'Gt Bank', accountType: 'gtbank', val1: 'REM-1023', val2: '₦0', date: '12 - 06 -26' },
  { category: 'Bank Charges', ref: 'EXP 1323', account: 'MoniePoint', accountType: 'moniepoint', val1: 'ADJ-001', val2: '₦2,500', date: '12 - 06 -26' },
];

const initialSupplierData = [
  { name: 'Adebayo Ogunleye', contact: '0803 472 9156', balance: 'N40,000' },
  { name: 'Tunde Balogun', contact: '0803 472 9156', balance: 'DF-204' },
  { name: 'PrimeCore Industries', contact: '0816 239 7742', balance: 'ADJ-001' },
  { name: 'Ifeoma Nwankwo', contact: '0803 472 9156', balance: 'DF-204' },
  { name: 'BlueWave Technologies', contact: '0902 661 5487', balance: 'REM-1023' },
  { name: 'Kemi Akinwale', contact: '0803 472 9156', balance: 'DF-204' },
  { name: 'Emeka Obi', contact: '0907 334 8802', balance: 'REM-1023' },
  { name: 'Halima Bello', contact: '0803 472 9156', balance: 'ADJ-001' },
  { name: 'Emeka Obi', contact: '0907 334 8802', balance: 'REM-1023' },
  { name: 'Crestfield Energy', contact: '0803 472 9156', balance: 'ADJ-001' },
];

export function ExpensesClient({
  initialHistory,
  initialCategories,
  initialAccounts,
  initialSuppliers,
  nextRef,
}: ExpensesClientProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const validTabs = ['new', 'history', 'supplier'];
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTabState] = useState<string>(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'new'
  );

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (validTabs.includes(tab)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false } as any);
    }
  };

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const historyData: ExpenseHistoryRow[] = initialHistory ?? (fallbackHistoryData as any);

  const [historySearch, setHistorySearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filteredHistory = historyData.filter(row => {
    const matchesCategory = !filterCategory || row.category === filterCategory;
    const matchesDate = !filterDate || new Date(row.date) >= filterDate;
    const matchesSearch =
      !historySearch ||
      row.ref.toLowerCase().includes(historySearch.toLowerCase()) ||
      row.category.toLowerCase().includes(historySearch.toLowerCase());
    return matchesCategory && matchesDate && matchesSearch;
  });

  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    initialCategories && initialCategories.length > 0
      ? initialCategories
      : [
          { id: '__local-1', name: 'Office Supplies' },
          { id: '__local-2', name: 'Delivery Costs' },
          { id: '__local-3', name: 'Staff Salaries' },
        ]
  );
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>(
    initialAccounts && initialAccounts.length > 0
      ? initialAccounts
      : [
          { id: '__local-1', name: 'Gt Bank - 0123456789' },
          { id: '__local-2', name: 'MoniePoint - 9876543210' },
        ]
  );
  const [suppliers, setSuppliers] = useState(initialSuppliers ?? initialSupplierData);

  // Form state for new expense
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [notesText, setNotesText] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);

  type LineRow = { id: number; product: string; description: string; qty: string; amount: string; tax: string };
  const [lineItems, setLineItems] = useState<LineRow[]>([
    { id: 1, product: '', description: '', qty: '1', amount: '', tax: '' },
    { id: 2, product: '', description: '', qty: '1', amount: '', tax: '' },
    { id: 3, product: '', description: '', qty: '1', amount: '', tax: '' },
  ]);
  const updateLine = (id: number, field: keyof LineRow, value: string) =>
    setLineItems(prev => prev.map(l => (l.id === id ? { ...l, [field]: value } : l)));

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ type: '', description: '', instances: '' });

  const [isAccountModalOpen, setAccountModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({ accountNumber: '', bankName: '' });

  const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', balance: '' });

  const handleAddCategory = async () => {
    if (!newCategory.type) return;
    const res = await createExpenseCategoryAction(newCategory.type);
    if ('error' in res) { alert(res.error); return; }
    setCategories(prev => [...prev, { id: res.id!, name: res.name! }]);
    setCategoryModalOpen(false);
    setNewCategory({ type: '', description: '', instances: '' });
  };

  const handleAddAccount = async () => {
    if (!newAccount.bankName) return;
    const display = `${newAccount.bankName}${newAccount.accountNumber ? ' - ' + newAccount.accountNumber : ''}`;
    const res = await createPaymentAccountAction(display, 'BANK');
    if ('error' in res) { alert(res.error); return; }
    setAccounts(prev => [...prev, { id: res.id!, name: res.name! }]);
    setAccountModalOpen(false);
    setNewAccount({ accountNumber: '', bankName: '' });
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name) return;
    const res = await createSupplierAction({
      name: newSupplier.name,
      phone1: newSupplier.contact || `unknown-${Date.now()}`,
    });
    if ('error' in res) { alert(res.error); return; }
    setSuppliers(prev => [
      ...prev,
      { id: res.id, name: newSupplier.name, contact: newSupplier.contact, balance: newSupplier.balance || '₦0' },
    ]);
    setSupplierModalOpen(false);
    setNewSupplier({ name: '', contact: '', balance: '' });
  };

  const handleAddLine = () => {
    setLineItems([...lineItems, { id: Date.now(), product: '', description: '', qty: '1', amount: '', tax: '' }]);
  };

  const handleDeleteLine = (id: number) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleSaveEntry = async () => {
    if (!selectedCategoryId || !selectedAccountId) {
      alert('Select category and account');
      return;
    }
    const items = lineItems
      .filter(l => parseFloat(l.amount) > 0)
      .map(l => ({
        product: l.product,
        description: l.description,
        quantity: parseFloat(l.qty) || 1,
        amount: parseFloat(l.amount) || 0,
        tax: parseFloat(l.tax) || 0,
      }));
    if (items.length === 0) {
      alert('Add at least one line item with an amount');
      return;
    }
    setSavingExpense(true);
    const res = await createExpenseAction({
      expenseCategoryId: selectedCategoryId,
      paidFromAccountId: selectedAccountId,
      date: date ?? new Date(),
      notes: notesText,
      lineItems: items,
    });
    setSavingExpense(false);
    if ('error' in res) { alert(res.error); return; }
    router.refresh();
    setActiveTab('history');
  };

  const resetForm = () => {
    setSelectedCategoryId('');
    setSelectedAccountId('');
    setNotesText('');
    setDate(new Date());
    setLineItems([
      { id: 1, product: '', description: '', qty: '1', amount: '', tax: '' },
      { id: 2, product: '', description: '', qty: '1', amount: '', tax: '' },
      { id: 3, product: '', description: '', qty: '1', amount: '', tax: '' },
    ]);
  };

  const handleSaveAndAddAnother = async () => {
    if (!selectedCategoryId || !selectedAccountId) {
      alert('Select category and account');
      return;
    }
    const items = lineItems
      .filter(l => parseFloat(l.amount) > 0)
      .map(l => ({
        product: l.product,
        description: l.description,
        quantity: parseFloat(l.qty) || 1,
        amount: parseFloat(l.amount) || 0,
        tax: parseFloat(l.tax) || 0,
      }));
    if (items.length === 0) {
      alert('Add at least one line item with an amount');
      return;
    }
    setSavingExpense(true);
    const res = await createExpenseAction({
      expenseCategoryId: selectedCategoryId,
      paidFromAccountId: selectedAccountId,
      date: date ?? new Date(),
      notes: notesText,
      lineItems: items,
    });
    setSavingExpense(false);
    if ('error' in res) { alert(res.error); return; }
    resetForm();
    router.refresh();
  };

  const renderAccountIcon = (type: string) => {
    if (type === 'moniepoint') {
      return (
        <div className="w-5 h-5 rounded-full bg-[#0052FF] flex items-center justify-center text-white text-[10px] font-bold">
          M
        </div>
      );
    }
    if (type === 'gtbank') {
      return (
        <div className="w-5 h-5 rounded-[4px] bg-[#DD4F05] flex items-center justify-center">
          <div className="w-2.5 h-2.5 border border-white" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#FAFAFA] font-sans pb-20 relative">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
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
      </div>

      <div className="flex items-center justify-between mb-10">
        <h1 className="text-[28px] font-bold text-gray-700 tracking-tight">
          {activeTab === 'new' && 'Expense Entry'}
          {activeTab === 'history' && 'Expense History'}
          {activeTab === 'supplier' && 'Suppliers'}
          {activeTab === 'details' && 'Expense Details'}
        </h1>
        <div className="flex items-center gap-6">
          {activeTab === 'supplier' && (
            <button 
              onClick={() => setSupplierModalOpen(true)}
              className="bg-[#AE00FF] text-white px-6 py-3 rounded-xl text-[14px] font-bold hover:bg-[#9900E6] transition-colors shadow-sm flex items-center gap-2"
            >
              Add Supplier <Plus size={16} />
            </button>
          )}
          <div className="w-16 h-16 bg-[#F3E8FF] rounded-full flex items-center justify-center cursor-pointer">
            <div className="w-[42px] h-[42px] bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-105 transition-transform">
              <MessageCircleMore fill="currentColor" size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8 items-start relative">
        
        {/* Sidebar */}
        <div className="w-[280px] bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[600px]">
          <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-6 py-4 rounded-xl text-[14px] font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#F3E8FF] text-[#AE00FF]'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
          
          {/* --- NEW EXPENSE --- */}
          {activeTab === 'new' && (
            <div>
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-8">
                  <h2 className="text-[20px] font-bold text-gray-700">New Expense Entry</h2>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-[16px] font-medium">REF:</span>
                    <span className="text-[20px] font-bold text-gray-600">{nextRef ?? 'EXP 1023'}</span>
                  </div>
                </div>
                <button className="bg-[#4A0A77] text-white px-6 py-2.5 rounded-lg text-[12px] font-bold hover:bg-[#3B0069] transition-all shadow-sm">
                  Import Charts of Accounts
                </button>
              </div>

              <div className="space-y-8">
                {/* Expense Category */}
                <div className="grid grid-cols-5 gap-6 items-end">
                  <div className="col-span-4 space-y-2">
                    <label className="text-[13px] font-bold text-gray-600">Expense Category</label>
                    <div className="relative">
                      <select
                        value={selectedCategoryId}
                        onChange={e => setSelectedCategoryId(e.target.value)}
                        className="w-full h-12 bg-white border border-gray-200 rounded-lg px-4 text-[14px] text-gray-600 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-400"
                      >
                        <option value="">Please Select</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    </div>
                  </div>
                  <button 
                    onClick={() => setCategoryModalOpen(true)}
                    className="h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:border-gray-300 transition-all text-[13px] font-medium"
                  >
                    <Plus size={16} />
                    Add New Category
                  </button>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-gray-600">Date</label>
                  <Popover>
                    <PopoverTrigger className="w-full h-12 bg-white border border-gray-200 rounded-lg px-4 flex items-center justify-between text-[14px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all">
                      <div className="flex items-center gap-3">
                        <CalendarIcon size={18} className="text-gray-400" />
                        <span>{date ? format(date, "dd-MM-yy") : "Pick a date"}</span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-gray-100" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="rounded-xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Paid From Account */}
                <div className="grid grid-cols-5 gap-6 items-end">
                  <div className="col-span-4 space-y-2">
                    <label className="text-[13px] font-bold text-gray-600">Paid From Account</label>
                    <div className="relative">
                      <select
                        value={selectedAccountId}
                        onChange={e => setSelectedAccountId(e.target.value)}
                        className="w-full h-12 bg-white border border-gray-200 rounded-lg px-4 text-[14px] text-gray-600 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-400"
                      >
                        <option value="">Please Select</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    </div>
                  </div>
                  <button 
                    onClick={() => setAccountModalOpen(true)}
                    className="h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:border-gray-300 transition-all text-[13px] font-medium"
                  >
                    <Plus size={16} />
                    Add New Account
                  </button>
                </div>

                {/* Supplier */}
                <div className="grid grid-cols-5 gap-6 items-end">
                  <div className="col-span-4 space-y-2">
                    <label className="text-[13px] font-bold text-gray-600">Supplier</label>
                    <div className="relative">
                      <select className="w-full h-12 bg-white border border-gray-200 rounded-lg px-4 text-[14px] text-gray-600 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-400">
                        <option value="">Please Select</option>
                        {suppliers.map((sup: any, idx: number) => (
                          <option key={sup.id ?? idx} value={sup.name}>{sup.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    </div>
                  </div>
                  <button 
                    onClick={() => setSupplierModalOpen(true)}
                    className="h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:border-gray-300 transition-all text-[13px] font-medium"
                  >
                    <Plus size={16} />
                    Add Supplier
                  </button>
                </div>

                {/* Dynamic Table */}
                <div className="border border-gray-100 rounded-xl overflow-hidden mt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#4A0A77] text-white text-[11px] font-medium">
                        <th className="px-4 py-3 w-10">#</th>
                        <th className="px-4 py-3 w-[25%]">Product/Service</th>
                        <th className="px-4 py-3 w-[30%]">Description</th>
                        <th className="px-4 py-3 w-20">Qty</th>
                        <th className="px-4 py-3 w-[15%]">Amount</th>
                        <th className="px-4 py-3 w-24">Tax</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, index) => (
                        <tr key={item.id} className="border-b border-gray-100 last:border-0 bg-white">
                          <td className="px-4 py-3 text-[12px] font-medium text-gray-600">{index + 1}</td>
                          <td className="px-4 py-3">
                            <input type="text" placeholder="Product/Service" value={item.product} onChange={e => updateLine(item.id, 'product', e.target.value)} className="w-full h-8 border border-gray-100 rounded bg-white px-3 text-[11px] text-gray-600 focus:outline-none focus:border-purple-400 placeholder:text-gray-300" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="text" placeholder="Description" value={item.description} onChange={e => updateLine(item.id, 'description', e.target.value)} className="w-full h-8 border border-gray-100 rounded bg-white px-3 text-[11px] text-gray-600 focus:outline-none focus:border-purple-400 placeholder:text-gray-300" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" placeholder="Qty" value={item.qty} onChange={e => updateLine(item.id, 'qty', e.target.value)} className="w-full h-8 border border-gray-100 rounded bg-white px-3 text-[11px] text-gray-600 focus:outline-none focus:border-purple-400 placeholder:text-gray-300 text-center" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" placeholder="Amount" value={item.amount} onChange={e => updateLine(item.id, 'amount', e.target.value)} className="w-full h-8 border border-gray-100 rounded bg-white px-3 text-[11px] text-gray-600 focus:outline-none focus:border-purple-400 placeholder:text-gray-300" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" placeholder="Tax" value={item.tax} onChange={e => updateLine(item.id, 'tax', e.target.value)} className="w-full h-8 border border-gray-100 rounded bg-white px-3 text-[11px] text-gray-600 focus:outline-none focus:border-purple-400 placeholder:text-gray-300" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => handleDeleteLine(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button 
                  onClick={handleAddLine}
                  className="h-9 px-4 bg-white border border-gray-200 rounded text-[12px] text-gray-600 font-bold hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Add New Line
                </button>

                {/* Notes */}
                <div className="space-y-2 mt-4">
                  <label className="text-[13px] font-bold text-gray-600">Notes</label>
                  <textarea
                    placeholder="Type here"
                    value={notesText}
                    onChange={e => setNotesText(e.target.value)}
                    className="w-full h-32 bg-white border border-gray-200 rounded-lg p-4 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                  />
                </div>

                {/* Attachment */}
                <div className="border border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center gap-1 bg-white hover:bg-gray-50 transition-all cursor-pointer">
                  <p className="text-[10px] font-bold text-[#AE00FF]">Add Attachment</p>
                  <p className="text-[9px] text-gray-400">Max file size: 20 MB</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4">
                  <button className="px-8 py-2.5 border border-[#AE00FF] text-[#AE00FF] rounded-lg text-[13px] font-bold hover:bg-purple-50 transition-colors">
                    Cancel
                  </button>
                  <div className="flex gap-4">
                    <button
                      disabled={savingExpense}
                      onClick={handleSaveAndAddAnother}
                      className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-colors bg-white shadow-sm disabled:opacity-50"
                    >
                      Save & Add Another
                    </button>
                    <button
                      disabled={savingExpense}
                      onClick={handleSaveEntry}
                      className="px-8 py-2.5 bg-[#AE00FF] text-white rounded-lg text-[13px] font-bold hover:bg-[#9900E6] transition-colors shadow-sm disabled:opacity-50"
                    >
                      {savingExpense ? 'Saving…' : 'Save Expense Entry'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* --- EXPENSE HISTORY --- */}
          {activeTab === 'history' && (
            <div>
              {/* Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-44">
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="w-full appearance-none bg-black text-white px-4 py-2.5 rounded-lg text-[12px] font-medium shadow-sm focus:outline-none cursor-pointer pr-8"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                </div>
                <Popover>
                  <PopoverTrigger className="flex items-center justify-between bg-black text-white px-4 py-2.5 rounded-lg text-[12px] font-medium w-44 shadow-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={14} className="text-white" />
                      <span>{filterDate ? format(filterDate, 'dd/MM/yy') : 'Date From'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {filterDate && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setFilterDate(undefined); }}
                          className="text-white/70 hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      )}
                      <ChevronDown size={14} className="text-white" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-gray-100" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDate}
                      onSelect={setFilterDate}
                      initialFocus
                      className="rounded-xl"
                    />
                  </PopoverContent>
                </Popover>
                <div className="relative flex-1 max-w-md ml-auto">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="Search by ref or category"
                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#AE00FF] transition-all text-gray-600 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl overflow-hidden border border-gray-50">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#EBEBEB] text-gray-500 text-[12px] font-bold">
                      <th className="px-6 py-4">Expense Category</th>
                      <th className="px-4 py-4">Ref No</th>
                      <th className="px-4 py-4">Paid From Account</th>
                      <th className="px-4 py-4">Amount</th>
                      <th className="px-4 py-4">Tax</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-[13px] text-gray-400">
                          No expenses match your filters.
                        </td>
                      </tr>
                    ) : null}
                    {filteredHistory.map((row: any, idx: number) => (
                      <tr 
                        key={idx} 
                        onClick={() => {
                          setSelectedExpense(row);
                          setActiveTab('details');
                        }}
                        className={`cursor-pointer transition-colors hover:bg-purple-50 ${idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}
                      >
                        <td className="px-6 py-4 text-[12px] text-gray-500">{row.category}</td>
                        <td className="px-4 py-4 text-[12px] text-gray-500">{row.ref}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {renderAccountIcon(row.accountType)}
                            <span className="text-[12px] text-gray-500">{row.account}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[12px] text-gray-500">{row.val1}</td>
                        <td className="px-4 py-4 text-[12px] text-gray-500 font-medium">{row.val2}</td>
                        <td className="px-6 py-4 text-[12px] text-gray-500">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6">
                <button className="flex items-center gap-2 bg-[#F3E8FF] text-[#AE00FF] px-6 py-2.5 rounded-lg text-[13px] font-bold hover:bg-purple-200 transition-colors">
                  See All
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* --- EXPENSE DETAILS --- */}
          {activeTab === 'details' && selectedExpense && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-8 flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab('history')}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <span className="text-[16px] font-bold text-gray-600">Back to History</span>
              </div>

              <div className="mb-10">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-[16px] font-medium">REF:</span>
                  <span className="text-[20px] font-bold text-gray-600">{selectedExpense.ref}</span>
                </div>
              </div>

              {/* Info grid */}
              <div className="space-y-6 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-gray-500">Expense Category</span>
                  <div className="flex-1 border-b border-dashed border-gray-200 mx-4 relative top-1"></div>
                  <span className="text-[13px] text-gray-600">{selectedExpense.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-gray-500">Account Paid From</span>
                  <div className="flex-1 border-b border-dashed border-gray-200 mx-4 relative top-1"></div>
                  <div className="flex items-center gap-2">
                    {renderAccountIcon(selectedExpense.accountType)}
                    <span className="text-[13px] text-gray-600">{selectedExpense.account}</span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl overflow-hidden mb-8">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F3E8FF] text-[#AE00FF] text-[11px] font-bold">
                      <th className="px-6 py-4">Product/Service</th>
                      <th className="px-6 py-4 text-center">Description</th>
                      <th className="px-6 py-4 text-center">Qty</th>
                      <th className="px-6 py-4 text-center">Tax</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-50">
                      <td className="px-6 py-4 text-[12px] text-gray-600">{selectedExpense.category} item</td>
                      <td className="px-6 py-4 text-[12px] text-gray-600 text-center">-------</td>
                      <td className="px-6 py-4 text-[12px] text-gray-600 text-center">1</td>
                      <td className="px-6 py-4 text-[12px] text-gray-600 text-center">----</td>
                      <td className="px-6 py-4 text-[12px] text-gray-600 text-right">{selectedExpense.val2}</td>
                    </tr>
                    {/* Grand Total */}
                    <tr className="bg-[#FAFAFA]">
                      <td colSpan={4} className="px-6 py-4 text-[13px] font-bold text-gray-800">Grand Total</td>
                      <td className="px-6 py-4 text-[13px] font-bold text-gray-800 text-right">{selectedExpense.val2}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-gray-600 mb-2">Notes</h3>
                <p className="text-[12px] text-gray-400 leading-relaxed max-w-3xl">
                  Office supplies restock (printer ink, paper), Internet subscription renewal, Transportation (client meeting), Lunch meeting with client
                </p>
              </div>

              {/* Attachments */}
              <div className="mb-10">
                <h3 className="text-[13px] font-bold text-gray-600 mb-4">Attachments</h3>
                <div className="flex gap-4">
                  <div className="bg-[#FAFAFA] rounded-xl p-3 flex items-center gap-3 w-64 border border-gray-100">
                    <div className="w-10 h-10 bg-[#E50000] rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
                      PDF
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-700">picture of the expense 1.0</p>
                      <p className="text-[10px] text-gray-400">304kb</p>
                    </div>
                  </div>
                  <div className="bg-[#FAFAFA] rounded-xl p-3 flex items-center gap-3 w-64 border border-gray-100">
                    <div className="w-10 h-10 bg-[#E50000] rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
                      PDF
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-700">picture of the expense 1.0</p>
                      <p className="text-[10px] text-gray-400">304kb</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download PDF button */}
              <div className="flex justify-end mb-10">
                <button className="bg-[#AE00FF] text-white px-6 py-3 rounded-xl text-[13px] font-bold hover:bg-[#9900E6] transition-colors shadow-sm flex items-center gap-2">
                  Download PDF <ChevronDown size={16} />
                </button>
              </div>

              {/* Recorded by */}
              <div>
                <h3 className="text-[13px] font-medium text-gray-500 mb-3">Recorded by</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    <img src="https://i.pravatar.cc/150?img=5" alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-700">Victoria Nwachukwu</p>
                    <p className="text-[11px] text-gray-400">Accountant</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* --- SUPPLIER --- */}
          {activeTab === 'supplier' && (
            <div>
              {/* Top Filters & Action */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button className="flex items-center justify-between bg-black text-white px-4 py-2.5 rounded-lg text-[12px] font-medium w-44 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-white rounded-[3px] flex items-center justify-center">
                         <div className="w-2.5 h-px bg-white" />
                      </div>
                      <span>Expense Category</span>
                    </div>
                    <ChevronDown size={14} className="text-white" />
                  </button>
                  <Popover>
                    <PopoverTrigger className="flex items-center justify-between bg-black text-white px-4 py-2.5 rounded-lg text-[12px] font-medium w-36 shadow-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={14} className="text-white" />
                        <span>Date Range</span>
                      </div>
                      <ChevronDown size={14} className="text-white" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-gray-100" align="start">
                      <Calendar
                        mode="single"
                        selected={filterDate}
                        onSelect={setFilterDate}
                        initialFocus
                        className="rounded-xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-[300px]">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Search size={14} />
                    </div>
                    <input
                      type="text"
                      placeholder="search"
                      className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#AE00FF] transition-all text-gray-600 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl overflow-hidden border border-gray-50">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#EBEBEB] text-gray-500 text-[12px] font-bold">
                      <th className="px-6 py-4 w-[35%]">Supplier Name</th>
                      <th className="px-6 py-4 w-[35%]">Contact</th>
                      <th className="px-6 py-4 w-[30%]">Payable Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((row, idx) => (
                      <tr key={idx} className={`${idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}>
                        <td className="px-6 py-5 text-[12px] text-gray-500">{row.name}</td>
                        <td className="px-6 py-5 text-[12px] text-gray-500">{row.contact}</td>
                        <td className="px-6 py-5 text-[12px] text-gray-500">{row.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* --- MODALS --- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-[400px] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Add New Category</h3>
              <button onClick={() => setCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-full"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">Type</label>
                <input type="text" placeholder="e.g. Operating Expense" value={newCategory.type} onChange={e => setNewCategory({...newCategory, type: e.target.value})} className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[13px] text-gray-700 focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">Description</label>
                <input type="text" placeholder="Short description" value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})} className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[13px] text-gray-700 focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">Instances</label>
                <input type="text" placeholder="e.g. Monthly" value={newCategory.instances} onChange={e => setNewCategory({...newCategory, instances: e.target.value})} className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[13px] text-gray-700 focus:outline-none focus:border-purple-400" />
              </div>
              <button onClick={handleAddCategory} className="w-full py-3.5 bg-[#AE00FF] text-white rounded-xl text-[13px] font-bold mt-4 hover:bg-[#9900E6] transition-colors shadow-md shadow-purple-100">
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-[400px] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Add New Account</h3>
              <button onClick={() => setAccountModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-full"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">Bank Name</label>
                <input type="text" placeholder="e.g. Zenith Bank" value={newAccount.bankName} onChange={e => setNewAccount({...newAccount, bankName: e.target.value})} className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[13px] text-gray-700 focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">Account Number</label>
                <input type="text" placeholder="0123456789" value={newAccount.accountNumber} onChange={e => setNewAccount({...newAccount, accountNumber: e.target.value})} className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[13px] text-gray-700 focus:outline-none focus:border-purple-400" />
              </div>
              <button onClick={handleAddAccount} className="w-full py-3.5 bg-[#AE00FF] text-white rounded-xl text-[13px] font-bold mt-4 hover:bg-[#9900E6] transition-colors shadow-md shadow-purple-100">
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-[400px] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Add Supplier</h3>
              <button onClick={() => setSupplierModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-full"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">Supplier Name</label>
                <input type="text" placeholder="e.g. John Doe" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[13px] text-gray-700 focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">Contact</label>
                <input type="text" placeholder="e.g. 08012345678" value={newSupplier.contact} onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})} className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[13px] text-gray-700 focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">Payable Balance</label>
                <input type="text" placeholder="e.g. N10,000" value={newSupplier.balance} onChange={e => setNewSupplier({...newSupplier, balance: e.target.value})} className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[13px] text-gray-700 focus:outline-none focus:border-purple-400" />
              </div>
              <button onClick={handleAddSupplier} className="w-full py-3.5 bg-[#AE00FF] text-white rounded-xl text-[13px] font-bold mt-4 hover:bg-[#9900E6] transition-colors shadow-md shadow-purple-100">
                Add Supplier
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}