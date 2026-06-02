'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircleMore,
  ChevronDown,
  Search,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SalaryRow {
  id: string;
  name: string;
  department: string;
  designation: string;
  level: string;
  amount: string;
  basic: string;
  housingAllowance: string;
  grossPay: string;
  transportation: string;
  wardrobe: string;
  utilityAllowance: string;
  grossPayTotal: string;
  paye: string;
  pension: string;
  hmo: string;
  otherDeduction: string;
  netPay: string;
  bank: string;
  cash: string;
  zenithAccountNumber: string;
  remark: string;
}

interface SalaryClientProps {
  initialRows?: SalaryRow[];
}

// ─── Mock fallback data ───────────────────────────────────────────────────────

const FALLBACK_ROWS: SalaryRow[] = Array.from({ length: 18 }, (_, i) => ({
  id: String(i + 1),
  name: 'Deborah Peters',
  department: 'Accountants',
  designation: 'Accountants',
  level: 'Staff',
  amount: '₦300,000',
  basic: '₦300,000',
  housingAllowance: '₦300,000',
  grossPay: '₦300,000',
  transportation: '₦100,000',
  wardrobe: '₦100,000',
  utilityAllowance: '₦100,000',
  grossPayTotal: '₦100,000',
  paye: '₦10,000',
  pension: '₦10,000',
  hmo: '₦10,000',
  otherDeduction: '₦10,000',
  netPay: '₦100,000',
  bank: '₦60,000',
  cash: '₦40,000',
  zenithAccountNumber: '09287365276',
  remark: i === 0 ? '09287365276' : '--------',
}));

// ─── Columns definition ───────────────────────────────────────────────────────

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'department', label: 'Department' },
  { key: 'designation', label: 'Designation' },
  { key: 'level', label: 'Level' },
  { key: 'amount', label: 'Amount' },
  { key: 'basic', label: 'Basic' },
  { key: 'housingAllowance', label: 'Housing\nAllowance' },
  { key: 'grossPay', label: 'Gross Pay' },
  { key: 'transportation', label: 'Transportation' },
  { key: 'wardrobe', label: 'Wardrobe\nAllowance' },
  { key: 'utilityAllowance', label: 'Utility\nAllowance' },
  { key: 'grossPayTotal', label: 'Gross Pay' },
  { key: 'paye', label: 'PAYE' },
  { key: 'pension', label: 'Pension' },
  { key: 'hmo', label: 'HMO' },
  { key: 'otherDeduction', label: 'Other\nDeduction' },
  { key: 'netPay', label: 'NET PAY' },
  { key: 'bank', label: 'Bank' },
  { key: 'cash', label: 'Cash' },
  { key: 'zenithAccountNumber', label: 'Zenith Account\nNumber' },
  { key: 'remark', label: 'Remark' },
] as const;

type ColKey = (typeof COLUMNS)[number]['key'];

// ─── Static filter options (per spec) ────────────────────────────────────────

const NUCLE_OPTIONS   = ['Nucle', 'Nutriticare'];
const DEPT_OPTIONS    = ['Media', 'Account', 'Data', 'Logistics'];
const DESIG_OPTIONS   = ['Media Buyer', 'Graphics', 'Content Creation', 'Video Editors', 'Social Media Management'];
const LEVEL_OPTIONS   = ['Executives', 'Admin', 'Team Leads', 'Staffs'];

// ─── FilterDropdown component ─────────────────────────────────────────────────

interface FilterDropdownProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  allLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (v: string) => void;
}

function FilterDropdown({
  id,
  label,
  value,
  options,
  allLabel,
  isOpen,
  onToggle,
  onSelect,
}: FilterDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && isOpen) {
        onToggle();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, onToggle]);

  const display = value === 'All' ? label : value;

  return (
    <div className="relative" ref={ref}>
      {/* Button — matches image: black, rounded-md (6px), h-9, tight px-3 */}
      <button
        id={id}
        onClick={onToggle}
        className="flex items-center gap-1.5 bg-black text-white h-9 px-3 rounded-md text-[12.5px] font-semibold justify-between hover:bg-gray-900 transition-colors"
        style={{ minWidth: label === 'Designation' ? 110 : label === 'Department' ? 106 : label === 'Level' ? 80 : 80 }}
      >
        <span className="whitespace-nowrap">{display}</span>
        <ChevronDown
          size={12}
          strokeWidth={2.5}
          className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1.5 min-w-[160px]">
          {/* All option */}
          <div
            className={`px-4 py-2 text-[13px] hover:bg-gray-50 cursor-pointer font-medium ${
              value === 'All' ? 'text-[#AE00FF] font-bold' : 'text-gray-600'
            }`}
            onClick={() => onSelect('All')}
          >
            {allLabel}
          </div>
          {/* Individual options */}
          {options.map((opt) => (
            <div
              key={opt}
              className={`px-4 py-2 text-[13px] hover:bg-gray-50 cursor-pointer font-medium ${
                value === opt ? 'text-[#AE00FF] font-bold' : 'text-gray-600'
              }`}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function SalaryClient({ initialRows }: SalaryClientProps) {
  const router = useRouter();
  const rows: SalaryRow[] = initialRows && initialRows.length > 0 ? initialRows : FALLBACK_ROWS;

  // Filter state — 'All' means no filter applied
  const [nucleFilter,      setNucleFilter]      = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [designationFilter,setDesignationFilter]= useState('All');
  const [levelFilter,      setLevelFilter]      = useState('All');
  const [search,           setSearch]           = useState('');
  const [openDropdown,     setOpenDropdown]     = useState<string | null>(null);

  const toggleDropdown = (name: string) =>
    setOpenDropdown((prev) => (prev === name ? null : name));

  const closeAll = () => setOpenDropdown(null);

  // Filtered rows (filter by department for dept+nucle until backend maps nucle separately)
  const filtered = rows.filter((r) => {
    const matchDept  = departmentFilter === 'All' || r.department  === departmentFilter;
    const matchDesig = designationFilter === 'All' || r.designation === designationFilter;
    const matchLevel = levelFilter === 'All' || r.level === levelFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.designation.toLowerCase().includes(q);
    return matchDept && matchDesig && matchLevel && matchSearch;
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F9FAFB] font-sans pb-20">
      {/* ── Top nav row ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            id="salary-nav-back"
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            id="salary-nav-forward"
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <button
            id="salary-nav-refresh"
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw size={18} />
          </button>
        </div>
        <button
          id="salary-chat-btn"
          className="w-12 h-12 bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-105 transition-transform"
        >
          <MessageCircleMore size={24} fill="currentColor" />
        </button>
      </div>

      {/* ── Page title ── */}
      <h1 className="text-[32px] font-bold text-gray-800 mb-8 tracking-tight">Salary</h1>

      {/* ── Filter bar — matches image exactly ── */}
      <div className="flex flex-wrap items-center gap-2.5 mb-0">

        {/* Nucle */}
        <FilterDropdown
          id="salary-filter-nucle"
          label="Nucle"
          value={nucleFilter}
          options={NUCLE_OPTIONS}
          allLabel="All"
          isOpen={openDropdown === 'nucle'}
          onToggle={() => toggleDropdown('nucle')}
          onSelect={(v) => { setNucleFilter(v); closeAll(); }}
        />

        {/* Department */}
        <FilterDropdown
          id="salary-filter-department"
          label="Department"
          value={departmentFilter}
          options={DEPT_OPTIONS}
          allLabel="All"
          isOpen={openDropdown === 'department'}
          onToggle={() => toggleDropdown('department')}
          onSelect={(v) => { setDepartmentFilter(v); closeAll(); }}
        />

        {/* Designation */}
        <FilterDropdown
          id="salary-filter-designation"
          label="Designation"
          value={designationFilter}
          options={DESIG_OPTIONS}
          allLabel="All"
          isOpen={openDropdown === 'designation'}
          onToggle={() => toggleDropdown('designation')}
          onSelect={(v) => { setDesignationFilter(v); closeAll(); }}
        />

        {/* Level */}
        <FilterDropdown
          id="salary-filter-level"
          label="Level"
          value={levelFilter}
          options={LEVEL_OPTIONS}
          allLabel="All"
          isOpen={openDropdown === 'level'}
          onToggle={() => toggleDropdown('level')}
          onSelect={(v) => { setLevelFilter(v); closeAll(); }}
        />

        {/* Edit/Add — routes to the add page */}
        <button
          id="salary-edit-add-btn"
          onClick={() => router.push('/accounting/salary/add')}
          className="h-9 px-5 bg-[#AE00FF] text-white rounded-md text-[12.5px] font-bold hover:bg-[#9900E6] transition-colors shadow-sm shadow-purple-200 whitespace-nowrap"
        >
          Edit/Add
        </button>

        {/* Search — same height, border-radius */}
        <div className="relative ml-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="salary-search"
            type="text"
            placeholder="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 pr-4 w-48 bg-white border border-gray-200 rounded-md text-[12.5px] text-gray-500 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white overflow-hidden mt-4">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse" style={{ minWidth: '1600px' }}>
            <thead>
              <tr className="bg-[#E5E7EB]/80">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3.5 text-[11.5px] font-bold text-gray-600 whitespace-pre-line leading-tight"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50/60 transition-colors ${
                    idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                  }`}
                >
                  {COLUMNS.map((col) => {
                    const val = row[col.key as ColKey];
                    const isNetPay = col.key === 'netPay';
                    const isRemark = col.key === 'remark';
                    const isZenith = col.key === 'zenithAccountNumber';
                    const isName = col.key === 'name';

                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-4 text-[12.5px] whitespace-nowrap ${
                          isNetPay
                            ? 'font-black text-gray-900'
                            : isName
                            ? 'font-semibold text-gray-800'
                            : isRemark
                            ? 'text-gray-400 font-medium tracking-widest'
                            : isZenith
                            ? 'text-gray-700 font-medium'
                            : 'text-gray-600 font-medium'
                        }`}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="px-5 py-16 text-center text-[14px] text-gray-400 font-medium"
                  >
                    No salary records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
