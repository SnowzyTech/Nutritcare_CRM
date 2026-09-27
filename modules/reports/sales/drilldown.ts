import {
  isPeriodType,
  monthToDate,
  periodFromKey,
  previousPeriod,
  type Period,
  type PeriodType,
} from "@/lib/lagos-time";
import { isFollowUpStage, followUpStage } from "@/lib/orders/follow-up";
import { filtersToParams, parseFilters, type SalesReportFilters } from "@/modules/reports/sales/filters";
import { COHORT_METRICS, isCohortMetric } from "@/modules/reports/sales/metrics";
import {
  BACKLOG_ROWS,
  DATA_CHECKS,
  backlogAtStartView,
  backlogView,
  dataCheckView,
  journeyView,
  recoveredView,
  type JourneyMode,
  type View,
} from "@/modules/reports/sales/views";

/**
 * Links from a figure to the exact orders behind it, and back.
 *
 * `view` ids:  metric:<key> · backlog:<row> · recovered · backlogStart ·
 *              journey:<stage>:<due|done|open> · check:<key>
 * `span`:      (default) the period · mtd (month-to-date, day reports) · prev
 */

export const REPORTS_BASE = "/sales-manager/reports";

export type DrillSpan = "period" | "mtd" | "prev";

export function drillHref(opts: {
  type: PeriodType;
  periodKey: string;
  view: string;
  filters: SalesReportFilters;
  /** Extra filters for a table row (e.g. `{ team: id }`), merged over the report's filters. */
  row?: Partial<SalesReportFilters>;
  span?: DrillSpan;
}): string {
  const params = filtersToParams({ ...opts.filters, ...(opts.row ?? {}) });
  params.set("type", opts.type);
  params.set("date", opts.periodKey);
  params.set("view", opts.view);
  if (opts.span && opts.span !== "period") params.set("span", opts.span);
  return `${REPORTS_BASE}/orders?${params.toString()}`;
}

export type ResolvedDrill = {
  title: string;
  subtitle: string;
  view: View;
  filters: SalesReportFilters;
  period: Period;
  /** Back to the report this drill-down came from. */
  backHref: string;
};

const REPORT_SLUG: Record<PeriodType, string> = {
  DAY: "daily",
  WEEK: "weekly",
  MONTH: "monthly",
  QUARTER: "quarterly",
};

export function reportHref(type: PeriodType, periodKey: string, filters: SalesReportFilters): string {
  const params = filtersToParams(filters);
  params.set("date", periodKey);
  return `${REPORTS_BASE}/${REPORT_SLUG[type]}?${params.toString()}`;
}

type SearchParams = Record<string, string | string[] | undefined>;

function one(sp: SearchParams, k: string): string | undefined {
  const v = sp[k];
  return Array.isArray(v) ? v[0] : v;
}

export function resolveDrill(sp: SearchParams): ResolvedDrill | null {
  const typeRaw = one(sp, "type");
  const type: PeriodType = isPeriodType(typeRaw) ? typeRaw : "DAY";
  const reportPeriod = periodFromKey(type, one(sp, "date"));
  const filters = parseFilters(sp);
  const viewId = one(sp, "view") ?? "";
  const span = one(sp, "span");
  const backHref = reportHref(type, reportPeriod.key, filters);
  const [kind, a, b] = viewId.split(":");

  if (kind === "metric" && isCohortMetric(a)) {
    let bounds = { start: reportPeriod.start, end: reportPeriod.end };
    let label = reportPeriod.label;
    if (span === "mtd" && type === "DAY") {
      const mtd = monthToDate(reportPeriod);
      bounds = { start: mtd.start, end: mtd.end };
      label = mtd.label;
    } else if (span === "prev") {
      const prev = previousPeriod(reportPeriod);
      bounds = { start: prev.start, end: prev.end };
      label = prev.label;
    }
    return {
      title: COHORT_METRICS[a].label,
      subtitle: `Orders received ${label}`,
      view: { bounds, where: COHORT_METRICS[a].where },
      filters,
      period: reportPeriod,
      backHref,
    };
  }

  if (kind === "backlog") {
    const row = BACKLOG_ROWS.find((r) => r.key === a);
    if (!row) return null;
    return {
      title: `Backlog — ${row.label}`,
      subtitle: "All currently open orders, any age",
      view: backlogView(row.key),
      filters,
      period: reportPeriod,
      backHref,
    };
  }

  if (kind === "recovered") {
    return {
      title: "Recovered backlog",
      subtitle: `Received before ${reportPeriod.label}, confirmed or delivered during it`,
      view: recoveredView(reportPeriod),
      filters,
      period: reportPeriod,
      backHref,
    };
  }

  if (kind === "backlogStart") {
    return {
      title: "Backlog at start of period",
      subtitle: `Open when ${reportPeriod.label} began`,
      view: backlogAtStartView(reportPeriod),
      filters,
      period: reportPeriod,
      backHref,
    };
  }

  if (kind === "journey" && isFollowUpStage(a) && (b === "due" || b === "done" || b === "open")) {
    const stage = followUpStage(a);
    const mode = b as JourneyMode;
    return {
      title: `Customer journey — ${stage.label} (${stage.action})`,
      subtitle: `${mode === "due" ? "Due" : mode === "done" ? "Done" : "Outstanding"} on ${reportPeriod.label}`,
      view: journeyView(reportPeriod, a, mode),
      filters,
      period: reportPeriod,
      backHref,
    };
  }

  if (kind === "check") {
    const check = DATA_CHECKS.find((c) => c.key === a);
    if (!check) return null;
    return {
      title: `Data check — ${check.label}`,
      subtitle: check.scope === "open" ? check.description : `${check.description} Orders received ${reportPeriod.label}.`,
      view: dataCheckView(check, reportPeriod),
      filters,
      period: reportPeriod,
      backHref,
    };
  }

  return null;
}
