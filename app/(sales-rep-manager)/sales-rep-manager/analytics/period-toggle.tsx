"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MonthSelect } from "@/app/(sales-rep)/sales-rep/analytics/month-select";

const OPTIONS = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
] as const;

function PeriodToggleInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("range");
  const range = raw === "day" || raw === "week" ? raw : "month";

  function setRange(next: "day" | "week" | "month") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", next);
    if (next !== "month") params.delete("month"); // month picker irrelevant off-month
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        {OPTIONS.map(o => (
          <button
            key={o.key}
            onClick={() => setRange(o.key)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              range === o.key
                ? "bg-purple-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {range === "month" && <MonthSelect />}
    </div>
  );
}

export function AnalyticsPeriodToggle() {
  return (
    <Suspense>
      <PeriodToggleInner />
    </Suspense>
  );
}
