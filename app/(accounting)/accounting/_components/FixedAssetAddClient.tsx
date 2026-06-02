'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, ChevronDown, Info, MessageSquare, Zap, ChevronRight } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type DepreciationMethod = 'Straight Line' | 'Declining Balance' | 'Sum of Years';
type AssetAccount = 'Property, plant and equipment' | 'Motor vehicles' | 'Furniture and fittings' | 'Computer equipment';
type AccumAccount = 'Accumulated depreciation on property, plant and equipment' | 'Accumulated depreciation on motor vehicles' | 'Accumulated depreciation on furniture';
type DepExpAccount = 'Amortisation expense' | 'Depreciation expense' | 'Depreciation - motor vehicles';

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
  assetAccount: AssetAccount;
  accumDepreciationAccount: AccumAccount;
  depExpenseAccount: DepExpAccount;
}

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

// ─── SelectField ─────────────────────────────────────────────────────────────

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
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={selectCls}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
}

// ─── DateField ───────────────────────────────────────────────────────────────

function DateField({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  return (
    <div className="relative">
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} pr-9`}
      />
      <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FixedAssetAddClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Setup' | 'Schedule'>('Setup');

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
    assetAccount: 'Property, plant and equipment',
    accumDepreciationAccount: 'Accumulated depreciation on property, plant and equipment',
    depExpenseAccount: 'Amortisation expense',
  });

  const set = <K extends keyof SetupForm>(key: K, value: SetupForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.assetName.trim()) {
      alert('Asset name is required.');
      return;
    }
    // TODO: wire up server action
    router.back();
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
                          Useful life
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
                  <SelectField
                    id="fa-asset-account"
                    value={form.assetAccount}
                    onChange={(v) => set('assetAccount', v)}
                    options={[
                      'Property, plant and equipment',
                      'Motor vehicles',
                      'Furniture and fittings',
                      'Computer equipment',
                    ]}
                  />
                </div>

                {/* Accumulated depreciation account */}
                <div className="space-y-1">
                  <p className="text-[12.5px] text-gray-600 flex items-center">
                    Accumulated depreciation account
                    <InfoIcon />
                  </p>
                  <SelectField
                    id="fa-accum-dep-account"
                    value={form.accumDepreciationAccount}
                    onChange={(v) => set('accumDepreciationAccount', v)}
                    options={[
                      'Accumulated depreciation on property, plant and equipment',
                      'Accumulated depreciation on motor vehicles',
                      'Accumulated depreciation on furniture',
                    ]}
                  />
                </div>

                {/* Depreciation expense account */}
                <div className="space-y-1">
                  <p className="text-[12.5px] text-gray-600 flex items-center">
                    Depreciation expense account
                    <InfoIcon />
                  </p>
                  <SelectField
                    id="fa-dep-expense-account"
                    value={form.depExpenseAccount}
                    onChange={(v) => set('depExpenseAccount', v)}
                    options={[
                      'Amortisation expense',
                      'Depreciation expense',
                      'Depreciation - motor vehicles',
                    ]}
                  />
                </div>
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
                    <h2 className="text-[18px] text-gray-800 font-medium">LAPTOP</h2>
                    <p className="text-[13px] text-gray-500 mt-1">1255</p>
                    <p className="text-[13px] text-gray-500">Straight Line, 3 years</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#E65100] bg-[#FFF3E0] px-2 py-1 rounded">
                    <Zap size={12} className="fill-current" />
                    <span className="text-[12px] font-medium">Depreciating</span>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-600">Purchase price</span>
                    <span className="text-gray-800">₦600,000.00</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-600">Total depreciation as of June 01, 2026</span>
                    <span className="text-gray-800">₦0.00</span>
                  </div>
                  <hr className="border-gray-200 my-2" />
                  <div className="flex justify-between text-[13px] font-medium">
                    <span className="text-gray-600">Remaining value</span>
                    <span className="text-gray-800">₦600,000.00</span>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Schedule Table */}
              <div className="w-full text-left text-[13px]">
                <div className="grid grid-cols-4 font-medium text-gray-600 mb-4 pb-2">
                  <div>Year</div>
                  <div>Asset value</div>
                  <div>Depreciation</div>
                  <div>Remaining value</div>
                </div>

                <div className="space-y-6">
                  {/* 2026 */}
                  <div className="grid grid-cols-4 items-center text-gray-800">
                    <div className="font-medium">2026</div>
                    <div>₦600,000.00</div>
                    <div>₦116,666.47</div>
                    <div className="flex items-center justify-between">
                      <span>₦483,333.53</span>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>

                  {/* 2027 */}
                  <div className="grid grid-cols-4 items-center text-gray-800">
                    <div className="font-medium">2027</div>
                    <div>₦483,333.53</div>
                    <div>₦199,999.67</div>
                    <div className="flex items-center justify-between">
                      <span>₦283,333.86</span>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>

                  {/* 2028 */}
                  <div className="grid grid-cols-4 items-center text-gray-800">
                    <div className="font-medium">2028</div>
                    <div>₦283,333.86</div>
                    <div>₦199,999.67</div>
                    <div className="flex items-center justify-between">
                      <span>₦83,334.19</span>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>

                  {/* 2029 */}
                  <div className="grid grid-cols-4 items-center text-gray-800">
                    <div className="font-medium">2029</div>
                    <div>₦83,334.19</div>
                    <div>₦83,333.19</div>
                    <div className="flex items-center justify-between">
                      <span>₦1.00</span>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Bottom spacer */}
              <div className="h-4" />
            </div>
          )}
        </div>

        {/* ── Sticky footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          {activeTab === 'Setup' ? (
            <>
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
                className="h-9 px-6 bg-green-700 text-white rounded text-[13px] font-bold hover:bg-green-800 transition-colors"
              >
                Save
              </button>
            </>
          ) : (
             <div className="w-full flex justify-end">
                <button
                  className="flex items-center gap-2 h-9 px-4 border-2 border-green-700 text-green-700 rounded text-[13px] font-bold hover:bg-green-50 transition-colors"
                >
                  More Actions <ChevronDown size={16} />
                </button>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
