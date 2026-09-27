import {
  monthToDate,
  periodFromKey,
  previousPeriod,
  type Period,
  type PeriodType,
} from "@/lib/lagos-time";
import { FOLLOW_UP_STAGES } from "@/lib/orders/follow-up";
import { CUSTOMER_FEEDBACK_CATEGORIES } from "@/lib/orders/customer-feedback";
import { isFiltered, targetsApply, type SalesReportFilters } from "@/modules/reports/sales/filters";
import {
  DASH,
  achievement,
  aov,
  fmt,
  fmtSigned,
  growth,
  rate,
  type CohortMetricKey,
  type CohortTotals,
  type MetricFormat,
  type TargetMetric,
} from "@/modules/reports/sales/metrics";
import { drillHref } from "@/modules/reports/sales/drilldown";
import {
  BACKLOG_ROWS,
  DATA_CHECKS,
  OPEN_ORDERS,
  backlogAtStartView,
  journeyView,
  recoveredView,
} from "@/modules/reports/sales/views";
import {
  cohortByProduct,
  cohortByRep,
  cohortByTeam,
  cohortTotals,
  type TeamTotals,
} from "@/modules/reports/sales/services/cohort.service";
import { countGroup, countView } from "@/modules/reports/sales/services/views.service";
import {
  companyTarget,
  getSalesTeams,
  getTargets,
  type SalesTeam,
  type TargetMap,
} from "@/modules/reports/sales/services/targets.service";
import { getFeedbackForPeriod } from "@/modules/reports/sales/services/feedback.service";
import { getActionItemsForPeriod } from "@/modules/reports/sales/services/action-items.service";
import type {
  BacklogSection,
  Cell,
  DataCheckSummary,
  ReportDocument,
  ReportSection,
  TableSection,
} from "@/modules/reports/sales/types";

/**
 * Builds each report of docs/CRM_Sales_Reporting_Template_.pdf as a
 * ReportDocument — section by section, in the template's order and wording.
 * Every figure carries a drill-down link to the orders behind it.
 */

type Ctx = {
  type: PeriodType;
  period: Period;
  filters: SalesReportFilters;
  /** Whether target / achievement columns apply (company- or team-level only). */
  showTargets: boolean;
};

const TITLES: Record<PeriodType, string> = {
  DAY: "Daily Sales Report",
  WEEK: "Weekly Sales Report",
  MONTH: "Monthly Sales Report",
  QUARTER: "Quarterly Sales Report",
};

// ── Cell helpers ─────────────────────────────────────────────────────────────

const label = (v: string, extra: Partial<Cell> = {}): Cell => ({ v, align: "left", ...extra });
const num = (v: string, extra: Partial<Cell> = {}): Cell => ({ v, align: "right", ...extra });
const muted = (v: string): Cell => ({ v, align: "right", tone: "muted" });

function metricCell(
  ctx: Ctx,
  key: CohortMetricKey,
  value: number | null,
  format: MetricFormat,
  opts: { row?: Partial<SalesReportFilters>; span?: "mtd" | "prev"; bold?: boolean } = {},
): Cell {
  return num(fmt(value, format), {
    href: drillHref({ type: ctx.type, periodKey: ctx.period.key, view: `metric:${key}`, filters: ctx.filters, row: opts.row, span: opts.span }),
    bold: opts.bold,
  });
}

function pctCell(value: number | null, goodWhenHigh = true, threshold?: number): Cell {
  if (value === null) return muted(DASH);
  let tone: Cell["tone"];
  if (threshold !== undefined) tone = value >= threshold ? "good" : "bad";
  else if (value !== 0) tone = (value > 0) === goodWhenHigh ? "good" : "bad";
  return num(fmt(value, "percent"), { tone });
}

function signedPctCell(value: number | null, goodWhenHigh = true): Cell {
  if (value === null) return muted(DASH);
  const tone: Cell["tone"] = value === 0 ? undefined : (value > 0) === goodWhenHigh ? "good" : "bad";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return num(`${sign}${Math.abs(value).toFixed(1)}%`, { tone });
}

const NOT_SET_UP = "Not set up yet";

// ── Shared data ─────────────────────────────────────────────────────────────

const SUMMARY_METRICS: { label: string; target: TargetMetric; key: CohortMetricKey; format: MetricFormat }[] = [
  { label: "Revenue", target: "REVENUE", key: "revenue", format: "currency" },
  { label: "Handled Orders", target: "HANDLED", key: "handled", format: "number" },
  { label: "Confirmed Orders", target: "CONFIRMED", key: "confirmed", format: "number" },
  { label: "Delivered Orders", target: "DELIVERED", key: "delivered", format: "number" },
  { label: "Reorders", target: "REORDERS", key: "reorders", format: "number" },
  { label: "Upsells", target: "UPSELLS", key: "upsells", format: "number" },
  { label: "Cross-sells", target: "CROSS_SELLS", key: "crossSells", format: "number" },
];

function targetFor(ctx: Ctx, targets: TargetMap, metric: TargetMetric, teams: SalesTeam[]): number | null {
  if (!ctx.showTargets) return null;
  if (ctx.filters.team) return targets.get(ctx.filters.team)?.[metric] ?? null;
  return companyTarget(targets, metric, teams.filter((t) => !t.ghana).map((t) => t.id));
}

/** Team rows in template order: the sales teams (incl. zero-activity), then any others with orders. */
function teamRows(ctx: Ctx, teams: SalesTeam[], byTeam: TeamTotals[]) {
  const data = new Map(byTeam.map((t) => [t.teamId ?? "none", t]));
  const rows: { id: string; name: string; ghana: boolean; totals: CohortTotals | null }[] = [];
  const shown = ctx.filters.team ? teams.filter((t) => t.id === ctx.filters.team) : teams;
  for (const t of shown) rows.push({ id: t.id, name: t.name, ghana: t.ghana, totals: data.get(t.id) ?? null });
  for (const t of byTeam) {
    const id = t.teamId ?? "none";
    if (!rows.some((r) => r.id === id)) rows.push({ id, name: t.teamName, ghana: t.ghana, totals: t });
  }
  return rows;
}

/** The template always lists Ghana; until a Ghana team exists it reads "Not set up yet". */
function needsGhanaPlaceholder(ctx: Ctx, teams: SalesTeam[]): boolean {
  return !ctx.filters.team && !teams.some((t) => t.ghana);
}

async function dataCheckSummary(ctx: Ctx): Promise<DataCheckSummary[]> {
  const periodChecks = DATA_CHECKS.filter((c) => c.scope === "period");
  const openChecks = DATA_CHECKS.filter((c) => c.scope === "open");
  const [p, o] = await Promise.all([
    countGroup(
      { start: ctx.period.start, end: ctx.period.end },
      undefined,
      ctx.filters,
      Object.fromEntries(periodChecks.map((c) => [c.key, c.where])),
    ),
    countGroup(
      {},
      OPEN_ORDERS,
      ctx.filters,
      Object.fromEntries(openChecks.map((c) => [c.key, c.where])),
    ),
  ]);
  return DATA_CHECKS.map((c) => ({
    key: c.key,
    label: c.label,
    count: (c.scope === "period" ? p[c.key] : o[c.key])?.count ?? 0,
    href: drillHref({ type: ctx.type, periodKey: ctx.period.key, view: `check:${c.key}`, filters: ctx.filters }),
  }));
}

function filterSummary(f: SalesReportFilters): string | null {
  const parts = Object.entries(f)
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => `${k}: ${v}`);
  return parts.length ? parts.join(" · ") : null;
}

function doc(ctx: Ctx, sections: ReportSection[], dataChecks: DataCheckSummary[]): ReportDocument {
  return {
    type: ctx.type,
    periodKey: ctx.period.key,
    title: TITLES[ctx.type],
    periodLabel: ctx.period.label,
    filtered: isFiltered(ctx.filters),
    filterSummary: filterSummary(ctx.filters),
    sections,
    dataChecks,
    generatedAt: new Date().toISOString(),
  };
}

// ── Team performance table (daily / weekly / monthly / quarterly variants) ──

type TeamColumn =
  | "revenue"
  | "target"
  | "achievement"
  | "handled"
  | "confirmed"
  | "delivered"
  | "confirmationRate"
  | "deliveryRate"
  | "aov";

const TEAM_HEAD: Record<TeamColumn, string> = {
  revenue: "Revenue",
  target: "Target",
  achievement: "Achievement %",
  handled: "Handled",
  confirmed: "Confirmed",
  delivered: "Delivered",
  confirmationRate: "Confirmation %",
  deliveryRate: "Delivery %",
  aov: "AOV",
};

function teamTable(
  ctx: Ctx,
  key: string,
  heading: string,
  columns: TeamColumn[],
  teams: SalesTeam[],
  byTeam: TeamTotals[],
  company: CohortTotals,
  targets: TargetMap,
): TableSection {
  const cols = columns.filter((c) => ctx.showTargets || (c !== "target" && c !== "achievement"));
  const row = (name: string, t: CohortTotals | null, rowFilter: Partial<SalesReportFilters> | undefined, ghana: boolean, revenueTarget: number | null, bold = false): Cell[] => {
    const cells: Cell[] = [label(name, { bold })];
    const tt = t ?? null;
    for (const c of cols) {
      if (ghana && (c === "revenue" || c === "target" || c === "achievement" || c === "aov")) {
        cells.push(muted(c === "revenue" ? "GHC — not set up" : DASH));
        continue;
      }
      switch (c) {
        case "revenue":
          cells.push(metricCell(ctx, "revenue", tt?.revenue ?? 0, "currency", { row: rowFilter, bold }));
          break;
        case "target":
          cells.push(num(fmt(revenueTarget, "currency")));
          break;
        case "achievement":
          cells.push(pctCell(achievement(tt?.revenue ?? 0, revenueTarget), true, 100));
          break;
        case "handled":
          cells.push(metricCell(ctx, "handled", tt?.handled ?? 0, "number", { row: rowFilter, bold }));
          break;
        case "confirmed":
          cells.push(metricCell(ctx, "confirmed", tt?.confirmed ?? 0, "number", { row: rowFilter, bold }));
          break;
        case "delivered":
          cells.push(metricCell(ctx, "delivered", tt?.delivered ?? 0, "number", { row: rowFilter, bold }));
          break;
        case "confirmationRate":
          cells.push(num(fmt(rate(tt?.confirmed ?? 0, tt?.handled ?? 0), "percent")));
          break;
        case "deliveryRate":
          cells.push(num(fmt(rate(tt?.delivered ?? 0, tt?.handled ?? 0), "percent")));
          break;
        case "aov":
          cells.push(num(fmt(aov(tt?.revenue ?? 0, tt?.delivered ?? 0), "currency")));
          break;
      }
    }
    return cells;
  };

  const rows: Cell[][] = teamRows(ctx, teams, byTeam).map((t) =>
    row(
      t.name,
      t.totals,
      { team: t.id },
      t.ghana,
      t.id === "none" ? null : (targets.get(t.id)?.REVENUE ?? null),
    ),
  );
  if (needsGhanaPlaceholder(ctx, teams)) {
    rows.push([label("Ghana (GHC)"), ...cols.map(() => muted(NOT_SET_UP))]);
  }
  if (!ctx.filters.team) {
    rows.push(row("Total (₦)", company, undefined, false, targetFor(ctx, targets, "REVENUE", teams), true));
  }

  return {
    kind: "table",
    key,
    heading,
    head: ["Team", ...cols.map((c) => TEAM_HEAD[c])],
    rows,
    note: "Ghana revenue stays in GHC and is never added to Naira totals.",
  };
}

// ── Executive summary / dashboard ────────────────────────────────────────────

function execTable(
  ctx: Ctx,
  key: string,
  heading: string,
  current: CohortTotals,
  targets: TargetMap,
  teams: SalesTeam[],
  compare: { kind: "mtd"; totals: CohortTotals } | { kind: "previous"; totals: CohortTotals; label: string },
): TableSection {
  const head = ["Metric"];
  if (ctx.showTargets) head.push("Target");
  head.push("Actual");
  if (ctx.showTargets) head.push("Achievement %");
  head.push(compare.kind === "mtd" ? "MTD" : compare.label);
  if (compare.kind === "previous") head.push("Growth %");

  const rows = SUMMARY_METRICS.map((m) => {
    const actual = current[m.key];
    const target = targetFor(ctx, targets, m.target, teams);
    const cells: Cell[] = [label(m.label)];
    if (ctx.showTargets) cells.push(num(fmt(target, m.format)));
    cells.push(metricCell(ctx, m.key, actual, m.format, { bold: true }));
    if (ctx.showTargets) cells.push(pctCell(achievement(actual, target), true, 100));
    const other = compare.totals[m.key];
    cells.push(metricCell(ctx, m.key, other, m.format, { span: compare.kind === "mtd" ? "mtd" : "prev" }));
    if (compare.kind === "previous") cells.push(signedPctCell(growth(actual, other)));
    return cells;
  });

  return {
    kind: "table",
    key,
    heading,
    head,
    rows,
    note: ctx.showTargets
      ? "Company target = sum of team targets. Achievement % = Actual ÷ Target × 100."
      : "Targets are hidden while the report is filtered below team level.",
  };
}

// ── Daily ────────────────────────────────────────────────────────────────────

export async function buildDailyReport(periodKey: string | null, filters: SalesReportFilters): Promise<ReportDocument> {
  const period = periodFromKey("DAY", periodKey);
  const ctx: Ctx = { type: "DAY", period, filters, showTargets: targetsApply(filters) };
  const bounds = { start: period.start, end: period.end };
  const mtd = monthToDate(period);

  const backlogPreds = Object.fromEntries(BACKLOG_ROWS.map((r) => [r.key, r.where]));
  const recovered = recoveredView(period);
  const atStart = backlogAtStartView(period);

  const [teams, targets, totals, mtdTotals, byTeam, byRep, backlog, recoveredCount, atStartCount, journey, feedback, actions, checks] =
    await Promise.all([
      getSalesTeams(),
      getTargets("DAY", period.key),
      cohortTotals(bounds, filters),
      cohortTotals({ start: mtd.start, end: mtd.end }, filters),
      cohortByTeam(bounds, filters),
      cohortByRep(bounds, filters),
      countGroup({}, OPEN_ORDERS, filters, backlogPreds),
      countGroup(recovered.bounds, recovered.extra, filters, { recovered: recovered.where }),
      countView(atStart, filters),
      Promise.all(
        FOLLOW_UP_STAGES.map(async (s) => {
          const [due, done] = await Promise.all([
            countView(journeyView(period, s.value, "due"), filters),
            countView(journeyView(period, s.value, "done"), filters),
          ]);
          return { stage: s, due: due.count, done: done.count };
        }),
      ),
      getFeedbackForPeriod(period, filters),
      getActionItemsForPeriod(period),
      dataCheckSummary(ctx),
    ]);

  const href = (view: string) => drillHref({ type: "DAY", periodKey: period.key, view, filters });

  const funnel: TableSection = {
    kind: "table",
    key: "funnel",
    heading: "Sales Funnel",
    head: ["Metric", "Number", "Rate"],
    rows: [
      [label("Orders Handled"), metricCell(ctx, "handled", totals.handled, "number"), num(totals.handled ? "100.0%" : DASH)],
      [label("Confirmed"), metricCell(ctx, "confirmed", totals.confirmed, "number"), num(fmt(rate(totals.confirmed, totals.handled), "percent"))],
      [label("Delivered"), metricCell(ctx, "delivered", totals.delivered, "number"), num(fmt(rate(totals.delivered, totals.handled), "percent"))],
      [label("Cancelled"), metricCell(ctx, "cancelled", totals.cancelled, "number"), num(fmt(rate(totals.cancelled, totals.handled), "percent"))],
      [label("Pending / Backlog"), metricCell(ctx, "pending", totals.pending, "number"), num(fmt(rate(totals.pending, totals.handled), "percent"))],
      [
        label("Recovered Backlog"),
        num(fmt(recoveredCount.recovered.count, "number"), { href: href("recovered") }),
        num(
          atStartCount.count > 0
            ? `${fmt((recoveredCount.recovered.count / atStartCount.count) * 100, "percent")} of ${fmt(atStartCount.count, "number")}`
            : DASH,
          { href: href("backlogStart") },
        ),
      ],
    ],
    note: "Rates are ÷ orders handled today (delivery rate is never ÷ confirmed). Recovered = ÷ backlog open at the start of the day.",
  };

  const repTable: TableSection = {
    kind: "table",
    key: "reps",
    heading: "Individual Sales Rep",
    head: ["Rep", "Team", "New", "Old", "Handled", "Confirmed", "Delivered", "Revenue", "Reorder", "Upsell", "Cross-sell", "AOV"],
    rows: byRep.map((r) => {
      const row = { rep: r.repId };
      return [
        label(r.repName),
        label(r.teamName),
        metricCell(ctx, "newOrders", r.newOrders, "number", { row }),
        metricCell(ctx, "returningOrders", r.returningOrders, "number", { row }),
        metricCell(ctx, "handled", r.handled, "number", { row }),
        metricCell(ctx, "confirmed", r.confirmed, "number", { row }),
        metricCell(ctx, "delivered", r.delivered, "number", { row }),
        metricCell(ctx, "revenue", r.revenue, "currency", { row }),
        metricCell(ctx, "reorders", r.reorders, "number", { row }),
        metricCell(ctx, "upsells", r.upsells, "number", { row }),
        metricCell(ctx, "crossSells", r.crossSells, "number", { row }),
        num(fmt(aov(r.revenue, r.delivered), "currency")),
      ];
    }),
    emptyText: "No orders received today.",
    note: "New / Old = orders from first-time vs returning customers (matched by phone number).",
  };

  const journeyTable: TableSection = {
    kind: "table",
    key: "journey",
    heading: "Customer Journey",
    head: ["Stage", "Required Action", "Customers", "Done", "Outstanding"],
    rows: journey.map((j) => [
      label(j.stage.label),
      label(j.stage.action),
      num(fmt(j.due, "number"), { href: href(`journey:${j.stage.value}:due`) }),
      num(fmt(j.done, "number"), { href: href(`journey:${j.stage.value}:done`), tone: j.due > 0 && j.done === j.due ? "good" : undefined }),
      num(fmt(j.due - j.done, "number"), { href: href(`journey:${j.stage.value}:open`), tone: j.due - j.done > 0 ? "warn" : undefined }),
    ]),
    note: "Day N = customers whose order was delivered N days before this day. Reps mark each follow-up done.",
  };

  const backlogSection: BacklogSection = {
    kind: "backlog",
    key: "backlog",
    heading: "Backlog",
    note: "All currently open orders (any age). Age = days since the order came in (average · oldest).",
    rows: [
      ...BACKLOG_ROWS.map((r) => ({
        key: r.key,
        label: r.label,
        number: num(fmt(backlog[r.key]?.count ?? 0, "number"), {
          href: href(`backlog:${r.key}`),
          tone: r.key === "unresponsive" && (backlog[r.key]?.count ?? 0) > 0 ? ("warn" as const) : undefined,
        }),
        age: num(ageText(backlog[r.key]?.avgAgeDays ?? null, backlog[r.key]?.maxAgeDays ?? null)),
      })),
      {
        key: "recovered",
        label: "Recovered",
        number: num(fmt(recoveredCount.recovered.count, "number"), { href: href("recovered") }),
        age: num(ageText(recoveredCount.recovered.avgAgeDays, recoveredCount.recovered.maxAgeDays)),
      },
    ],
  };

  const sections: ReportSection[] = [
    execTable(ctx, "executive", "Executive Summary", totals, targets, teams, { kind: "mtd", totals: mtdTotals }),
    funnel,
    teamTable(ctx, "teams", "Team Performance", ["revenue", "handled", "confirmed", "delivered", "confirmationRate", "deliveryRate", "aov"], teams, byTeam, totals, targets),
    repTable,
    journeyTable,
    backlogSection,
    {
      kind: "feedback",
      key: "feedback",
      heading: "Customer / Product Feedback",
      summary: CUSTOMER_FEEDBACK_CATEGORIES.map((c) => ({ category: c.value, label: c.label, count: feedback.counts[c.value] ?? 0 })),
      items: feedback.items,
    },
    { kind: "actions", key: "actions", heading: "Challenges / Management Action", items: actions },
  ];

  return doc(ctx, sections, checks);
}

function ageText(avg: number | null, max: number | null): string {
  if (avg === null || max === null) return DASH;
  return `${avg.toFixed(1)} · ${Math.floor(max)} days`;
}

// ── Weekly ───────────────────────────────────────────────────────────────────

const WEEKLY_METRICS: { label: string; key: CohortMetricKey | "confirmationRate" | "deliveryRate" | "aov"; format: MetricFormat }[] = [
  { label: "Revenue", key: "revenue", format: "currency" },
  { label: "Handled", key: "handled", format: "number" },
  { label: "Confirmed", key: "confirmed", format: "number" },
  { label: "Delivered", key: "delivered", format: "number" },
  { label: "Confirmation Rate", key: "confirmationRate", format: "percent" },
  { label: "Delivery Rate", key: "deliveryRate", format: "percent" },
  { label: "AOV", key: "aov", format: "currency" },
  { label: "Reorders", key: "reorders", format: "number" },
  { label: "Upsells", key: "upsells", format: "number" },
  { label: "Cross-sells", key: "crossSells", format: "number" },
];

function derived(t: CohortTotals, key: (typeof WEEKLY_METRICS)[number]["key"]): number | null {
  if (key === "confirmationRate") return rate(t.confirmed, t.handled);
  if (key === "deliveryRate") return rate(t.delivered, t.handled);
  if (key === "aov") return aov(t.revenue, t.delivered);
  return t[key];
}

export async function buildWeeklyReport(periodKey: string | null, filters: SalesReportFilters): Promise<ReportDocument> {
  const period = periodFromKey("WEEK", periodKey);
  const prev = previousPeriod(period);
  const ctx: Ctx = { type: "WEEK", period, filters, showTargets: targetsApply(filters) };

  const [teams, targets, cur, last, byTeam, backlog, recovered, feedback, checks] = await Promise.all([
    getSalesTeams(),
    getTargets("WEEK", period.key),
    cohortTotals({ start: period.start, end: period.end }, filters),
    cohortTotals({ start: prev.start, end: prev.end }, filters),
    cohortByTeam({ start: period.start, end: period.end }, filters),
    countGroup({}, OPEN_ORDERS, filters, Object.fromEntries(BACKLOG_ROWS.map((r) => [r.key, r.where]))),
    countView(recoveredView(period), filters),
    getFeedbackForPeriod(period, filters),
    dataCheckSummary(ctx),
  ]);

  const perf: TableSection = {
    kind: "table",
    key: "performance",
    heading: "Weekly Performance",
    head: ["Metric", "This Week", "Last Week", "Variance", "% Change"],
    rows: WEEKLY_METRICS.map((m) => {
      const a = derived(cur, m.key);
      const b = derived(last, m.key);
      const isRate = m.format === "percent";
      const variance = a === null || b === null ? null : a - b;
      const isCohort = m.key !== "confirmationRate" && m.key !== "deliveryRate" && m.key !== "aov";
      return [
        label(m.label),
        isCohort ? metricCell(ctx, m.key as CohortMetricKey, a, m.format, { bold: true }) : num(fmt(a, m.format), { bold: true }),
        isCohort ? metricCell(ctx, m.key as CohortMetricKey, b, m.format, { span: "prev" }) : num(fmt(b, m.format)),
        num(isRate ? (variance === null ? DASH : `${variance > 0 ? "+" : variance < 0 ? "−" : ""}${Math.abs(variance).toFixed(1)} pts`) : fmtSigned(variance, m.format)),
        signedPctCell(a === null || b === null ? null : growth(a, b)),
      ];
    }),
    note: "Variance = This Week − Last Week. % Change = Variance ÷ Last Week × 100. Rate variance is in percentage points.",
  };

  // Pre-answer "what improved / declined the most" so the manager only adds the why.
  const movers = WEEKLY_METRICS.map((m) => {
    const a = derived(cur, m.key);
    const b = derived(last, m.key);
    return { m, a, b, g: a === null || b === null ? null : growth(a, b) };
  }).filter((x) => x.g !== null && x.g !== 0);
  const up = movers.filter((x) => x.g! > 0).sort((x, y) => y.g! - x.g!)[0];
  const down = movers.filter((x) => x.g! < 0).sort((x, y) => x.g! - y.g!)[0];
  const moverText = (x: typeof up) =>
    x ? `${x.m.label}: ${fmt(x.b, x.m.format)} → ${fmt(x.a, x.m.format)} (${x.g! > 0 ? "+" : "−"}${Math.abs(x.g!).toFixed(1)}%).` : "";

  const openBacklog = BACKLOG_ROWS.reduce((s, r) => s + (r.key === "rescheduled" || r.key === "unresponsive" ? 0 : backlog[r.key]?.count ?? 0), 0);
  const feedbackTotal = Object.values(feedback.counts).reduce((s, n) => s + n, 0);
  const complaints = (feedback.counts.PRODUCT_COMPLAINT ?? 0) + (feedback.counts.DELIVERY_COMPLAINT ?? 0);

  const sections: ReportSection[] = [
    perf,
    teamTable(ctx, "teams", "Weekly Team Comparison", ["revenue", "target", "achievement", "handled", "confirmed", "delivered", "deliveryRate", "aov"], teams, byTeam, cur, targets),
    {
      kind: "review",
      key: "review",
      heading: "Weekly Management Review",
      areas: [
        { key: "improved", label: "What improved", prefill: moverText(up) },
        { key: "declined", label: "What declined", prefill: moverText(down) },
        { key: "challenges", label: "Main challenges", prefill: "" },
        {
          key: "backlog",
          label: "Backlog",
          prefill: `${openBacklog} open orders now (${backlog.pendingConfirmation?.count ?? 0} pending confirmation, ${backlog.pendingDelivery?.count ?? 0} pending delivery, ${backlog.failed?.count ?? 0} failed attempts); ${recovered.count} recovered this week.`,
        },
        {
          key: "feedback",
          label: "Customer feedback",
          prefill: feedbackTotal ? `${feedbackTotal} feedback entries this week, ${complaints} complaints.` : "No customer feedback recorded this week.",
        },
        {
          key: "delivery",
          label: "Delivery performance",
          prefill: `Delivery rate ${fmt(rate(cur.delivered, cur.handled), "percent")} (last week ${fmt(rate(last.delivered, last.handled), "percent")}).`,
        },
      ],
    },
  ];

  return doc(ctx, sections, checks);
}

// ── Monthly / Quarterly ──────────────────────────────────────────────────────

async function buildPeriodic(type: "MONTH" | "QUARTER", periodKey: string | null, filters: SalesReportFilters): Promise<ReportDocument> {
  const period = periodFromKey(type, periodKey);
  const prev = previousPeriod(period);
  const ctx: Ctx = { type, period, filters, showTargets: targetsApply(filters) };
  const bounds = { start: period.start, end: period.end };
  const noun = type === "MONTH" ? "Month" : "Quarter";
  const title = type === "MONTH" ? "Monthly" : "Quarterly";

  const [teams, targets, cur, last, byTeam, byProduct, checks] = await Promise.all([
    getSalesTeams(),
    getTargets(type, period.key),
    cohortTotals(bounds, filters),
    cohortTotals({ start: prev.start, end: prev.end }, filters),
    cohortByTeam(bounds, filters),
    cohortByProduct(bounds, filters),
    dataCheckSummary(ctx),
  ]);

  const teamColumns: TeamColumn[] =
    type === "MONTH"
      ? ["revenue", "target", "achievement", "handled", "confirmed", "delivered", "confirmationRate", "deliveryRate", "aov"]
      : ["revenue", "target", "achievement", "handled", "delivered", "deliveryRate", "aov"];

  const productTable: TableSection =
    type === "MONTH"
      ? {
          kind: "table",
          key: "products",
          heading: "Product Performance",
          head: ["Product", "Orders", "Confirmed", "Delivered", "Revenue", "AOV", "Reorders"],
          rows: byProduct.map((p) => {
            const row = { product: p.productId };
            return [
              label(p.productName),
              metricCell(ctx, "handled", p.handled, "number", { row }),
              metricCell(ctx, "confirmed", p.confirmed, "number", { row }),
              metricCell(ctx, "delivered", p.delivered, "number", { row }),
              metricCell(ctx, "revenue", p.revenue, "currency", { row }),
              num(fmt(aov(p.revenue, p.delivered), "currency")),
              metricCell(ctx, "reorders", p.reorders, "number", { row }),
            ];
          }),
          emptyText: "No orders this month.",
          note: "An order counts once under each product it contains. Product revenue follows each line's share of the order (after discount).",
        }
      : {
          kind: "table",
          key: "products",
          heading: "Quarterly Product Performance",
          head: ["Product", "Orders", "Revenue", "Delivered", "AOV", "Reorder Rate"],
          rows: byProduct.map((p) => {
            const row = { product: p.productId };
            return [
              label(p.productName),
              metricCell(ctx, "handled", p.handled, "number", { row }),
              metricCell(ctx, "revenue", p.revenue, "currency", { row }),
              metricCell(ctx, "delivered", p.delivered, "number", { row }),
              num(fmt(aov(p.revenue, p.delivered), "currency")),
              num(fmt(rate(p.reorders, p.handled), "percent")),
            ];
          }),
          emptyText: "No orders this quarter.",
          note: "Reorder Rate = reorders ÷ orders for the product.",
        };

  const customers: TableSection = {
    kind: "table",
    key: "customers",
    heading: type === "MONTH" ? "Customer Performance" : "Quarterly Customer Analysis",
    head: ["Metric", "Total"],
    rows: [
      [label("New Customers"), metricCell(ctx, "newCustomers", cur.newCustomers, "number")],
      [label("Returning Customers"), metricCell(ctx, "returningCustomers", cur.returningCustomers, "number")],
      [label("Reorders"), metricCell(ctx, "reorders", cur.reorders, "number")],
      [label("Referrals"), muted("Not tracked")],
      [label("Upsells"), metricCell(ctx, "upsells", cur.upsells, "number")],
      [label("Cross-sells"), metricCell(ctx, "crossSells", cur.crossSells, "number")],
      [label("Cancelled Orders"), metricCell(ctx, "cancelled", cur.cancelled, "number")],
    ],
    note: "Customers are matched by phone number. Referrals are not captured on orders yet.",
  };

  const sections: ReportSection[] = [
    execTable(ctx, "executive", `${title} Executive Dashboard`, cur, targets, teams, {
      kind: "previous",
      totals: last,
      label: `Previous ${noun}`,
    }),
    teamTable(ctx, "teams", `${title} Team Performance`, teamColumns, teams, byTeam, cur, targets),
    productTable,
    customers,
  ];

  return doc(ctx, sections, checks);
}

export function buildMonthlyReport(periodKey: string | null, filters: SalesReportFilters): Promise<ReportDocument> {
  return buildPeriodic("MONTH", periodKey, filters);
}

export function buildQuarterlyReport(periodKey: string | null, filters: SalesReportFilters): Promise<ReportDocument> {
  return buildPeriodic("QUARTER", periodKey, filters);
}

export function buildReport(type: PeriodType, periodKey: string | null, filters: SalesReportFilters): Promise<ReportDocument> {
  switch (type) {
    case "DAY":
      return buildDailyReport(periodKey, filters);
    case "WEEK":
      return buildWeeklyReport(periodKey, filters);
    case "MONTH":
      return buildMonthlyReport(periodKey, filters);
    case "QUARTER":
      return buildQuarterlyReport(periodKey, filters);
  }
}

