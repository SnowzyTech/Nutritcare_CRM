'use client';

import React, { useState, useRef } from 'react';
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
  X,
  Download,
  FileText,
  Upload,
  Pencil,
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
  addExpenseNamesToCategoryAction,
  createPaymentAccountAction,
  updatePaymentAccountAction,
  deletePaymentAccountAction,
} from "@/modules/finance/actions/expenses.action";
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
} from "@/modules/finance/actions/suppliers.action";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";

interface ExpenseLineItem {
  product: string;
  description: string;
  quantity: number;
  amount: string;
  tax: string;
}

interface ExpenseHistoryRow {
  id?: string;
  category: string;
  expenseName?: string;
  ref: string;
  account: string;
  accountType: string;
  amount?: string;
  tax?: string;
  val1: string;
  val2: string;
  date: string;
  supplier?: string;
  lineItems?: ExpenseLineItem[];
  notes?: string;
  attachmentUrl?: string | null;
  attachmentUrls?: string[];
  createdBy?: string;
}

interface CategoryItem {
  id: string;
  name: string;
  financialStatement?: string | null;
  accountClass?: number | null;
  expenseNames: { id: string; name: string; code?: string }[];
}

interface ExpensesClientProps {
  initialHistory?: ExpenseHistoryRow[];
  initialCategories?: CategoryItem[];
  initialAccounts?: { id: string; name: string; logoUrl?: string }[];
  initialSuppliers?: { id?: string; name: string; contact: string; balance: string }[];
  nextRef?: string;
}

type AttachmentItem = { file: File; preview: string };

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const getDownloadUrl = (url: string): string =>
  url.replace('/upload/', '/upload/fl_attachment/');

const isImageUrl = (url: string): boolean =>
  /\.(jpg|jpeg|png|gif|webp)/i.test(url) || (url.includes('/image/upload/') && !url.endsWith('.pdf'));

const isPdfUrl = (url: string): boolean =>
  /\.pdf/i.test(url) || url.includes('/raw/upload/');

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
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const historyData: ExpenseHistoryRow[] = initialHistory ?? (fallbackHistoryData as any);

  const [historySearch, setHistorySearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filteredHistory = historyData.filter(row => {
    const matchesCategory = !filterCategory || row.category === filterCategory;
    const rowDate = new Date(row.date);
    rowDate.setHours(0, 0, 0, 0);
    const from = filterDateFrom ? new Date(filterDateFrom.setHours(0, 0, 0, 0)) : undefined;
    const to = filterDateTo ? new Date(filterDateTo.setHours(23, 59, 59, 999)) : undefined;
    const matchesDate = (!from || rowDate >= from) && (!to || rowDate <= to);
    const matchesSearch =
      !historySearch ||
      row.ref.toLowerCase().includes(historySearch.toLowerCase()) ||
      (row.expenseName ?? '').toLowerCase().includes(historySearch.toLowerCase());
    return matchesCategory && matchesDate && matchesSearch;
  });

  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories ?? []);
  const [accounts, setAccounts] = useState<{ id: string; name: string; logoUrl?: string }[]>(
    initialAccounts ?? []
  );
  const [suppliers, setSuppliers] = useState<{ id?: string; name: string; contact: string; balance: string }[]>(
    initialSuppliers ?? initialSupplierData
  );

  // Form state for new expense
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedExpenseNameId, setSelectedExpenseNameId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierTabSearch, setSupplierTabSearch] = useState('');
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
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

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [bankLogoFile, setBankLogoFile] = useState<File | null>(null);
  const [bankLogoPreview, setBankLogoPreview] = useState<string>('');
  const [selectedAttachmentUrls, setSelectedAttachmentUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bankLogoInputRef = useRef<HTMLInputElement>(null);

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

  const uploadExpenseFiles = async (files: File[]): Promise<string[]> => {
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

  const [showCategoryAdd, setShowCategoryAdd] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [selectedCategoryType, setSelectedCategoryType] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newFinancialStatement, setNewFinancialStatement] = useState('');
  const [subCategoryInputs, setSubCategoryInputs] = useState<{ code: string; name: string }[]>([{ code: '', name: '' }]);

  const [isAccountModalOpen, setAccountModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({ accountNumber: '', bankName: '' });
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', balance: '' });
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [savingSupplier, setSavingSupplier] = useState(false);

  const handleAddCategory = async () => {
    const validSubs = subCategoryInputs
      .filter(s => s.name.trim())
      .map(s => ({ name: s.name.trim(), code: s.code.trim() || undefined }));

    if (isAddingNewCategory) {
      const name = newCategoryName.trim();
      if (!name) return;

      const res = await createExpenseCategoryAction(name, newFinancialStatement, validSubs);
      if ('error' in res) { alert(res.error); return; }

      setCategories(prev => [...prev, {
        id: res.id!,
        name: res.name!,
        financialStatement: res.financialStatement ?? null,
        accountClass: res.accountClass ?? null,
        expenseNames: (res.expenseNames ?? []).map(n => ({ id: n.id, name: n.name, code: n.code ?? undefined })),
      }]);
    } else {
      // Adding names to an existing category
      const existingCat = categories.find(c => c.id === selectedCategoryType);
      if (!existingCat) return;

      if (validSubs.length > 0) {
        const res = await addExpenseNamesToCategoryAction(existingCat.id, validSubs);
        if ('error' in res) { alert(res.error); return; }

        setCategories(prev => prev.map(c =>
          c.id === existingCat.id
            ? { ...c, expenseNames: [...c.expenseNames, ...(res.names ?? []).map(n => ({ id: n.id, name: n.name, code: n.code ?? undefined }))] }
            : c
        ));
      }
    }

    setIsAddingNewCategory(false);
    setSelectedCategoryType('');
    setNewCategoryName('');
    setNewCategoryDesc('');
    setNewFinancialStatement('');
    setSubCategoryInputs([{ code: '', name: '' }]);
    setShowCategoryAdd(false);
  };

  const resetAccountForm = () => {
    setAccountModalOpen(false);
    setEditingAccountId(null);
    setNewAccount({ accountNumber: '', bankName: '' });
    if (bankLogoPreview) URL.revokeObjectURL(bankLogoPreview);
    setBankLogoFile(null);
    setBankLogoPreview('');
  };

  const openAddAccount = () => {
    setEditingAccountId(null);
    setNewAccount({ accountNumber: '', bankName: '' });
    setBankLogoFile(null);
    setBankLogoPreview('');
    setAccountModalOpen(true);
  };

  const openEditAccount = (acc: { id: string; name: string; logoUrl?: string }) => {
    // Account name is stored as "Bank Name - Account Number"; split it back.
    const [bankName, accountNumber = ''] = acc.name.split(' - ');
    setEditingAccountId(acc.id);
    setNewAccount({ bankName: bankName ?? acc.name, accountNumber });
    setBankLogoFile(null);
    setBankLogoPreview('');
    setAccountModalOpen(true);
  };

  const handleAddAccount = async () => {
    if (!newAccount.bankName.trim()) { toast.error('Bank name is required'); return; }
    const display = `${newAccount.bankName}${newAccount.accountNumber ? ' - ' + newAccount.accountNumber : ''}`;

    setSavingAccount(true);
    let logoUrl: string | undefined;
    if (bankLogoFile) {
      try {
        const urls = await uploadExpenseFiles([bankLogoFile]);
        logoUrl = urls[0];
      } catch { /* continue without logo */ }
    }

    const wasEditing = !!editingAccountId;
    const res = editingAccountId
      ? await updatePaymentAccountAction(editingAccountId, display, logoUrl)
      : await createPaymentAccountAction(display, 'BANK', logoUrl);
    setSavingAccount(false);
    if ('error' in res) { toast.error(res.error); return; }

    if (editingAccountId) {
      setAccounts(prev => prev.map(a => (a.id === res.id ? { id: res.id!, name: res.name!, logoUrl: res.logoUrl } : a)));
    } else {
      setAccounts(prev => [...prev, { id: res.id!, name: res.name!, logoUrl: res.logoUrl }]);
    }
    toast.success(wasEditing ? 'Account updated' : 'Account added');
    resetAccountForm();
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Delete this account? It will no longer be selectable for new expenses.')) return;
    const res = await deletePaymentAccountAction(id);
    if ('error' in res) { toast.error(res.error); return; }
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (selectedAccountId === id) setSelectedAccountId('');
    toast.success('Account deleted');
  };

  const openAddSupplier = () => {
    setEditingSupplierId(null);
    setNewSupplier({ name: '', contact: '', balance: '' });
    setSupplierModalOpen(true);
  };

  const openEditSupplier = (sup: { id?: string; name: string; contact: string; balance: string }) => {
    if (!sup.id) return;
    setEditingSupplierId(sup.id);
    setNewSupplier({ name: sup.name, contact: sup.contact, balance: sup.balance });
    setSupplierModalOpen(true);
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name.trim()) { toast.error('Supplier name is required'); return; }
    setSavingSupplier(true);
    const payableBalance = parseFloat(newSupplier.balance.replace(/[^0-9.]/g, '')) || 0;
    const formattedBalance = `₦${payableBalance.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
    const payload = {
      name: newSupplier.name,
      phone1: newSupplier.contact || `unknown-${Date.now()}`,
      payableBalance,
    };
    const wasEditing = !!editingSupplierId;
    const res = editingSupplierId
      ? await updateSupplierAction(editingSupplierId, payload)
      : await createSupplierAction(payload);
    setSavingSupplier(false);
    if ('error' in res) { toast.error(res.error); return; }

    if (editingSupplierId) {
      setSuppliers(prev => prev.map(s =>
        s.id === editingSupplierId
          ? { ...s, name: newSupplier.name, contact: newSupplier.contact, balance: formattedBalance }
          : s
      ));
    } else {
      setSuppliers(prev => [
        ...prev,
        { id: res.id, name: newSupplier.name, contact: newSupplier.contact, balance: formattedBalance },
      ]);
      setSelectedSupplierId(res.id ?? '');
      setSupplierSearch(newSupplier.name);
    }
    toast.success(wasEditing ? 'Supplier updated' : 'Supplier added');
    setSupplierModalOpen(false);
    setEditingSupplierId(null);
    setNewSupplier({ name: '', contact: '', balance: '' });
  };

  const handleDeleteSupplier = async (id?: string) => {
    if (!id) return;
    if (!confirm('Delete this supplier?')) return;
    const res = await deleteSupplierAction(id);
    if ('error' in res) { toast.error(res.error); return; }
    setSuppliers(prev => prev.filter(s => s.id !== id));
    if (selectedSupplierId === id) { setSelectedSupplierId(''); setSupplierSearch(''); }
    toast.success('Supplier deleted');
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
    let uploadedUrls: string[] = [];
    try {
      uploadedUrls = await uploadExpenseFiles(attachments.map(a => a.file));
    } catch (err: any) {
      setSavingExpense(false);
      alert(err.message ?? 'File upload failed');
      return;
    }
    const res = await createExpenseAction({
      expenseCategoryId: selectedCategoryId,
      expenseNameId: selectedExpenseNameId || undefined,
      supplierId: selectedSupplierId || undefined,
      paidFromAccountId: selectedAccountId,
      date: date ?? new Date(),
      notes: notesText,
      attachmentUrls: uploadedUrls,
      lineItems: items,
    });
    setSavingExpense(false);
    if ('error' in res) { alert(res.error); return; }
    router.refresh();
    setActiveTab('history');
  };

  const resetForm = () => {
    setSelectedCategoryId('');
    setSelectedExpenseNameId('');
    setSelectedAccountId('');
    setSelectedSupplierId('');
    setSupplierSearch('');
    setNotesText('');
    setDate(new Date());
    setAttachments(prev => { prev.forEach(a => { if (a.preview) URL.revokeObjectURL(a.preview); }); return []; });
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
    let uploadedUrls2: string[] = [];
    try {
      uploadedUrls2 = await uploadExpenseFiles(attachments.map(a => a.file));
    } catch (err: any) {
      setSavingExpense(false);
      alert(err.message ?? 'File upload failed');
      return;
    }
    const res = await createExpenseAction({
      expenseCategoryId: selectedCategoryId,
      expenseNameId: selectedExpenseNameId || undefined,
      supplierId: selectedSupplierId || undefined,
      paidFromAccountId: selectedAccountId,
      date: date ?? new Date(),
      notes: notesText,
      attachmentUrls: uploadedUrls2,
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
              onClick={openAddSupplier}
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
                <div className="space-y-6">
                  <div className="grid grid-cols-5 gap-6 items-end">
                    <div className="col-span-4 space-y-2">
                      <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Expense Category</label>
                      <div className="relative">
                        <select
                          value={selectedCategoryId}
                          onChange={e => {
                            setSelectedCategoryId(e.target.value);
                            setSelectedExpenseNameId('');
                          }}
                          className="w-full h-12 bg-gray-50 border-0 rounded-xl px-5 text-[14px] text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium"
                        >
                          <option value="">Please Select</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCategoryAdd(!showCategoryAdd)}
                      className={`h-12 border border-[#AE00FF] text-[#AE00FF] rounded-xl flex items-center justify-center gap-2 hover:bg-purple-50 transition-all text-[13px] font-bold ${showCategoryAdd ? 'bg-purple-50' : 'bg-white'}`}
                    >
                      <Plus size={16} />
                      Add New Category
                    </button>
                  </div>

                  {/* Expense Name — appears after category is selected */}
                  {selectedCategoryId && (() => {
                    const expenseNames = categories.find(c => c.id === selectedCategoryId)?.expenseNames ?? [];
                    return expenseNames.length > 0 ? (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Expense Name</label>
                        <div className="relative">
                          <select
                            value={selectedExpenseNameId}
                            onChange={e => setSelectedExpenseNameId(e.target.value)}
                            className="w-full h-12 bg-gray-50 border-0 rounded-xl px-5 text-[14px] text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium"
                          >
                            <option value="">Please Select</option>
                            {expenseNames.map(n => (
                              <option key={n.id} value={n.id}>{n.code ? `${n.code} — ${n.name}` : n.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {showCategoryAdd && (
                    <div className="bg-white rounded-[32px] p-8 border border-purple-100 animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl shadow-purple-50/50">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-[18px] font-bold text-gray-700">Add Account Entry</h3>
                        <button onClick={() => setShowCategoryAdd(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full transition-colors">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Expense Category</label>
                            <Select
                              value={isAddingNewCategory ? "ADD_NEW" : selectedCategoryType}
                              onValueChange={(val) => {
                                if (val === "ADD_NEW") {
                                  setIsAddingNewCategory(true);
                                  setSelectedCategoryType('');
                                } else {
                                  setIsAddingNewCategory(false);
                                  setSelectedCategoryType(val ?? '');
                                }
                              }}
                            >
                              <SelectTrigger className="w-full h-[52px] px-5 bg-gray-50 border-0 rounded-2xl text-[14px] font-medium text-gray-700 focus:ring-2 focus:ring-purple-200">
                                <SelectValue placeholder="Select existing category..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-purple-50 shadow-xl z-[150]">
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

                          {isAddingNewCategory && (
                            <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">New Category Name</label>
                              <input
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                placeholder="e.g. Marketing & Ads"
                                className="w-full h-[52px] px-5 bg-gray-50 border-0 rounded-2xl text-[14px] font-medium text-gray-700 focus:ring-2 focus:ring-purple-200"
                              />
                            </div>
                          )}
                        </div>

                        {isAddingNewCategory && (
                          <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Financial Statement</label>
                            <Select value={newFinancialStatement} onValueChange={(val) => setNewFinancialStatement(val ?? '')}>
                              <SelectTrigger className="w-full h-[52px] px-5 bg-gray-50 border-0 rounded-2xl text-[14px] font-medium text-gray-700 focus:ring-2 focus:ring-purple-200">
                                <SelectValue placeholder="Select financial statement..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-purple-50 shadow-xl z-[150]">
                                <SelectItem value="Statement of Profit or Loss" className="rounded-xl py-3 px-4 focus:bg-purple-50">Statement of Profit or Loss</SelectItem>
                                <SelectItem value="Statement of Financial Position" className="rounded-xl py-3 px-4 focus:bg-purple-50">Statement of Financial Position</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {!isAddingNewCategory && selectedCategoryType && (() => {
                          const existingCat = categories.find(c => c.id === selectedCategoryType);
                          return existingCat ? (
                            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 animate-in fade-in duration-300">
                              {existingCat.financialStatement && (
                                <p className="text-[11px] font-bold text-purple-500 uppercase tracking-tight mb-2">
                                  Financial Statement: {existingCat.financialStatement}
                                </p>
                              )}
                              <p className="text-[12px] font-bold text-purple-700 uppercase tracking-tight mb-1">Existing Account Names:</p>
                              <p className="text-[14px] text-purple-900 font-medium italic">
                                {existingCat.expenseNames.length > 0
                                  ? existingCat.expenseNames.map(n => n.name).join(', ')
                                  : 'No names added yet'}
                              </p>
                              <p className="text-[11px] text-purple-400 mt-2">Add more below to append to this category.</p>
                            </div>
                          ) : null;
                        })()}

                        <div className="space-y-3">
                          <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Account Code &amp; Name(s)</label>
                          <div className="space-y-3">
                            {subCategoryInputs.map((input, idx) => (
                              <div key={idx} className="flex gap-3 animate-in fade-in duration-200">
                                <input
                                  value={input.code}
                                  onChange={e => {
                                    const next = [...subCategoryInputs];
                                    next[idx] = { ...next[idx], code: e.target.value };
                                    setSubCategoryInputs(next);
                                  }}
                                  placeholder="Code"
                                  inputMode="numeric"
                                  className="w-[110px] h-[52px] px-4 bg-gray-50 border-0 rounded-2xl text-[14px] font-mono font-medium text-gray-700 focus:ring-2 focus:ring-purple-200"
                                />
                                <input
                                  value={input.name}
                                  onChange={e => {
                                    const next = [...subCategoryInputs];
                                    next[idx] = { ...next[idx], name: e.target.value };
                                    setSubCategoryInputs(next);
                                  }}
                                  placeholder="Enter account name..."
                                  className="flex-1 h-[52px] px-5 bg-gray-50 border-0 rounded-2xl text-[14px] font-medium text-gray-700 focus:ring-2 focus:ring-purple-200"
                                />
                                {idx === subCategoryInputs.length - 1 && (
                                  <button
                                    onClick={() => setSubCategoryInputs([...subCategoryInputs, { code: '', name: '' }])}
                                    className="w-[52px] h-[52px] flex items-center justify-center bg-purple-50 text-purple-600 rounded-2xl hover:bg-purple-100 transition-colors flex-shrink-0"
                                  >
                                    <span className="font-bold text-[24px]">+</span>
                                  </button>
                                )}
                                {subCategoryInputs.length > 1 && (
                                  <button
                                    onClick={() => setSubCategoryInputs(subCategoryInputs.filter((_, i) => i !== idx))}
                                    className="w-[52px] h-[52px] flex items-center justify-center bg-red-50 text-red-400 rounded-2xl hover:bg-red-100 transition-colors flex-shrink-0"
                                  >
                                    <X size={20} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-400">The code&apos;s first digit sets the class (e.g. 6 = Operating Expenses). Each code must be unique.</p>
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                          <button
                            onClick={handleAddCategory}
                            className="flex-1 py-4 bg-[#AE00FF] text-white rounded-2xl text-[15px] font-bold hover:bg-[#8B00CC] transition-all shadow-lg shadow-purple-100 active:scale-[0.98]"
                          >
                            Save Category
                          </button>
                          <button
                            onClick={() => { setShowCategoryAdd(false); setSubCategoryInputs([{ code: '', name: '' }]); }}
                            className="px-10 py-4 border border-gray-200 text-gray-400 rounded-2xl text-[15px] font-bold hover:bg-gray-50 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
                    onClick={openAddAccount}
                    className="h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:border-gray-300 transition-all text-[13px] font-medium"
                  >
                    <Plus size={16} />
                    Add New Account
                  </button>
                </div>

                {/* Supplier — searchable combobox */}
                <div className="grid grid-cols-5 gap-6 items-end">
                  <div className="col-span-4 space-y-2">
                    <label className="text-[13px] font-bold text-gray-600">Supplier</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={supplierSearch}
                        onChange={e => {
                          setSupplierSearch(e.target.value);
                          setSelectedSupplierId('');
                          setSupplierDropdownOpen(true);
                        }}
                        onFocus={() => setSupplierDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setSupplierDropdownOpen(false), 150)}
                        placeholder="Search supplier..."
                        className="w-full h-12 bg-white border border-gray-200 rounded-lg px-4 pr-10 text-[14px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                      {supplierSearch && (
                        <button
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { setSupplierSearch(''); setSelectedSupplierId(''); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                        >
                          <X size={15} />
                        </button>
                      )}
                      {supplierDropdownOpen && (() => {
                        const filtered = suppliers.filter((s: any) =>
                          !supplierSearch || s.name.toLowerCase().includes(supplierSearch.toLowerCase())
                        );
                        return filtered.length > 0 ? (
                          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                            {filtered.map((sup: any, idx: number) => (
                              <button
                                key={sup.id ?? idx}
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => {
                                  setSelectedSupplierId(sup.id ?? '');
                                  setSupplierSearch(sup.name);
                                  setSupplierDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-[13px] hover:bg-purple-50 transition-colors ${selectedSupplierId === sup.id ? 'bg-purple-50 text-[#AE00FF] font-medium' : 'text-gray-600'}`}
                              >
                                <span>{sup.name}</span>
                                {sup.contact && <span className="ml-2 text-[11px] text-gray-400">{sup.contact}</span>}
                              </button>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={openAddSupplier}
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
                        <th className="px-2 py-3 w-24">Qty</th>
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
                          <td className="px-2 py-3">
                            <input type="number" placeholder="Qty" value={item.qty} onChange={e => updateLine(item.id, 'qty', e.target.value)} className="w-full h-8 border border-gray-100 rounded bg-white px-2 text-[11px] text-gray-600 focus:outline-none focus:border-purple-400 placeholder:text-gray-300 text-center" />
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

                {/* Attachments */}
                <div className="border border-dashed border-gray-300 rounded-lg bg-white p-3 space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  {attachments.length > 0 && (
                    <div className="space-y-1.5">
                      {attachments.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          {item.preview ? (
                            <img src={item.preview} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 bg-red-50 rounded flex items-center justify-center flex-shrink-0">
                              <FileText size={16} className="text-red-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-gray-700 truncate">{item.file.name}</p>
                            <p className="text-[10px] text-gray-400">{formatFileSize(item.file.size)}</p>
                          </div>
                          <button onClick={() => removeAttachment(idx)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1 py-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-all"
                  >
                    <p className="text-[11px] font-bold text-[#AE00FF]">
                      {attachments.length > 0 ? '+ Add More Files' : 'Add Attachments'}
                    </p>
                    <p className="text-[10px] text-gray-400">Images · PDF · Docs · Max 20MB each</p>
                  </div>
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
                      <span>{filterDateFrom ? format(filterDateFrom, 'dd/MM/yy') : 'From'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {filterDateFrom && (
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); setFilterDateFrom(undefined); }}
                          className="text-white/70 hover:text-white cursor-pointer"
                        >
                          <X size={12} />
                        </span>
                      )}
                      <ChevronDown size={14} className="text-white" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-gray-100" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDateFrom}
                      onSelect={setFilterDateFrom}
                      initialFocus
                      className="rounded-xl"
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger className="flex items-center justify-between bg-black text-white px-4 py-2.5 rounded-lg text-[12px] font-medium w-44 shadow-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={14} className="text-white" />
                      <span>{filterDateTo ? format(filterDateTo, 'dd/MM/yy') : 'To'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {filterDateTo && (
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); setFilterDateTo(undefined); }}
                          className="text-white/70 hover:text-white cursor-pointer"
                        >
                          <X size={12} />
                        </span>
                      )}
                      <ChevronDown size={14} className="text-white" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-gray-100" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDateTo}
                      onSelect={setFilterDateTo}
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
                    placeholder="Search by ref or account name"
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
                      <th className="px-4 py-4">Account Name</th>
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
                        <td colSpan={7} className="px-6 py-10 text-center text-[13px] text-gray-400">
                          No expenses match your filters.
                        </td>
                      </tr>
                    ) : null}
                    {filteredHistory.map((row: any, idx: number) => (
                      <tr 
                        key={idx} 
                        onClick={() => {
                          setSelectedExpense(row);
                          setSelectedAttachmentUrls([]);
                          setActiveTab('details');
                        }}
                        className={`cursor-pointer transition-colors hover:bg-purple-50 ${idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}
                      >
                        <td className="px-6 py-4 text-[12px] text-gray-500">{row.category}</td>
                        <td className="px-4 py-4 text-[12px] text-gray-500">{row.expenseName || '—'}</td>
                        <td className="px-4 py-4 text-[12px] text-gray-500">{row.ref}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {renderAccountIcon(row.accountType)}
                            <span className="text-[12px] text-gray-500">{row.account}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[12px] text-gray-500 font-medium">{row.amount ?? row.val1}</td>
                        <td className="px-4 py-4 text-[12px] text-gray-500">{row.tax ?? row.val2}</td>
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
                {selectedExpense.expenseName && (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-gray-500">Account Name</span>
                    <div className="flex-1 border-b border-dashed border-gray-200 mx-4 relative top-1"></div>
                    <span className="text-[13px] text-gray-600">{selectedExpense.expenseName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-gray-500">Account Paid From</span>
                  <div className="flex-1 border-b border-dashed border-gray-200 mx-4 relative top-1"></div>
                  <div className="flex items-center gap-2">
                    {renderAccountIcon(selectedExpense.accountType)}
                    <span className="text-[13px] text-gray-600">{selectedExpense.account}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-gray-500">Date</span>
                  <div className="flex-1 border-b border-dashed border-gray-200 mx-4 relative top-1"></div>
                  <span className="text-[13px] text-gray-600">{selectedExpense.date}</span>
                </div>
                {selectedExpense.supplier && (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-gray-500">Supplier</span>
                    <div className="flex-1 border-b border-dashed border-gray-200 mx-4 relative top-1"></div>
                    <span className="text-[13px] text-gray-600">{selectedExpense.supplier}</span>
                  </div>
                )}
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
                    {selectedExpense.lineItems && selectedExpense.lineItems.length > 0 ? (
                      selectedExpense.lineItems.map((item: ExpenseLineItem, idx: number) => (
                        <tr key={idx} className="border-b border-gray-50">
                          <td className="px-6 py-4 text-[12px] text-gray-600">{item.product || '—'}</td>
                          <td className="px-6 py-4 text-[12px] text-gray-600 text-center">{item.description || '—'}</td>
                          <td className="px-6 py-4 text-[12px] text-gray-600 text-center">{item.quantity}</td>
                          <td className="px-6 py-4 text-[12px] text-gray-600 text-center">{item.tax}</td>
                          <td className="px-6 py-4 text-[12px] text-gray-600 text-right">{item.amount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-gray-50">
                        <td className="px-6 py-4 text-[12px] text-gray-600">{selectedExpense.category}</td>
                        <td className="px-6 py-4 text-[12px] text-gray-600 text-center">—</td>
                        <td className="px-6 py-4 text-[12px] text-gray-600 text-center">1</td>
                        <td className="px-6 py-4 text-[12px] text-gray-600 text-center">{selectedExpense.tax ?? '—'}</td>
                        <td className="px-6 py-4 text-[12px] text-gray-600 text-right">{selectedExpense.amount ?? selectedExpense.val1}</td>
                      </tr>
                    )}
                    <tr className="bg-[#FAFAFA]">
                      <td colSpan={4} className="px-6 py-4 text-[13px] font-bold text-gray-800">Grand Total</td>
                      <td className="px-6 py-4 text-[13px] font-bold text-gray-800 text-right">{selectedExpense.amount ?? selectedExpense.val1}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-gray-600 mb-2">Notes</h3>
                <p className="text-[12px] text-gray-400 leading-relaxed max-w-3xl">
                  {selectedExpense.notes && selectedExpense.notes.trim().length > 0
                    ? selectedExpense.notes
                    : 'No notes recorded for this entry.'}
                </p>
              </div>

              {/* Attachments */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-bold text-gray-600">Attachments</h3>
                  {(selectedExpense.attachmentUrls?.length > 0) && (
                    <div className="flex items-center gap-4">
                      {selectedAttachmentUrls.length > 0 && (
                        <button
                          onClick={() => selectedAttachmentUrls.forEach(url => window.open(getDownloadUrl(url), '_blank'))}
                          className="flex items-center gap-1.5 text-[12px] font-bold text-[#AE00FF] hover:underline"
                        >
                          <Download size={13} />
                          Download Selected ({selectedAttachmentUrls.length})
                        </button>
                      )}
                      <button
                        onClick={() => (selectedExpense.attachmentUrls as string[]).forEach((url: string) => window.open(getDownloadUrl(url), '_blank'))}
                        className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500 hover:underline"
                      >
                        <Download size={13} />
                        Download All
                      </button>
                    </div>
                  )}
                </div>
                {(!selectedExpense.attachmentUrls || selectedExpense.attachmentUrls.length === 0) ? (
                  <p className="text-[12px] text-gray-400">No attachments uploaded for this expense.</p>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {(selectedExpense.attachmentUrls as string[]).map((url: string, idx: number) => {
                      const isImg = isImageUrl(url);
                      const isPdf = isPdfUrl(url);
                      const isSelected = selectedAttachmentUrls.includes(url);
                      const fileName = decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? `file-${idx + 1}`);
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedAttachmentUrls(prev =>
                            prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
                          )}
                          className={`relative rounded-xl border-2 cursor-pointer overflow-hidden transition-all ${isSelected ? 'border-[#AE00FF] shadow-md shadow-purple-100' : 'border-gray-100 hover:border-purple-200'}`}
                          style={{ width: 160 }}
                        >
                          {/* Selection indicator */}
                          <div className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${isSelected ? 'bg-[#AE00FF] border-[#AE00FF] text-white' : 'bg-white/80 border-gray-300 text-transparent'}`}>
                            ✓
                          </div>
                          {/* Preview */}
                          {isImg ? (
                            <img src={url} alt={fileName} className="w-full h-24 object-cover" />
                          ) : isPdf ? (
                            <div className="w-full h-24 bg-red-50 flex flex-col items-center justify-center gap-1">
                              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <FileText size={20} className="text-red-500" />
                              </div>
                              <span className="text-[10px] text-red-400 font-bold">PDF</span>
                            </div>
                          ) : (
                            <div className="w-full h-24 bg-gray-50 flex flex-col items-center justify-center gap-1">
                              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                <FileText size={20} className="text-gray-500" />
                              </div>
                              <span className="text-[10px] text-gray-400 font-bold">DOC</span>
                            </div>
                          )}
                          {/* Footer */}
                          <div className="p-2 bg-white">
                            <p className="text-[10px] font-bold text-gray-600 truncate mb-1">{fileName}</p>
                            <div className="flex items-center justify-between">
                              <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[10px] text-blue-500 hover:underline">View</a>
                              <a href={getDownloadUrl(url)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-0.5 text-[10px] text-[#AE00FF] hover:underline">
                                <Download size={10} /> Save
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recorded by */}
              <div>
                <h3 className="text-[13px] font-medium text-gray-500 mb-3">Recorded by</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-[14px] font-bold text-gray-500">
                    {(selectedExpense.createdBy ?? '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-700">{selectedExpense.createdBy || 'Unknown'}</p>
                    <p className="text-[11px] text-gray-400">Accounting</p>
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
                <div className="relative w-[300px]">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    value={supplierTabSearch}
                    onChange={e => setSupplierTabSearch(e.target.value)}
                    placeholder="Search by supplier name"
                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#AE00FF] transition-all text-gray-600 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl overflow-hidden border border-gray-50">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#EBEBEB] text-gray-500 text-[12px] font-bold">
                      <th className="px-6 py-4 w-[30%]">Supplier Name</th>
                      <th className="px-6 py-4 w-[28%]">Contact</th>
                      <th className="px-6 py-4 w-[24%]">Payable Balance</th>
                      <th className="px-6 py-4 w-[18%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.filter(s => !supplierTabSearch || s.name.toLowerCase().includes(supplierTabSearch.toLowerCase())).map((row, idx) => (
                      <tr key={row.id ?? idx} className={`${idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}>
                        <td className="px-6 py-5 text-[12px] text-gray-500">{row.name}</td>
                        <td className="px-6 py-5 text-[12px] text-gray-500">{row.contact}</td>
                        <td className="px-6 py-5 text-[12px] text-gray-500">{row.balance}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditSupplier(row)}
                              disabled={!row.id}
                              className="p-2 text-gray-400 hover:text-[#AE00FF] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Edit supplier"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteSupplier(row.id)}
                              disabled={!row.id}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Delete supplier"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>



      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-[420px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">{editingAccountId ? 'Edit Account' : 'Add New Account'}</h3>
              <button onClick={resetAccountForm} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-full"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {/* Logo upload */}
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">Bank Logo <span className="text-gray-400 font-normal">(optional)</span></label>
                <input ref={bankLogoInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (bankLogoPreview) URL.revokeObjectURL(bankLogoPreview);
                    setBankLogoFile(f);
                    setBankLogoPreview(URL.createObjectURL(f));
                  }
                }} />
                <div
                  onClick={() => bankLogoInputRef.current?.click()}
                  className="border border-dashed border-gray-200 rounded-xl h-24 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-all"
                >
                  {bankLogoPreview ? (
                    <div className="flex items-center gap-3">
                      <img src={bankLogoPreview} className="h-14 w-14 object-contain rounded-lg border border-gray-100" alt="Logo preview" />
                      <button
                        onClick={e => { e.stopPropagation(); URL.revokeObjectURL(bankLogoPreview); setBankLogoFile(null); setBankLogoPreview(''); }}
                        className="text-[11px] text-red-400 hover:text-red-500 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
                        <Upload size={14} className="text-purple-500" />
                      </div>
                      <p className="text-[11px] text-gray-400">Click to upload bank logo</p>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">Bank Name</label>
                <input type="text" placeholder="e.g. Zenith Bank" value={newAccount.bankName} onChange={e => setNewAccount({...newAccount, bankName: e.target.value})} className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[13px] text-gray-700 focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">Account Number</label>
                <input type="text" placeholder="0123456789" value={newAccount.accountNumber} onChange={e => setNewAccount({...newAccount, accountNumber: e.target.value})} className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[13px] text-gray-700 focus:outline-none focus:border-purple-400" />
              </div>
              <button disabled={savingAccount} onClick={handleAddAccount} className="w-full py-3.5 bg-[#AE00FF] text-white rounded-xl text-[13px] font-bold mt-4 hover:bg-[#9900E6] transition-colors shadow-md shadow-purple-100 disabled:opacity-50">
                {savingAccount ? 'Saving…' : editingAccountId ? 'Update Account' : 'Add Account'}
              </button>

              {/* Existing accounts — manage (edit / delete) */}
              {accounts.length > 0 && (
                <div className="pt-4 mt-2 border-t border-gray-100">
                  <p className="text-[12px] font-bold text-gray-500 mb-2">Existing Accounts</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {accounts.map(acc => (
                      <div key={acc.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${editingAccountId === acc.id ? 'bg-purple-50' : 'bg-gray-50'}`}>
                        <span className="text-[12px] text-gray-700 truncate">{acc.name}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => openEditAccount(acc)} className="p-1.5 text-gray-400 hover:text-[#AE00FF] transition-colors" title="Edit account">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteAccount(acc.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete account">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-[400px] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">{editingSupplierId ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button onClick={() => { setSupplierModalOpen(false); setEditingSupplierId(null); }} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-full"><X size={18} /></button>
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
              <button disabled={savingSupplier} onClick={handleAddSupplier} className="w-full py-3.5 bg-[#AE00FF] text-white rounded-xl text-[13px] font-bold mt-4 hover:bg-[#9900E6] transition-colors shadow-md shadow-purple-100 disabled:opacity-50">
                {savingSupplier ? 'Saving…' : editingSupplierId ? 'Update Supplier' : 'Add Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}