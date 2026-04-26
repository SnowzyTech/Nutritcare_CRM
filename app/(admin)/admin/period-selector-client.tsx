"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function PeriodSelector({
  currentMonth,
  currentYear,
}: {
  currentMonth: number;
  currentYear: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = useCallback(
    (month: string, year: string) => {
      const params = new URLSearchParams({ month, year });
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname]
  );

  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentMonth}
        onChange={(e) => navigate(e.target.value, String(currentYear))}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer"
      >
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        value={currentYear}
        onChange={(e) => navigate(String(currentMonth), e.target.value)}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
