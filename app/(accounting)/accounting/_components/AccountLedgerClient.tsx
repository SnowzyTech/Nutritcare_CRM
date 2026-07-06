'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import type { LedgerRow } from '@/modules/finance/services/ledger.service';

interface AccountLedgerClientProps {
  account: string;
  name: string;
  rows: LedgerRow[];
  // Identifies the clicked entry so it can be highlighted: `ref|date|debit|credit`.
  highlightKey?: string;
}

const rowKey = (r: LedgerRow) => `${r.ref}|${r.date}|${r.debit}|${r.credit}`;

export function AccountLedgerClient({ account, name, rows, highlightKey }: AccountLedgerClientProps) {
  const router = useRouter();
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  // Bring the clicked entry into view once the table renders.
  useEffect(() => {
    highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightKey]);

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-[#F9FAFB]">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[13px] font-bold text-purple-500 hover:text-purple-700 transition-colors mb-6"
      >
        <span className="p-1.5 bg-purple-50 rounded-lg"><ChevronLeft size={18} /></span>
        Back to General Ledger
      </button>

      <div className="mb-8">
        <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wide mb-1">Account Ledger</p>
        <h1 className="text-[30px] font-bold text-gray-800 tracking-tight">{name || account || 'Account'}</h1>
        {name && account && (
          <span className="inline-block mt-2 text-[12px] font-bold px-3 py-1 rounded-full bg-purple-50 text-[#AE00FF] uppercase tracking-wide">
            {account}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl overflow-hidden border border-gray-50 mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 text-[13px] font-bold text-gray-600 border-b border-gray-100">
              <th className="px-8 py-5">Account</th>
              <th className="px-8 py-5">Account Name</th>
              <th className="px-8 py-5">Ref</th>
              <th className="px-8 py-5">Description</th>
              <th className="px-8 py-5 text-right">Debit</th>
              <th className="px-8 py-5 text-right">Credit</th>
              <th className="px-8 py-5 text-right">Balance</th>
              <th className="px-8 py-5">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center text-[15px] text-gray-400">
                  No ledger entries found for this account.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const isHighlight = highlightKey != null && rowKey(row) === highlightKey;
                return (
                  <tr
                    key={idx}
                    ref={isHighlight ? highlightRef : undefined}
                    className={
                      isHighlight
                        ? 'bg-purple-50 ring-2 ring-inset ring-[#AE00FF]/40'
                        : `${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'} hover:bg-purple-50/30 transition-colors`
                    }
                  >
                    <td className="px-8 py-6 text-[14px] text-gray-700 font-bold">{row.account}</td>
                    <td className="px-8 py-6 text-[14px] text-gray-500">{row.name}</td>
                    <td className="px-8 py-6 text-[13px] text-gray-400 font-mono">{row.ref}</td>
                    <td className="px-8 py-6 text-[13px] text-gray-500">{row.description || '—'}</td>
                    <td className="px-8 py-6 text-[14px] text-green-600 font-bold text-right">{row.debit}</td>
                    <td className="px-8 py-6 text-[14px] text-red-500 font-bold text-right">{row.credit}</td>
                    <td className="px-8 py-6 text-[14px] text-gray-700 font-bold text-right">{row.balance}</td>
                    <td className="px-8 py-6 text-[14px] text-gray-400 font-medium">{row.date}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[13px] text-gray-400 font-medium">
        {rows.length} entr{rows.length === 1 ? 'y' : 'ies'} in this account
      </p>
    </div>
  );
}
