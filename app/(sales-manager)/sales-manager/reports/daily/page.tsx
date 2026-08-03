import { auth } from "@/lib/auth/auth";
import { ReportView } from "@/components/reports/report-view";
import { PeriodSwitcher } from "@/components/reports/period-switcher";
import { SALES_DAILY } from "@/modules/reports/definitions";
import {
  dayRange,
  monthToDateRange,
  parseDayParam,
  previousDayRange,
  rangeLabel,
} from "@/modules/reports/services/period.service";
import {
  getBacklog,
  getCancellationReasons,
  getSalesScorecard,
} from "@/modules/orders/services/sales-report.service";
import { getWhatsappAdsReport } from "@/modules/media-buyer/services/media-buyer.service";
import type { ReportTable } from "@/modules/reports/types";

export const dynamic = "force-dynamic";

function toParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function SalesDailyReportPage({
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

  const [session, scorecard, mtdScorecard, backlog, ads, cancellations] = await Promise.all([
    auth(),
    getSalesScorecard(today, yesterday),
    getSalesScorecard(mtd, null),
    getBacklog(today),
    getWhatsappAdsReport(today),
    getCancellationReasons(today),
  ]);

  const tables: ReportTable[] = [
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
      emptyText: "No outstanding orders carried into this day.",
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
      emptyText: "No form-originated orders today.",
    },
    {
      key: "cancellations",
      heading: "Recorded Cancellation Reasons",
      head: ["Reason", "Count"],
      body: cancellations.map((r) => [r.reason, r.count]),
      emptyText: "No cancellations recorded today.",
    },
  ];

  return (
    <ReportView
      slug="sales-daily"
      title="Sales Daily Executive Update"
      submittedBy={session?.user?.name ?? "Sales Manager"}
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
      narrative={SALES_DAILY}
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
