"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MonthSelect } from "./month-select";

function PeriodFilterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") === "week" ? "week" : "month";

  function setPeriod(next: "week" | "month") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "week") {
      params.set("period", "week");
      params.delete("month"); // month picker is irrelevant in week mode
    } else {
      params.set("period", "month");
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        {(["month", "week"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              period === p
                ? "bg-purple-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {p === "month" ? "This Month" : "This Week"}
          </button>
        ))}
      </div>
      {period === "month" && <MonthSelect />}
    </div>
  );
}

export function PeriodFilter() {
  return (
    <Suspense>
      <PeriodFilterInner />
    </Suspense>
  );
}
