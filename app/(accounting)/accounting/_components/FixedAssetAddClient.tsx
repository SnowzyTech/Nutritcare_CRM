'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, ChevronDown, Info, MessageSquare, Zap } from 'lucide-react';
import { createFixedAssetAction } from '@/modules/finance/actions/fixed-assets.action';
import {
  buildSchedule,
  accumulatedDepreciationAsOf,
  type DepreciationMethod,
} from '@/modules/finance/lib/depreciation';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AccountOption {
  code: string;
  name: string;
}

interface FixedAssetAddClientProps {
  assetAccounts: AccountOption[];
  accumDepAccounts: AccountOption[];
  depExpenseAccounts: AccountOption[];
}

interface SetupForm {
  assetName: string;
  description: string;
  nonDepreciable: boolean;
  purchasePrice: string;
  purchaseDate: string;
  depreciationStartDate: string;
  depreciationMethod: DepreciationMethod;
  usefulLife: string;
  salvageValue: string;
  assetAccountCode: string;
  accumDepreciationCode: string;
  depExpenseCode: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseMoney = (s: string): number => {
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
};

const fmtMoney = (n: number): string =>
  `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDateLong = (d: Date): string =>
  d.toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' });

// ─── Shared input styles ─────────────────────────────────────────────────────

const inputCls =
  'w-full h-10 px-3 border border-gray-300 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-gray-400 placeholder:text-gray-400';

const selectCls =
  'w-full h-10 px-3 border border-gray-300 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-gray-400 appearance-none cursor-pointer';

// ─── InfoTooltip ─────────────────────────────────────────────────────────────

function InfoIcon() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 ml-1 cursor-help">
      <Info size={10} className="text-gray-400" />
    </span>
  );
}

// ─── Generic string SelectField ──────────────────────────────────────────────

function SelectField<T extends string>({
  value,
  onChange,
  options,
  id,
}: {
  value: T;
  onChange: (v: T) => void;
  options: T[];
  id: string;
}) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className={selectCls}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── Chart-of-Accounts SelectField (value = account code) ─────────────────────

function AccountSelectField({
  value,
  onChange,
  options,
  id,
}: {
  value: string;
  onChange: (code: string) => void;
  options: AccountOption[];
  id: string;
}) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        {options.length === 0 && <option value="">No accounts available</option>}
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.code} — {opt.name}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── DateField ───────────────────────────────────────────────────────────────

function DateField({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  return (
    <div className="relative">
      <input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} pr-9`} />
      <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FixedAssetAddClient({
  assetAccounts,
  accumDepAccounts,
  depExpenseAccounts,
}: FixedAssetAddClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Setup' | 'Schedule'>('Setup');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<SetupForm>({
    assetName: '',
    description: '',
    nonDepreciable: false,
    purchasePrice: '',
    purchaseDate: '',
    depreciationStartDate: '',
    depreciationMethod: 'Straight Line',
    usefulLife: '',
    salvageValue: '',
    assetAccountCode: assetAccounts[0]?.code ?? '',
    accumDepreciationCode: accumDepAccounts[0]?.code ?? '',
    depExpenseCode: depExpenseAccounts[0]?.code ?? '',
  });

  const set = <K extends keyof SetupForm>(key: K, value: SetupForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const findAccount = (opts: AccountOption[], code: string) => opts.find((o) => o.code === code);

  // ── Live depreciation schedule ────────────────────────────────────────────
  const purchasePriceNum = parseMoney(form.purchasePrice);
  const salvageNum = parseMoney(form.salvageValue);
  const usefulLifeNum = parseInt(form.usefulLife, 10) || 0;

  const schedule = useMemo(() => {
    if (form.nonDepreciable || !form.depreciationStartDate || usefulLifeNum <= 0) return [];
    return buildSchedule({
      purchasePrice: purchasePriceNum,
      salvageValue: salvageNum,
      usefulLifeYears: usefulLifeNum,
      depreciationStartDate: form.depreciationStartDate,
      method: form.depreciationMethod,
    });
  }, [
    form.nonDepreciable,
    form.depreciationStartDate,
    form.depreciationMethod,
    purchasePriceNum,
    salvageNum,
    usefulLifeNum,
  ]);

  const accumulatedToDate = useMemo(() => {
    if (form.nonDepreciable || !form.depreciationStartDate || usefulLifeNum <= 0) return 0;
    return accumulatedDepreciationAsOf({
      purchasePrice: purchasePriceNum,
      salvageValue: salvageNum,
      usefulLifeYears: usefulLifeNum,
      depreciationStartDate: form.depreciationStartDate,
      method: form.depreciationMethod,
    });
  }, [
    form.nonDepreciable,
    form.depreciationStartDate,
    form.depreciationMethod,
    purchasePriceNum,
    salvageNum,
    usefulLifeNum,
  ]);

  const remainingToDate = Math.max(salvageNum, purchasePriceNum - accumulatedToDate);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.assetName.trim()) {
      alert('Asset name is required.');
      return;
    }
    if (!form.purchaseDate) {
      alert('Purchase date is required.');
      return;
    }
    if (!form.assetAccountCode) {
      alert('Please select a non-current asset account.');
      return;
    }
    if (!form.nonDepreciable && (usefulLifeNum <= 0 || !form.depreciationMethod)) {
      alert('Useful life and depreciation method are required for a depreciable asset.');
      return;
    }

    const assetAcc = findAccount(assetAccounts, form.assetAccountCode);
    const accumAcc = findAccount(accumDepAccounts, form.accumDepreciationCode);
    const expAcc = findAccount(depExpenseAccounts, form.depExpenseCode);

    setSaving(true);
    const res = await createFixedAssetAction({
      assetName: form.assetName.trim(),
      description: form.description.trim() || undefined,
      nonDepreciable: form.nonDepreciable,
      purchasePrice: purchasePriceNum,
      purchaseDate: form.purchaseDate,
      depreciationStartDate: form.depreciationStartDate || undefined,
      depreciationMethod: form.nonDepreciable ? undefined : form.depreciationMethod,
      usefulLifeYears: form.nonDepreciable ? undefined : usefulLifeNum,
      salvageValue: salvageNum,
      assetAccount: assetAcc?.name ?? '',
      assetAccountCode: assetAcc?.code,
      accumDepreciationAccount: accumAcc?.name,
      accumDepreciationCode: accumAcc?.code,
      depExpenseAccount: expAcc?.name,
      depExpenseCode: expAcc?.code,
    });
    setSaving(false);

    if (res && 'error' in res) {
      alert(res.error);
      return;
    }

    router.push('/accounting/accounting-ledger?tab=Fixed+Assets');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-8 px-4 font-sans">
      {/* Panel card */}
      <div className="bg-white w-full max-w-[800px] rounded-sm shadow-lg flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>

        {/* ── Panel header ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <span className="text-[15px] font-bold text-gray-800">Fixed asset details</span>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-[12.5px] font-semibold text-green-600 hover:text-green-700 transition-colors">
              <MessageSquare size={14} className="text-green-600" />
              Give feedback
            </button>
            <button
              id="fixed-asset-add-close"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="px-6 flex-shrink-0">
          <div className="flex border-b border-gray-200">
            {(['Setup', 'Schedule'] as const).map((tab) => (
              <button
                key={tab}
                id={`fixed-asset-tab-${tab.toLowerCase()}`}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[13px] font-semibold transition-colors relative ${
                  activeTab === tab
                    ? 'text-gray-800 border border-gray-300 border-b-white -mb-px bg-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ scrollbarWidth: 'thin' }}>

          {activeTab === 'Setup' && (
            <>
              {/* Asset name */}
              <div className="space-y-1">
                <label htmlFor="fa-asset-name" className="block text-[12.5px] text-gray-600">
                  Asset name<span className="text-red-500">*</span>
                </label>
                <input
                  id="fa-asset-name"
                  type="text"
                  value={form.assetName}
                  onChange={(e) => set('assetName', e.target.value)}
                  placeholder="e.g. LAPTOP"
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label htmlFor="fa-description" className="block text-[12.5px] text-gray-600">
                  Description
                </label>
                <textarea
                  id="fa-description"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-gray-400 resize-y"
                />
              </div>

              {/* Divider */}
              <hr className="border-gray-200 my-2" />

              {/* Depreciation details */}
              <div>
                <p className="text-[12.5px] text-gray-600 mb-3">Depreciation details</p>

                {/* Non-depreciable checkbox */}
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input
                    id="fa-non-depreciable"
                    type="checkbox"
                    checked={form.nonDepreciable}
                    onChange={(e) => set('nonDepreciable', e.target.checked)}
                    className="w-4 h-4 border-gray-300 rounded accent-green-600"
                  />
                  <span className="text-[12.5px] text-gray-600">Non-depreciable asset</span>
                </label>

                {!form.nonDepreciable && (
                  <div className="space-y-3">
                    {/* Purchase price | Purchase date */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="fa-purchase-price" className="block text-[11.5px] text-gray-500">
                          Purchase price
                        </label>
                        <input
                          id="fa-purchase-price"
                          type="text"
                          inputMode="decimal"
                          value={form.purchasePrice}
                          onChange={(e) => set('purchasePrice', e.target.value)}
                          placeholder="₦0.00"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="fa-purchase-date" className="block text-[11.5px] text-gray-500">
                          Purchase date
                        </label>
                        <DateField id="fa-purchase-date" value={form.purchaseDate} onChange={(v) => set('purchaseDate', v)} />
                      </div>
                    </div>

                    {/* Depreciation start date | Depreciation method */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="fa-dep-start" className="block text-[11.5px] text-gray-500">
                          Depreciation start date
                        </label>
                        <DateField id="fa-dep-start" value={form.depreciationStartDate} onChange={(v) => set('depreciationStartDate', v)} />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="fa-dep-method" className="block text-[11.5px] text-gray-500">
                          Depreciation method
                        </label>
                        <SelectField
                          id="fa-dep-method"
                          value={form.depreciationMethod}
                          onChange={(v) => set('depreciationMethod', v)}
                          options={['Straight Line', 'Declining Balance', 'Sum of Years']}
                        />
                      </div>
                    </div>

                    {/* Useful life | Salvage value */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="fa-useful-life" className="block text-[11.5px] text-gray-500">
                          Useful life (years)
                        </label>
                        <input
                          id="fa-useful-life"
                          type="number"
                          min={1}
                          value={form.usefulLife}
                          onChange={(e) => set('usefulLife', e.target.value)}
                          placeholder="e.g. 3"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="fa-salvage" className="block text-[11.5px] text-gray-500">
                          Salvage value
                        </label>
                        <input
                          id="fa-salvage"
                          type="text"
                          inputMode="decimal"
                          value={form.salvageValue}
                          onChange={(e) => set('salvageValue', e.target.value)}
                          placeholder="₦1.00"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <hr className="border-gray-200 my-2" />

              {/* Accounts details */}
              <div className="space-y-4">
                <p className="text-[12.5px] text-gray-600">Accounts details</p>

                {/* Non-Current Asset Account */}
                <div className="space-y-1">
                  <p className="text-[13px] font-bold text-gray-700">Non-Current Asset Account</p>
                  <AccountSelectField
                    id="fa-asset-account"
                    value={form.assetAccountCode}
                    onChange={(v) => set('assetAccountCode', v)}
                    options={assetAccounts}
                  />
                </div>

                {!form.nonDepreciable && (
                  <>
                    {/* Accumulated depreciation account */}
                    <div className="space-y-1">
                      <p className="text-[12.5px] text-gray-600 flex items-center">
                        Accumulated depreciation account
                        <InfoIcon />
                      </p>
                      <AccountSelectField
                        id="fa-accum-dep-account"
                        value={form.accumDepreciationCode}
                        onChange={(v) => set('accumDepreciationCode', v)}
                        options={accumDepAccounts}
                      />
                    </div>

                    {/* Depreciation expense account */}
                    <div className="space-y-1">
                      <p className="text-[12.5px] text-gray-600 flex items-center">
                        Depreciation expense account
                        <InfoIcon />
                      </p>
                      <AccountSelectField
                        id="fa-dep-expense-account"
                        value={form.depExpenseCode}
                        onChange={(v) => set('depExpenseCode', v)}
                        options={depExpenseAccounts}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Bottom spacer so content doesn't hide behind sticky footer */}
              <div className="h-4" />
            </>
          )}

          {activeTab === 'Schedule' && (
            <div className="space-y-6">
              {/* Asset Summary Header */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-[18px] text-gray-800 font-medium">{form.assetName || 'Untitled asset'}</h2>
                    {form.assetAccountCode && (
                      <p className="text-[13px] text-gray-500 mt-1">{form.assetAccountCode}</p>
                    )}
                    <p className="text-[13px] text-gray-500">
                      {form.nonDepreciable
                        ? 'Non-depreciable'
                        : `${form.depreciationMethod}${usefulLifeNum ? `, ${usefulLifeNum} years` : ''}`}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded ${
                      form.nonDepreciable ? 'text-gray-600 bg-gray-100' : 'text-[#E65100] bg-[#FFF3E0]'
                    }`}
                  >
                    <Zap size={12} className="fill-current" />
                    <span className="text-[12px] font-medium">
                      {form.nonDepreciable ? 'Non-depreciable' : 'Depreciating'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-600">Purchase price</span>
                    <span className="text-gray-800">{fmtMoney(purchasePriceNum)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-600">Total depreciation as of {fmtDateLong(new Date())}</span>
                    <span className="text-gray-800">{fmtMoney(accumulatedToDate)}</span>
                  </div>
                  <hr className="border-gray-200 my-2" />
                  <div className="flex justify-between text-[13px] font-medium">
                    <span className="text-gray-600">Remaining value</span>
                    <span className="text-gray-800">{fmtMoney(remainingToDate)}</span>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Schedule Table */}
              {schedule.length === 0 ? (
                <p className="text-[13px] text-gray-400 py-8 text-center">
                  Enter purchase price, depreciation start date, useful life and method on the Setup tab to see the
                  depreciation schedule.
                </p>
              ) : (
                <div className="w-full text-left text-[13px]">
                  <div className="grid grid-cols-4 font-medium text-gray-600 mb-4 pb-2 border-b border-gray-100">
                    <div>Year</div>
                    <div>Asset value</div>
                    <div>Depreciation</div>
                    <div>Remaining value</div>
                  </div>

                  <div className="space-y-6">
                    {schedule.map((row) => (
                      <div key={row.year} className="grid grid-cols-4 items-center text-gray-800">
                        <div className="font-medium">{row.year}</div>
                        <div>{fmtMoney(row.openingValue)}</div>
                        <div>{fmtMoney(row.depreciation)}</div>
                        <div className="flex items-center justify-between">
                          <span>{fmtMoney(row.remainingValue)}</span>
                          <ChevronDown size={14} className="text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Bottom spacer */}
              <div className="h-4" />
            </div>
          )}
        </div>

        {/* ── Sticky footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            id="fixed-asset-add-cancel"
            onClick={() => router.back()}
            className="text-[13px] font-semibold text-green-600 hover:text-green-700 transition-colors"
          >
            Cancel
          </button>
          <button
            id="fixed-asset-add-save"
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-6 bg-green-700 text-white rounded text-[13px] font-bold hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

      </div>
    </div>
  );
}
