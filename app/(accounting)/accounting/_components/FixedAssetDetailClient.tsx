'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Trash2, Archive } from 'lucide-react';
import {
  disposeFixedAssetAction,
  deleteFixedAssetAction,
} from '@/modules/finance/actions/fixed-assets.action';
import type { FixedAssetDetail } from '@/modules/finance/services/fixed-assets.service';

const statusStyles: Record<FixedAssetDetail['status'], string> = {
  Active: 'text-[#E65100] bg-[#FFF3E0]',
  Disposed: 'text-red-600 bg-red-50',
  Idle: 'text-yellow-700 bg-yellow-50',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11.5px] text-gray-500">{label}</p>
      <p className="text-[13px] text-gray-800 font-medium">{value ?? '—'}</p>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
      <p className="text-[11.5px] text-gray-500 mb-1">{label}</p>
      <p className={`text-[18px] font-bold ${accent ?? 'text-gray-800'}`}>{value}</p>
    </div>
  );
}

function accountLine(name: string | null, code: string | null): string {
  if (!name) return '—';
  return code ? `${code} — ${name}` : name;
}

export function FixedAssetDetailClient({ asset }: { asset: FixedAssetDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | 'dispose' | 'delete'>(null);

  const handleDispose = async () => {
    if (asset.status === 'Disposed') return;
    if (!confirm(`Mark "${asset.assetName}" as disposed? This stops further depreciation.`)) return;
    setBusy('dispose');
    const res = await disposeFixedAssetAction(asset.id);
    setBusy(null);
    if (res && 'error' in res) {
      alert(res.error);
      return;
    }
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${asset.assetName}" from the register? This cannot be undone.`)) return;
    setBusy('delete');
    const res = await deleteFixedAssetAction(asset.id);
    setBusy(null);
    if (res && 'error' in res) {
      alert(res.error);
      return;
    }
    router.push('/accounting/accounting-ledger?tab=Fixed+Assets');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
      <div className="max-w-[900px] mx-auto space-y-6">

        {/* ── Back ── */}
        <button
          onClick={() => router.push('/accounting/accounting-ledger?tab=Fixed+Assets')}
          className="flex items-center gap-2 text-[13px] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Fixed Assets
        </button>

        {/* ── Header card ── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[22px] font-bold text-gray-800">{asset.assetName}</h1>
                <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-medium ${statusStyles[asset.status]}`}>
                  <Zap size={12} className="fill-current" />
                  {asset.status === 'Active' ? 'Depreciating' : asset.status}
                </span>
              </div>
              {asset.assetAccountCode && (
                <p className="text-[13px] text-gray-500 mt-1">{asset.assetAccountCode}</p>
              )}
              <p className="text-[13px] text-gray-500">
                {asset.nonDepreciable
                  ? 'Non-depreciable'
                  : `${asset.depreciationMethod ?? '—'}${asset.usefulLifeYears ? `, ${asset.usefulLifeYears} years` : ''}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDispose}
                disabled={busy !== null || asset.status === 'Disposed'}
                className="flex items-center gap-1.5 h-9 px-4 border border-gray-300 text-gray-700 rounded text-[13px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Archive size={14} />
                {busy === 'dispose' ? 'Disposing…' : asset.status === 'Disposed' ? 'Disposed' : 'Dispose'}
              </button>
              <button
                onClick={handleDelete}
                disabled={busy !== null}
                className="flex items-center gap-1.5 h-9 px-4 border border-red-200 text-red-600 rounded text-[13px] font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                {busy === 'delete' ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>

          {/* ── Summary figures ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 py-5">
            <SummaryCard label="Purchase price" value={asset.purchasePrice} />
            <SummaryCard
              label="Accumulated depreciation to date"
              value={asset.accumulatedDepreciation}
              accent="text-red-500"
            />
            <SummaryCard label="Remaining value" value={asset.remainingValue} accent="text-green-700" />
          </div>
        </div>

        {/* ── Details ── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-5">
          <h2 className="text-[14px] font-bold text-gray-800 mb-4">Asset details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <Field label="Purchase date" value={asset.purchaseDate} />
            <Field label="Depreciation start" value={asset.depreciationStartDate} />
            <Field label="Depreciation method" value={asset.nonDepreciable ? 'Non-depreciable' : asset.depreciationMethod} />
            <Field label="Useful life" value={asset.usefulLifeYears ? `${asset.usefulLifeYears} years` : '—'} />
            <Field label="Salvage value" value={asset.salvageValue} />
            <Field label="Added on" value={asset.createdAt} />
            {asset.disposedAt && <Field label="Disposed on" value={asset.disposedAt} />}
          </div>
          {asset.description && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-[11.5px] text-gray-500 mb-1">Description</p>
              <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{asset.description}</p>
            </div>
          )}
        </div>

        {/* ── Account mappings ── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-5">
          <h2 className="text-[14px] font-bold text-gray-800 mb-4">Account mappings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Field label="Non-current asset account" value={accountLine(asset.assetAccount, asset.assetAccountCode)} />
            <Field
              label="Accumulated depreciation account"
              value={accountLine(asset.accumDepreciationAccount, asset.accumDepreciationCode)}
            />
            <Field
              label="Depreciation expense account"
              value={accountLine(asset.depExpenseAccount, asset.depExpenseCode)}
            />
          </div>
        </div>

        {/* ── Depreciation schedule ── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <h2 className="text-[14px] font-bold text-gray-800 px-6 py-5 border-b border-gray-100">
            Depreciation schedule
          </h2>
          {asset.schedule.length === 0 ? (
            <p className="text-[13px] text-gray-400 px-6 py-10 text-center">
              {asset.nonDepreciable
                ? 'This asset is non-depreciable, so it has no depreciation schedule.'
                : 'No depreciation schedule available.'}
            </p>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                  <th className="px-6 py-3">Year</th>
                  <th className="px-6 py-3">Asset value</th>
                  <th className="px-6 py-3">Depreciation</th>
                  <th className="px-6 py-3">Remaining value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {asset.schedule.map((row) => (
                  <tr key={row.year} className="text-gray-800">
                    <td className="px-6 py-4 font-medium">{row.year}</td>
                    <td className="px-6 py-4">{row.openingValue}</td>
                    <td className="px-6 py-4">{row.depreciation}</td>
                    <td className="px-6 py-4">{row.remainingValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
