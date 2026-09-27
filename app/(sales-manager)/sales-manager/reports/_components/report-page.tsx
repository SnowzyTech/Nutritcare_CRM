import { auth } from "@/lib/auth/auth";
import {
  PERIOD_NOUN,
  nextPeriod,
  periodContaining,
  periodFromKey,
  previousPeriod,
  type PeriodType,
} from "@/lib/lagos-time";
import { buildReport } from "@/modules/reports/sales/builders";
import { REPORTS_BASE, reportHref } from "@/modules/reports/sales/drilldown";
import { filtersToParams, parseFilters } from "@/modules/reports/sales/filters";
import { getFilterOptions } from "@/modules/reports/sales/services/filter-options.service";
import { diffSnapshot, getSavedReport } from "@/modules/reports/sales/services/saved-report.service";
import type { ReportDocument, ReportSnapshot } from "@/modules/reports/sales/types";
import { FilterBar } from "@/components/reports/sales/filter-bar";
import { PeriodNav } from "@/components/reports/sales/period-nav";
import { DataChecksStrip } from "@/components/reports/sales/data-checks-strip";
import { ReportWorkspace } from "@/components/reports/sales/report-workspace";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(sp: Record<string, string | string[] | undefined>, k: string): string | undefined {
  const v = sp[k];
  return Array.isArray(v) ? v[0] : v;
}

/** Live document with its numeric sections replaced by the submitted snapshot. */
function withSnapshot(live: ReportDocument, snap: ReportSnapshot): ReportDocument {
  const frozen = new Map(snap.sections.map((s) => [s.key, s]));
  return {
    ...live,
    generatedAt: snap.generatedAt,
    sections: live.sections.map((s) => {
      const f = frozen.get(s.key);
      return f && f.kind === s.kind ? f : s;
    }),
  };
}

/**
 * Shared server page for the Daily / Weekly / Monthly / Quarterly sales reports
 * (docs/CRM_Sales_Reporting_Template_.pdf). Figures are built on the server
 * from live data; a submitted report shows its frozen snapshot by default.
 */
export async function SalesReportPage({ type, searchParams }: { type: PeriodType; searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const period = periodFromKey(type, one(sp, "date"));

  const [session, live, saved, options] = await Promise.all([
    auth(),
    buildReport(type, period.key, filters),
    getSavedReport(type, period.key),
    getFilterOptions(),
  ]);

  const submitted = saved.status === "SUBMITTED" && saved.snapshot !== null && !live.filtered;
  const showingSnapshot = submitted && one(sp, "live") !== "1";
  const diffs = submitted ? diffSnapshot(saved.snapshot!, live) : [];
  const display = showingSnapshot ? withSnapshot(live, saved.snapshot!) : live;

  const current = periodContaining(type);
  const next = nextPeriod(period);
  const base = reportHref(type, period.key, filters);
  const checksParams = filtersToParams(filters);
  checksParams.set("type", type);
  checksParams.set("date", period.key);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{display.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {display.periodLabel}
            {display.filterSummary && <span className="ml-2 text-[#5C2B90]">· filtered</span>}
          </p>
        </div>
        <PeriodNav
          label={period.label}
          noun={PERIOD_NOUN[type]}
          prevHref={reportHref(type, previousPeriod(period).key, filters)}
          nextHref={next.key <= current.key ? reportHref(type, next.key, filters) : null}
          currentHref={reportHref(type, current.key, filters)}
          isCurrent={current.key === period.key}
        />
      </header>

      <FilterBar options={options} filters={filters} />
      <DataChecksStrip checks={display.dataChecks} allHref={`${REPORTS_BASE}/data-checks?${checksParams.toString()}`} />

      <ReportWorkspace
        key={`${type}:${period.key}:${saved.status}`}
        report={display}
        saved={saved}
        diffs={diffs}
        showingSnapshot={showingSnapshot}
        liveHref={`${base}&live=1`}
        snapshotHref={base}
        canManage={session?.user?.role === "SALES_REP_MANAGER"}
        authorName={session?.user?.name ?? "Sales Manager"}
      />
    </div>
  );
}
