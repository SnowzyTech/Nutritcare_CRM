"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, RotateCw, Plus } from "lucide-react";

/**
 * Shared media-buyer page header: the back / forward / refresh pill on the
 * left, a title (+ optional subtitle), and an optional "Create Form" action.
 */
export function MediaBuyerTopbar({
  title,
  subtitle,
  showCreate = true,
  right,
}: {
  title: string;
  subtitle?: string;
  showCreate?: boolean;
  /** Custom right-side content; overrides the default Create Form button. */
  right?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <div className="inline-flex items-center gap-1 bg-purple-50 rounded-lg p-1 mb-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-md text-purple-600 hover:bg-purple-100 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => router.forward()}
            className="p-1.5 rounded-md text-purple-600 hover:bg-purple-100 transition-colors cursor-pointer"
            aria-label="Go forward"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => router.refresh()}
            className="p-1.5 rounded-md text-purple-600 hover:bg-purple-100 transition-colors cursor-pointer"
            aria-label="Refresh"
          >
            <RotateCw size={15} />
          </button>
        </div>
        <h1 className="text-3xl font-black text-slate-800 leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>

      {right ?? (showCreate && (
        <Link
          href="/media-buyer/forms/add"
          className="inline-flex items-center gap-2 bg-[#8B2FE8] hover:bg-[#7a26cf] text-white text-sm font-bold rounded-xl px-5 py-3 transition-colors shadow-md shadow-purple-200/70 whitespace-nowrap"
        >
          <Plus size={16} />
          Create Form
        </Link>
      ))}
    </div>
  );
}
