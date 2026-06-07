'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircleMore,
  ChevronDown,
  Search,
  Plus,
} from 'lucide-react';
import { createSalaryRecordsAction } from '@/modules/finance/actions/salary.action';

// ─── Column definitions (same as view page) ───────────────────────────────────

const COLUMNS = [
  { key: 'name',                label: 'Name',                    width: 120 },
  { key: 'department',          label: 'Department',              width: 110 },
  { key: 'designation',         label: 'Designation',             width: 110 },
  { key: 'level',               label: 'Level',                   width: 80  },
  { key: 'amount',              label: 'Amount',                  width: 100 },
  { key: 'basic',               label: 'Basic',                   width: 100 },
  { key: 'housingAllowance',    label: 'Housing\nAllowance',      width: 90  },
  { key: 'grossPay',            label: 'Gross Pay',               width: 100 },
  { key: 'transportation',      label: 'Transportation',          width: 110 },
  { key: 'wardrobe',            label: 'Wardrobe\nAllowance',     width: 90  },
  { key: 'utilityAllowance',    label: 'Utility\nAllowance',      width: 90  },
  { key: 'grossPayTotal',       label: 'Gross Pay',               width: 100 },
  { key: 'paye',                label: 'PAYE',                    width: 90  },
  { key: 'pension',             label: 'Pension',                 width: 90  },
  { key: 'hmo',                 label: 'HMO',                     width: 80  },
  { key: 'otherDeduction',      label: 'Other\nDeduction',        width: 90  },
  { key: 'netPay',              label: 'NET PAY',                 width: 100 },
  { key: 'bank',                label: 'Bank',                    width: 90  },
  { key: 'cash',                label: 'Cash',                    width: 80  },
  { key: 'zenithAccountNumber', label: 'Zenith Account\nNumber',  width: 110 },
  { key: 'remark',              label: 'Remark',                  width: 100 },
] as const;

type ColKey = (typeof COLUMNS)[number]['key'];

type SalaryDraftRow = Record<ColKey, string> & { id: string };

// ─── Static filter options ────────────────────────────────────────────────────

const NUCLE_OPTIONS = ['Nucle', 'Nutriticare'];
const DEPT_OPTIONS  = ['Media', 'Account', 'Data', 'Logistics'];
const LEVEL_OPTIONS = ['Executives', 'Admin', 'Team Leads', 'Staffs'];

// ─── Helper: empty row ────────────────────────────────────────────────────────

function emptyRow(id: string): SalaryDraftRow {
  const base: Record<string, string> = { id };
  COLUMNS.forEach((c) => { base[c.key] = ''; });
  return base as SalaryDraftRow;
}

const INITIAL_ROW_COUNT = 15;

// Monetary columns — parsed to numbers on save; the rest are stored as text.
const MONEY_KEYS: ColKey[] = [
  'amount', 'basic', 'housingAllowance', 'grossPay', 'transportation', 'wardrobe',
  'utilityAllowance', 'grossPayTotal', 'paye', 'pension', 'hmo', 'otherDeduction',
  'netPay', 'bank', 'cash',
];

// Strip currency symbols / commas so "₦300,000" → 300000.
function parseMoney(s: string): number {
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

// ─── Small filter dropdown ────────────────────────────────────────────────────

interface FDProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (v: string) => void;
  icon?: React.ReactNode;
}

function FilterDropdown({ id, label, value, options, isOpen, onToggle, onSelect, icon }: FDProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && isOpen) onToggle();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen, onToggle]);

  const display = value === 'All' ? label : value;

  return (
    <div className="relative" ref={ref}>
      <button
        id={id}
        onClick={onToggle}
        className="flex items-center gap-1.5 bg-black text-white h-9 px-3 rounded-md text-[12.5px] font-semibold justify-between hover:bg-gray-900 transition-colors"
        style={{ minWidth: label === 'Department' ? 106 : label === 'Level' ? 80 : 80 }}
      >
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="whitespace-nowrap">{display}</span>
        </div>
        <ChevronDown
          size={12}
          strokeWidth={2.5}
          className={`transition-transform flex-shrink-0 ml-1 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1.5 min-w-[160px]">
          <div
            className={`px-4 py-2 text-[13px] hover:bg-gray-50 cursor-pointer font-medium ${value === 'All' ? 'text-[#AE00FF] font-bold' : 'text-gray-600'}`}
            onClick={() => onSelect('All')}
          >
            All
          </div>
          {options.map((opt) => (
            <div
              key={opt}
              className={`px-4 py-2 text-[13px] hover:bg-gray-50 cursor-pointer font-medium ${value === opt ? 'text-[#AE00FF] font-bold' : 'text-gray-600'}`}
              onClick={() => onSelect(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SalaryAddClient() {
  const router = useRouter();

  // Editable rows state
  const [rows, setRows] = useState<SalaryDraftRow[]>(() =>
    Array.from({ length: INITIAL_ROW_COUNT }, (_, i) => emptyRow(String(i + 1)))
  );

  // Filter bar state (display only on this page)
  const [nucleFilter,      setNucleFilter]      = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [levelFilter,      setLevelFilter]      = useState('All');
  const [search,           setSearch]           = useState('');
  const [openDropdown,     setOpenDropdown]     = useState<string | null>(null);
  const [saving,           setSaving]           = useState(false);

  const toggleDropdown = (name: string) =>
    setOpenDropdown((prev) => (prev === name ? null : name));
  const closeAll = () => setOpenDropdown(null);

  // Update a single cell
  const updateCell = useCallback((rowId: string, col: ColKey, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [col]: value } : r))
    );
  }, []);

  // Add a new blank row
  const addRow = () => {
    setRows((prev) => [...prev, emptyRow(String(Date.now()))]);
  };

  // Save — collect non-empty rows (a row counts once it has a name), persist
  // them all in one batch, then navigate back to the list.
  const handleSave = async () => {
    const nonEmpty = rows.filter((r) => r.name.trim() !== '');
    if (nonEmpty.length === 0) {
      alert('Please fill in at least one row (Name is required) before saving.');
      return;
    }
    setSaving(true);

    const payloadRows = nonEmpty.map((r) => {
      const out: Record<string, string | number | undefined> = {
        name: r.name.trim(),
        department: r.department.trim() || undefined,
        designation: r.designation.trim() || undefined,
        level: r.level.trim() || undefined,
        zenithAccountNumber: r.zenithAccountNumber.trim() || undefined,
        remark: r.remark.trim() || undefined,
      };
      for (const k of MONEY_KEYS) out[k] = parseMoney(r[k]);
      return out;
    });

    const res = await createSalaryRecordsAction({
      company: nucleFilter !== 'All' ? nucleFilter : undefined,
      rows: payloadRows as never,
    });
    setSaving(false);

    if (res && 'error' in res) {
      alert(res.error);
      return;
    }
    router.push('/accounting/salary');
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F9FAFB] font-sans pb-20">

      {/* ── Top nav row ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            id="salary-add-nav-back"
            onClick={() => router.back()}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button id="salary-add-nav-forward" className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronRight size={20} />
          </button>
          <button id="salary-add-nav-refresh" className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
            <RotateCcw size={18} />
          </button>
        </div>
        <button
          id="salary-add-chat-btn"
          className="w-12 h-12 bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-105 transition-transform"
        >
          <MessageCircleMore size={24} fill="currentColor" />
        </button>
      </div>

      {/* ── Page title ── */}
      <h1 className="text-[32px] font-bold text-gray-800 mb-8 tracking-tight">Salary</h1>

      {/* ── Filter / action bar (matches design image) ── */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">

        {/* Nucle */}
        <FilterDropdown
          id="salary-add-filter-nucle"
          label="Nucle"
          value={nucleFilter}
          options={NUCLE_OPTIONS}
          isOpen={openDropdown === 'nucle'}
          onToggle={() => toggleDropdown('nucle')}
          onSelect={(v) => { setNucleFilter(v); closeAll(); }}
        />

        {/* Department — with a small icon to match image */}
        <FilterDropdown
          id="salary-add-filter-department"
          label="Department"
          value={departmentFilter}
          options={DEPT_OPTIONS}
          isOpen={openDropdown === 'department'}
          onToggle={() => toggleDropdown('department')}
          onSelect={(v) => { setDepartmentFilter(v); closeAll(); }}
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
              <rect x="1" y="1" width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>
              <rect x="7" y="1" width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>
              <rect x="1" y="7" width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>
              <rect x="7" y="7" width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>
            </svg>
          }
        />

        {/* Level */}
        <FilterDropdown
          id="salary-add-filter-level"
          label="Level"
          value={levelFilter}
          options={LEVEL_OPTIONS}
          isOpen={openDropdown === 'level'}
          onToggle={() => toggleDropdown('level')}
          onSelect={(v) => { setLevelFilter(v); closeAll(); }}
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
              <path d="M1 9h10M1 6h7M1 3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />

        {/* Save button — purple, same h-9 height */}
        <button
          id="salary-add-save-btn"
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-6 bg-[#AE00FF] text-white rounded-md text-[12.5px] font-bold hover:bg-[#9900E6] transition-colors shadow-sm shadow-purple-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        {/* Search */}
        <div className="relative ml-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="salary-add-search"
            type="text"
            placeholder="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 pr-4 w-48 bg-white border border-gray-200 rounded-md text-[12.5px] text-gray-500 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
          />
        </div>
      </div>

      {/* ── Editable table ── */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table
            className="w-full text-left border-collapse"
            style={{ minWidth: '1800px' }}
          >
            {/* Header */}
            <thead>
              <tr className="bg-[#E5E7EB]/80">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width, minWidth: col.width }}
                    className="px-3 py-3.5 text-[11.5px] font-bold text-gray-600 whitespace-pre-line leading-tight"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Editable body */}
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-50 ${rowIdx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}
                >
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-2 py-2">
                      <input
                        id={`salary-cell-${rowIdx}-${col.key}`}
                        type="text"
                        value={row[col.key]}
                        onChange={(e) => updateCell(row.id, col.key, e.target.value)}
                        placeholder=""
                        className="
                          w-full h-7 px-2
                          bg-gray-100
                          rounded
                          text-[12px] text-gray-700
                          border-0 outline-none
                          focus:bg-white focus:ring-1 focus:ring-[#AE00FF]/40
                          transition-all placeholder:text-gray-300
                        "
                      />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Add row button row */}
              <tr className="bg-white border-b border-gray-50">
                <td colSpan={COLUMNS.length} className="px-3 py-2">
                  <button
                    id="salary-add-row-btn"
                    onClick={addRow}
                    className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-[#AE00FF] transition-colors font-medium"
                  >
                    <Plus size={14} />
                    Add row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
