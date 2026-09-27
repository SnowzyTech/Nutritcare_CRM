"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Filter, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FILTER_KEYS, type SalesReportFilters } from "@/modules/reports/sales/filters";
import type { FilterOptions, Option } from "@/modules/reports/sales/services/filter-options.service";

const STATUS_OPTIONS: Option[] = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "FAILED", label: "Failed" },
];

/**
 * The template's required filters (section 6). Everything lives in the URL, so a
 * filtered report — and every drill-down from it — is a shareable link.
 */
export function FilterBar({ options, filters }: { options: FilterOptions; filters: SalesReportFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = (key: keyof SalesReportFilters, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const k of FILTER_KEYS) params.delete(k);
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  };

  const active = FILTER_KEYS.filter((k) => Boolean(filters[k])).length;

  const select = (key: keyof SalesReportFilters, placeholder: string, opts: Option[]) => (
    <select
      value={(filters[key] as string | undefined) ?? ""}
      onChange={(e) => set(key, e.target.value || null)}
      className={cn(
        "h-9 max-w-[11rem] rounded-lg border bg-white px-2 text-xs text-gray-700 outline-none focus:border-[#5C2B90]",
        filters[key] ? "border-[#5C2B90] font-semibold text-[#5C2B90]" : "border-gray-200",
      )}
      aria-label={placeholder}
    >
      <option value="">{placeholder}</option>
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  const toggle = (key: "reorder" | "upsell" | "crossSell", text: string) => (
    <button
      type="button"
      onClick={() => set(key, filters[key] ? null : "1")}
      className={cn(
        "h-9 rounded-lg border px-3 text-xs font-medium transition",
        filters[key]
          ? "border-[#5C2B90] bg-[#5C2B90] text-white"
          : "border-gray-200 bg-white text-gray-600 hover:border-purple-300",
      )}
    >
      {text}
    </button>
  );

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 pr-1 text-xs font-bold uppercase tracking-wide text-gray-500">
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Filter size={14} />}
          Filters
        </span>
        {select("team", "All teams", options.teams)}
        {select("rep", "All reps", options.reps)}
        {select("product", "All products", options.products)}
        {select("customer", "New & returning", [
          { value: "new", label: "New customers" },
          { value: "returning", label: "Returning customers" },
        ])}
        {select("source", "All lead sources", [
          { value: "form", label: "Form" },
          { value: "manual", label: "Manual" },
        ])}
        {select("status", "All statuses", STATUS_OPTIONS)}
        {select("agent", "All delivery agents", options.agents)}
        {select("state", "All locations", options.states)}
        {toggle("reorder", "Reorders")}
        {toggle("upsell", "Upsells")}
        {toggle("crossSell", "Cross-sells")}
        <span
          className="h-9 rounded-lg border border-dashed border-gray-200 px-3 text-xs leading-9 text-gray-400"
          title="Referrals are not captured on orders yet"
        >
          Referral: not tracked
        </span>
        {active > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-gray-500 hover:text-red-600"
          >
            <X size={14} /> Clear ({active})
          </button>
        )}
      </div>
    </div>
  );
}
