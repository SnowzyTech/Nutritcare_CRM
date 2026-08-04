import { auth } from "@/lib/auth/auth";
import { ReportView } from "@/components/reports/report-view";
import { PeriodSwitcher } from "@/components/reports/period-switcher";
import { LOGISTICS_DAILY } from "@/modules/reports/definitions";
import {
  dayRange,
  monthToDateRange,
  parseDayParam,
  previousDayRange,
  rangeLabel,
} from "@/modules/reports/services/period.service";
import {
  getAgentPerformance,
  getLogisticsScorecard,
  NOT_TRACKED,
} from "@/modules/delivery/services/logistics-report.service";
import type { ReportTable } from "@/modules/reports/types";

export const dynamic = "force-dynamic";

function toParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function LogisticsDailyReportPage({
  searchParams,
}: {
  // Next 16: searchParams is a Promise and must be awaited before reading it.
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const dateParam = typeof sp.date === "string" ? sp.date : undefined;

  const anchor = parseDayParam(dateParam);
  const today = dayRange(anchor);
  const yesterday = previousDayRange(anchor);
  const mtd = monthToDateRange(anchor);

  const [session, scorecard, mtdScorecard, agents] = await Promise.all([
    auth(),
    getLogisticsScorecard(today, yesterday),
    getLogisticsScorecard(mtd, null),
    getAgentPerformance(today),
  ]);

  const tables: ReportTable[] = [
    {
      key: "failure-reasons",
      heading: "Failed Delivery Breakdown",
      head: [],
      body: [],
      notTrackedReason: NOT_TRACKED.failureReasons,
    },
    {
      key: "agents",
      heading: "Agent Activity Today",
      head: ["Agent", "State", "Assigned", "Delivered", "Rate", "Status"],
      body: agents.map((a) => [
        a.agent,
        a.state,
        a.assigned,
        a.delivered,
        `${a.ratePct.toFixed(1)}%`,
        a.band,
      ]),
      emptyText: "No deliveries assigned today.",
    },
  ];

  return (
    <ReportView
      slug="logistics-daily"
      title="Logistics Daily Executive Update"
      submittedBy={session?.user?.name ?? "Logistics Manager"}
      periodLabel={rangeLabel(today)}
      periodKey={toParam(anchor)}
      scorecard={scorecard.rows}
      scorecardCurrentLabel="Today"
      scorecardPriorLabel="Yesterday"
      secondaryScorecard={{
        heading: "Month to Date",
        rows: mtdScorecard.rows,
        currentLabel: "MTD",
      }}
      tables={tables}
      narrative={LOGISTICS_DAILY}
      periodControl={
        <PeriodSwitcher
          unit="day"
          paramKey="date"
          current={toParam(anchor)}
          label={rangeLabel(today)}
        />
      }
    />
  );
}
