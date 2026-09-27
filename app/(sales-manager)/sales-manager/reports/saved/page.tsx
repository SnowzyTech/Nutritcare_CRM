import type { Metadata } from "next";
import Link from "next/link";
import { isPeriodType, periodFromKey } from "@/lib/lagos-time";
import { reportHref } from "@/modules/reports/sales/drilldown";
import { listSavedReports } from "@/modules/reports/sales/services/saved-report.service";

export const metadata: Metadata = { title: "Saved reports" };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { DAY: "Daily", WEEK: "Weekly", MONTH: "Monthly", QUARTER: "Quarterly" };

const WHEN = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });

/** Every report the sales manager has drafted or submitted, newest period first. */
export default async function SavedReportsPage() {
  const reports = await listSavedReports();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Saved reports</h1>
        <p className="mt-1 text-sm text-gray-500">Submitted reports keep their figures exactly as they were when submitted.</p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#5C2B90] text-white">
              {["Report", "Period", "Status", "By", "Last change"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm italic text-gray-400">
                  No reports saved yet. Drafts are saved automatically as you write a report.
                </td>
              </tr>
            )}
            {reports.map((r, i) => {
              const type = isPeriodType(r.periodType) ? r.periodType : "DAY";
              const period = periodFromKey(type, r.periodStart);
              return (
                <tr key={r.id} className={i % 2 ? "bg-purple-50/30" : "bg-white"}>
                  <td className="px-3 py-2 font-semibold">
                    <Link href={reportHref(type, period.key, {})} className="text-[#5C2B90] hover:underline">
                      {TYPE_LABEL[type]} Sales Report
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{period.label}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.status === "SUBMITTED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {r.status === "SUBMITTED" ? "Submitted" : "Draft"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{r.author.name}</td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                    {WHEN.format(r.status === "SUBMITTED" && r.submittedAt ? r.submittedAt : r.updatedAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
