import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Previous / current / next period links. Hrefs are computed on the server (Lagos periods). */
export function PeriodNav({
  label,
  prevHref,
  nextHref,
  currentHref,
  isCurrent,
  noun,
}: {
  label: string;
  prevHref: string;
  nextHref: string | null;
  currentHref: string;
  isCurrent: boolean;
  noun: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
        <Link href={prevHref} className="rounded-md p-1.5 text-gray-500 transition hover:bg-purple-50 hover:text-[#5C2B90]" title={`Previous ${noun}`}>
          <ChevronLeft size={16} />
        </Link>
        <span className="min-w-[10rem] px-2 text-center text-sm font-medium text-gray-700">{label}</span>
        {nextHref ? (
          <Link href={nextHref} className="rounded-md p-1.5 text-gray-500 transition hover:bg-purple-50 hover:text-[#5C2B90]" title={`Next ${noun}`}>
            <ChevronRight size={16} />
          </Link>
        ) : (
          <span className="p-1.5 text-gray-200">
            <ChevronRight size={16} />
          </span>
        )}
      </div>
      {!isCurrent && (
        <Link href={currentHref} className="text-xs font-semibold text-[#5C2B90] hover:underline">
          This {noun}
        </Link>
      )}
    </div>
  );
}
