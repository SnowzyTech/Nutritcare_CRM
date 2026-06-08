'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Month-only picker: choose a year then a month. Emits a timezone-neutral
// `YYYY-MM` token so the selected period never drifts across the UTC boundary.
export function MonthPicker({
  value,
  onSelect,
}: {
  value: Date;
  onSelect: (token: string) => void;
}) {
  const [year, setYear] = useState(value.getFullYear());
  const selectedYear = value.getFullYear();
  const selectedMonth = value.getMonth();

  return (
    <div className="p-3 w-[260px]">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setYear(y => y - 1)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          aria-label="Previous year"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-[14px] font-bold text-gray-800">{year}</span>
        <button
          type="button"
          onClick={() => setYear(y => y + 1)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          aria-label="Next year"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {MONTHS.map((label, idx) => {
          const isSelected = year === selectedYear && idx === selectedMonth;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(`${year}-${String(idx + 1).padStart(2, '0')}`)}
              className={`py-2 rounded text-[13px] font-medium transition-colors ${
                isSelected
                  ? 'bg-[#5C2B90] text-white'
                  : 'text-gray-700 hover:bg-purple-50'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
