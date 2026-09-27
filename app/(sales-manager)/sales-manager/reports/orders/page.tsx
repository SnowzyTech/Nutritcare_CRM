import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { resolveDrill } from "@/modules/reports/sales/drilldown";
import { DRILL_PAGE_SIZE, listView } from "@/modules/reports/sales/services/views.service";

export const metadata: Metadata = { title: "Report orders" };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

const DATE_FMT = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
});

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-sky-50 text-sky-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-600",
  FAILED: "bg-red-50 text-red-700",
};

/**
 * The orders behind a report figure (template: "every dashboard figure must be
 * traceable to the individual order records behind it"). Uses the exact same
 * predicate as the figure, so the count here always equals the figure.
 */
export default async function ReportOrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const drill = resolveDrill(sp);
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);

  if (!drill) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
        This link doesn&apos;t point to a report figure.{" "}
        <Link href="/sales-manager/reports/daily" className="font-semibold text-[#5C2B90] hover:underline">
          Back to reports
        </Link>
      </div>
    );
  }

  const result = await listView(drill.view, drill.filters, page);
  const pages = Math.max(1, Math.ceil(result.total / DRILL_PAGE_SIZE));
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && k !== "page") params.set(k, v);
    params.set("page", String(p));
    return `?${params.toString()}`;
  };
  const activeFilters = Object.entries(drill.filters).filter(([, v]) => Boolean(v));

  return (
    <div className="space-y-5">
      <Link href={drill.backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#5C2B90]">
        <ArrowLeft size={15} /> Back to the report
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{drill.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{drill.subtitle}</p>
        <p className="mt-2 text-sm">
          <b className="text-gray-900">{result.total.toLocaleString("en-NG")}</b> order{result.total === 1 ? "" : "s"}
          <span className="text-gray-400"> · </span>
          <b className="text-gray-900">{result.customers.toLocaleString("en-NG")}</b> customer{result.customers === 1 ? "" : "s"} (by phone number)
          {activeFilters.length > 0 && (
            <span className="ml-2 text-[#5C2B90]">· filtered: {activeFilters.map(([k, v]) => `${k} ${v}`).join(", ")}</span>
          )}
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#5C2B90] text-white">
              {["Order", "Received", "Customer", "Location", "Rep", "Team", "Source", "Status", "Net amount", "Flags"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-sm italic text-gray-400">
                  No orders.
                </td>
              </tr>
            )}
            {result.rows.map((r, i) => (
              <tr key={r.id} className={i % 2 ? "bg-purple-50/30" : "bg-white"}>
                <td className="px-3 py-2 font-semibold whitespace-nowrap">
                  <Link href={`/sales-manager/orders/${r.id}`} className="text-[#5C2B90] hover:underline">
                    {r.orderNumber}
                  </Link>
                </td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{DATE_FMT.format(r.date)}</td>
                <td className="px-3 py-2 text-gray-800">{r.customerName}</td>
                <td className="px-3 py-2 text-gray-600">{r.state || "—"}</td>
                <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{r.repName}</td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.teamName ?? "No team"}</td>
                <td className="px-3 py-2 text-gray-600">{r.source}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{formatCurrency(r.netAmount)}</td>
                <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                  {[r.returning ? "Returning" : "New", r.reorder && "Reorder", r.upsell && "Upsell", r.crossSell && "Cross-sell"]
                    .filter(Boolean)
                    .join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-700 hover:border-purple-300">
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={pageHref(page + 1)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-700 hover:border-purple-300">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
