"use client";

/**
 * Period switcher for report pages. Writes the period to the URL so the server
 * page re-renders with fresh figures — the same searchParams-driven pattern the
 * accounting reports use.
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type PeriodUnit = "day" | "week" | "month";

const DAY_MS = 24 * 60 * 60 * 1000;

function toParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PeriodSwitcher({
  unit,
  paramKey,
  /** Anchor date of the period currently displayed, ISO `YYYY-MM-DD`. */
  current,
  label,
}: {
  unit: PeriodUnit;
  paramKey: string;
  current: string;
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const shift = (direction: -1 | 1) => {
    const [y, m, d] = current.split("-").map(Number);
    const anchor = new Date(y, m - 1, d);

    const next =
      unit === "month"
        ? new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1)
        : new Date(anchor.getTime() + direction * (unit === "week" ? 7 : 1) * DAY_MS);

    const params = new URLSearchParams(searchParams.toString());
    params.set(paramKey, toParam(next));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
      <button
        onClick={() => shift(-1)}
        className="rounded-md p-1.5 text-gray-500 transition hover:bg-purple-50 hover:text-[#5C2B90]"
        title={`Previous ${unit}`}
      >
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[9rem] px-2 text-center text-sm font-medium text-gray-700">
        {label}
      </span>
      <button
        onClick={() => shift(1)}
        className="rounded-md p-1.5 text-gray-500 transition hover:bg-purple-50 hover:text-[#5C2B90]"
        title={`Next ${unit}`}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
