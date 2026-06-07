"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

const DEFAULT_TRIGGER =
  "flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 h-auto w-auto shadow-none";

/**
 * Month picker that drives the `?month=YYYY-MM` search param. All instances on a
 * page read/write the same param, so they stay in sync. Lists the last 12 months
 * and labels the current month as "This Month".
 */
function MonthFilterInner({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = new Date();
  const thisMonthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentValue = searchParams.get("month") || thisMonthValue;

  const months = React.useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label =
        value === thisMonthValue
          ? "This Month"
          : new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
      return { value, label };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeLabel = months.find((m) => m.value === currentValue)?.label ?? "This Month";

  return (
    <Select
      value={currentValue}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("month", value || thisMonthValue);
        router.push(`?${params.toString()}`, { scroll: false });
      }}
    >
      <SelectTrigger className={className ?? DEFAULT_TRIGGER}>
        <span className="flex-1 text-left truncate">{activeLabel}</span>
      </SelectTrigger>
      <SelectContent>
        {months.map((m) => (
          <SelectItem key={m.value} value={m.value}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function MonthFilter({ className }: { className?: string }) {
  return (
    <Suspense>
      <MonthFilterInner className={className} />
    </Suspense>
  );
}
