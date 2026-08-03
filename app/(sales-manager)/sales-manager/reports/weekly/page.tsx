import { auth } from "@/lib/auth/auth";
import { ReportView } from "@/components/reports/report-view";
import { PeriodSwitcher } from "@/components/reports/period-switcher";
import { SALES_WEEKLY } from "@/modules/reports/definitions";
import {
  biggestMover,
  parseWeekParam,
  rangeLabel,
  weekEndingLabel,
  weekRange,
} from "@/modules/reports/services/period.service";
import {
  getBacklog,
  getCsPerformance,
  getSalesScorecard,
} from "@/modules/orders/services/sales-report.service";
import { getWhatsappAdsReport } from "@/modules/media-buyer/services/media-buyer.service";
import type { NarrativeValues, ReportTable } from "@/modules/reports/types";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function toParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function SalesWeeklyReportPage({
  searchParams,
}: {
  // Next 16: searchParams is a Promise and must be awaited before reading it.
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const weekParam = typeof sp.week === "string" ? sp.week : undefined;

  const current = parseWeekParam(weekParam);
  const prior = weekRange(new Date(current.from.getTime() - DAY_MS));

  const [session, scorecard, csPerformance, backlog, ads] = await Promise.all([
    auth(),
    getSalesScorecard(current, prior),
    getCsPerformance(current),
    getBacklog(current),
    getWhatsappAdsReport(current),
  ]);

  // Pre-answer "which metric moved most?" so the manager only supplies the why —
  // that reasoning is the part the samples show being worked out by hand.
  const riser = biggestMover(scorecard.rows, "up");
  const faller = biggestMover(scorecard.rows, "down");

  const moverSentence = (row: typeof riser, verb: string) =>
    row
      ? `${row.label} ${verb} the most, moving from ${row.priorDisplay} to ${row.currentDisplay} (${
          row.deltaPct! > 0 ? "+" : ""
        }${row.deltaPct!.toFixed(1)}%).`
      : "";

  const prefill: NarrativeValues = {
    improvedMetric: moverSentence(riser, "improved"),
    declinedMetric: moverSentence(faller, "declined"),
  };

  const tables: ReportTable[] = [
    {
      key: "cs",
      heading: "CS Weekly Performance (by product and team)",
      head: ["Product", "Team", "Name", "Handled", "Confirmed", "Delivered", "%"],
      body: csPerformance.map((r) => [
        r.product,
        r.team,
        r.rep,
        r.handled,
        r.confirmed,
        r.delivered,
        `${r.ratePct.toFixed(1)}%`,
      ]),
      emptyText: "No orders handled this week.",
    },
    {
      key: "backlog",
      heading: "Backlog Report",
      head: ["Team", "Handled", "Confirmed", "Confirmation Rate", "Delivered", "Delivery Rate"],
      body: backlog.map((r) => [
        r.team,
        r.handled,
        r.confirmed,
        `${r.confirmationRate.toFixed(1)}%`,
        r.delivered,
        `${r.deliveryRate.toFixed(1)}%`,
      ]),
      emptyText: "No outstanding orders carried into this week.",
    },
    {
      key: "ads",
      heading: "WhatsApp Ads Report",
      head: ["Product", "Leads", "Handled", "Confirmed", "Delivered", "Revenue", "Conversion"],
      body: ads.map((r) => [
        r.product,
        r.totalLeads,
        r.handled,
        r.confirmed,
        r.delivered,
        `NGN ${Math.round(r.revenue).toLocaleString("en-NG")}`,
        `${r.conversionPct.toFixed(1)}%`,
      ]),
      emptyText: "No form-originated orders this week.",
    },
  ];

  return (
    <ReportView
      slug="sales-weekly"
      title="Sales Weekly Performance Review"
      submittedBy={session?.user?.name ?? "Sales Manager"}
      periodLabel={weekEndingLabel(current)}
      periodKey={toParam(current.from)}
      scorecard={scorecard.rows}
      scorecardCurrentLabel="This Week"
      scorecardPriorLabel="Last Week"
      tables={tables}
      narrative={SALES_WEEKLY}
      prefill={prefill}
      periodControl={
        <PeriodSwitcher
          unit="week"
          paramKey="week"
          current={toParam(current.from)}
          label={rangeLabel(current)}
        />
      }
    />
  );
}
