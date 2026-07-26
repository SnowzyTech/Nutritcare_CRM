"use client";

import { useMemo, useState } from "react";
import { Search, ArrowDownUp, Landmark, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AgentRemittanceEntry } from "@/modules/delivery/services/delivery-agent-portal.service";

const BANK_LABEL: Record<string, string> = {
  MONIEPOINT: "Moniepoint",
  ZENITH: "Zenith",
};

export function RemittancesClient({
  netBalance,
  totalRemitted,
  entries,
}: {
  netBalance: number;
  totalRemitted: number;
  entries: AgentRemittanceEntry[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.referenceId.toLowerCase().includes(q) ||
        (BANK_LABEL[e.bank ?? ""] ?? "").toLowerCase().includes(q) ||
        formatDate(e.date).toLowerCase().includes(q)
    );
  }, [entries, query]);

  // Ledger convention: positive = agent owes the company; negative = company owes agent.
  const owesCompany = netBalance > 0.005;
  const owedByCompany = netBalance < -0.005;

  return (
    <div className="space-y-6 pb-24">
      {/* Balance hero */}
      <div
        className={`rounded-3xl p-6 text-white shadow-lg ${
          owesCompany
            ? "bg-gradient-to-br from-[#ad1df4] to-[#7a0fb0]"
            : owedByCompany
              ? "bg-gradient-to-br from-emerald-500 to-emerald-700"
              : "bg-gradient-to-br from-slate-700 to-slate-900"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
          {owesCompany ? "You owe Nutricare" : owedByCompany ? "Nutricare owes you" : "Account balance"}
        </p>
        <p className="text-4xl font-black mt-1">
          {formatCurrency(Math.abs(netBalance))}
        </p>
        <p className="text-[11px] font-medium opacity-80 mt-2">
          {owesCompany
            ? "Outstanding amount to remit to the company."
            : owedByCompany
              ? "The company owes you this balance (overpayment)."
              : "You're fully settled up. Nothing outstanding."}
        </p>
        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs">
          <span className="opacity-80">Total remitted to date</span>
          <span className="font-black">{formatCurrency(totalRemitted)}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by reference, bank or date…"
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm text-gray-700 placeholder-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-purple-100"
        />
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400 text-sm shadow-sm">
          {entries.length === 0
            ? "No remittances have been recorded for you yet."
            : "No remittance matches your search."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <RemittanceCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function RemittanceCard({ entry }: { entry: AgentRemittanceEntry }) {
  const bank = entry.bank ? BANK_LABEL[entry.bank] ?? entry.bank : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#faf5ff] text-[#ad1df4] flex items-center justify-center shrink-0">
            <Receipt size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-black text-gray-900 truncate">{entry.referenceId}</p>
            <p className="text-[11px] text-gray-400 font-medium">{formatDate(entry.date)}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Remitted</p>
          <p className="text-lg font-black text-gray-900 leading-none">{formatCurrency(entry.remitted)}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 mb-3">
        <span className="inline-flex items-center gap-1">
          <ArrowDownUp size={12} className="text-gray-400" />
          Expected {formatCurrency(entry.expected)}
        </span>
        <span>
          {entry.orderCount} order{entry.orderCount === 1 ? "" : "s"}
        </span>
        {bank && (
          <span className="inline-flex items-center gap-1">
            <Landmark size={12} className="text-gray-400" />
            {bank}
          </span>
        )}
      </div>

      {/* Balance status for this remittance */}
      {entry.underpayment > 0.005 ? (
        <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-[11px] font-bold text-rose-600">
          You still owe {formatCurrency(entry.underpayment)} on this remittance.
        </div>
      ) : entry.overpayment > 0.005 ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-[11px] font-bold text-emerald-600">
          You overpaid {formatCurrency(entry.overpayment)} — the company owes you this.
        </div>
      ) : (
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-[11px] font-bold text-slate-500">
          Fully settled — no balance on this remittance.
        </div>
      )}
    </div>
  );
}
