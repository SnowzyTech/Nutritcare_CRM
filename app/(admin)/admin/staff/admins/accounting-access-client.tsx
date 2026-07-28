"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, ShieldCheck, ShieldOff } from "lucide-react";
import { updateAccountingPermissionsAction } from "@/modules/users/actions/users.action";

type AccountantRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  accountingPermissions: string[];
};

type FeatureDef = { key: string; label: string; description: string };

/** Short column headers for the matrix (full label shown on hover). */
const SHORT_LABEL: Record<string, string> = {
  FINANCIAL_SUMMARY: "Financial",
  INVENTORY_SNAPSHOT: "Inventory",
  SALES_ANALYTICS: "Sales",
  SALARY: "Salary",
  REPORTS: "Reports",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function AccountingAccessClient({
  accountants,
  features,
}: {
  accountants: AccountantRow[];
  features: FeatureDef[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accountants;
    return accountants.filter(
      (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    );
  }, [accountants, query]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-slate-100">
        <div className="relative max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accountant…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {accountants.length === 0 ? (
        <div className="p-10 text-center text-slate-400">No accountant accounts yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[720px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-5 py-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Accountant</th>
                <th className="px-3 py-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Status</th>
                {features.map((f) => (
                  <th
                    key={f.key}
                    title={`${f.label} — ${f.description}`}
                    className="px-2 py-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center"
                  >
                    {SHORT_LABEL[f.key] ?? f.label}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={features.length + 3} className="px-5 py-10 text-center text-slate-400">
                    No accountant matches your search.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <AccountantMatrixRow key={a.id} accountant={a} features={features} />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AccountantMatrixRow({
  accountant,
  features,
}: {
  accountant: AccountantRow;
  features: FeatureDef[];
}) {
  const allKeys = useMemo(() => features.map((f) => f.key), [features]);
  const [granted, setGranted] = useState<string[]>(accountant.accountingPermissions);
  const [pending, startTransition] = useTransition();

  const count = granted.length;
  const isHead = count === allKeys.length;

  function persist(next: string[], msg: string) {
    const previous = granted;
    setGranted(next);
    startTransition(async () => {
      const res = await updateAccountingPermissionsAction({ userId: accountant.id, permissions: next });
      if ("error" in res) {
        setGranted(previous);
        toast.error(res.error);
      } else {
        toast.success(msg);
      }
    });
  }

  function toggle(key: string, label: string) {
    const has = granted.includes(key);
    const next = has ? granted.filter((k) => k !== key) : [...granted, key];
    persist(next, has ? `${label} hidden from ${accountant.name}` : `${label} granted to ${accountant.name}`);
  }

  return (
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors">
      {/* Accountant */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          {accountant.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={accountant.avatarUrl} alt={accountant.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white text-[11px] font-black shrink-0">
              {initials(accountant.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate flex items-center gap-2">
              {accountant.name}
              {!accountant.isActive && (
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Suspended</span>
              )}
            </p>
            <p className="text-xs text-slate-400 truncate">{accountant.email}</p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <span
          className={`text-[0.7rem] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
            isHead ? "text-indigo-700 bg-indigo-50" : count === 0 ? "text-slate-500 bg-slate-100" : "text-slate-600 bg-slate-100"
          }`}
        >
          {isHead ? "Head" : count === 0 ? "Normal" : `${count}/${allKeys.length}`}
        </span>
      </td>

      {/* Feature cells */}
      {features.map((f) => {
        const has = granted.includes(f.key);
        return (
          <td key={f.key} className="px-2 py-3 text-center">
            <button
              type="button"
              role="switch"
              aria-checked={has}
              aria-label={`${has ? "Remove" : "Grant"} ${f.label} for ${accountant.name}`}
              title={f.label}
              disabled={pending}
              onClick={() => toggle(f.key, f.label)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                has ? "bg-indigo-500" : "bg-slate-300"
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${has ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </td>
        );
      })}

      {/* Bulk row actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            title="Grant all"
            disabled={pending || isHead}
            onClick={() => persist([...allKeys], `${accountant.name} is now Head of Accounting`)}
            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 transition-colors"
          >
            <ShieldCheck size={16} />
          </button>
          <button
            type="button"
            title="Remove all"
            disabled={pending || count === 0}
            onClick={() => persist([], `All accounting features removed from ${accountant.name}`)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ShieldOff size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
