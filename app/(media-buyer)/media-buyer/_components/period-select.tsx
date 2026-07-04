"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";

export const PERIOD_OPTIONS = [
  { label: "This Month", value: "this-month" },
  { label: "Last Month", value: "last-month" },
  { label: "All Time", value: "all" },
];

/**
 * Compact period dropdown used on metric cards. Pushes `?period=` onto
 * `basePath` so the SSR page refetches with the selected range.
 */
export function PeriodSelect({
  period,
  basePath,
  dark,
}: {
  period: string;
  basePath: string;
  dark?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = PERIOD_OPTIONS.find((o) => o.value === period) ?? PERIOD_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer ${
          dark
            ? "bg-white/15 hover:bg-white/25 text-white"
            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
        }`}
      >
        {current.label}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-36 bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/70 p-1">
          {PERIOD_OPTIONS.map((o) => {
            const active = o.value === period;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(`${basePath}?period=${o.value}`);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                  active ? "bg-purple-50 text-purple-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {o.label}
                {active && <Check size={13} className="text-purple-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
