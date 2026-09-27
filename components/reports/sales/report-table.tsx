import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Cell, CellTone, TableSection } from "@/modules/reports/sales/types";

const TONE: Record<CellTone, string> = {
  good: "text-emerald-600",
  bad: "text-red-600",
  warn: "text-amber-600",
  muted: "text-gray-400",
};

/** One report cell. A figure with `href` links to the exact orders behind it. */
export function ReportCell({ cell, first }: { cell: Cell; first?: boolean }) {
  const align = cell.align ?? (first ? "left" : "right");
  const cls = cn(
    "px-3 py-2 whitespace-nowrap",
    align === "right" && "text-right tabular-nums",
    align === "center" && "text-center",
    cell.bold ? "font-semibold text-gray-900" : first ? "text-gray-700" : "text-gray-800",
    cell.tone && TONE[cell.tone],
  );
  return (
    <td className={cls}>
      {cell.href ? (
        <Link
          href={cell.href}
          prefetch={false}
          className="underline decoration-dotted decoration-gray-300 underline-offset-4 hover:text-[#5C2B90] hover:decoration-[#5C2B90]"
          title="See the orders behind this figure"
        >
          {cell.v}
        </Link>
      ) : (
        cell.v
      )}
    </td>
  );
}

export function SectionCard({
  heading,
  note,
  children,
  actions,
}: {
  heading: string;
  note?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-base font-bold text-gray-800">{heading}</h2>
        {actions}
      </div>
      {children}
      {note && <p className="mt-3 text-xs text-gray-400">{note}</p>}
    </section>
  );
}

export function ReportTable({ section }: { section: TableSection }) {
  return (
    <SectionCard heading={section.heading} note={section.note}>
      {section.rows.length === 0 ? (
        <p className="text-sm italic text-gray-400">{section.emptyText ?? "No data for this period."}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#5C2B90] text-white">
                {section.head.map((h, i) => (
                  <th
                    key={h}
                    className={cn("px-3 py-2 font-semibold whitespace-nowrap", i === 0 ? "text-left" : "text-right")}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, i) => (
                <tr key={i} className={i % 2 ? "bg-purple-50/40" : "bg-white"}>
                  {row.map((cell, j) => (
                    <ReportCell key={j} cell={cell} first={j === 0} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
