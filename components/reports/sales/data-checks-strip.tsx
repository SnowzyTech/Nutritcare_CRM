import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DataCheckSummary } from "@/modules/reports/sales/types";

/**
 * Template section 7: discrepancies are flagged for review, never silently
 * fixed. Each count links to the exact orders involved.
 */
export function DataChecksStrip({ checks, allHref }: { checks: DataCheckSummary[]; allHref: string }) {
  const flagged = checks.filter((c) => c.count > 0);
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 text-xs",
        flagged.length ? "border-amber-200 bg-amber-50" : "border-emerald-100 bg-emerald-50/60",
      )}
    >
      <span className={cn("flex items-center gap-1.5 font-bold", flagged.length ? "text-amber-800" : "text-emerald-700")}>
        {flagged.length ? <ShieldAlert size={15} /> : <ShieldCheck size={15} />}
        {flagged.length ? "Data checks flagged" : "No data issues flagged"}
      </span>
      {flagged.map((c) => (
        <Link
          key={c.key}
          href={c.href}
          prefetch={false}
          className="rounded-full border border-amber-300 bg-white px-2.5 py-1 font-semibold text-amber-800 hover:border-amber-500"
        >
          {c.label}: {c.count}
        </Link>
      ))}
      <Link href={allHref} className="ml-auto font-semibold text-gray-500 hover:text-[#5C2B90]">
        All checks →
      </Link>
    </div>
  );
}
