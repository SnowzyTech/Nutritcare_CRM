import { auth } from "@/lib/auth/auth";
import { getManagerWithTeam, getTeamAnalytics } from "@/modules/users/services/users.service";
import { parseMonthParam, monthLabel } from "@/lib/month-period";
import { calculateBonus } from "@/lib/bonus";
import { AnalyticsDashboardClient, AnalyticsData } from "./analytics-dashboard-client";
import { MonthSelect } from "@/app/(sales-rep)/sales-rep/analytics/month-select";
import { TeamAnalyticsReportButtons } from "./report-buttons";

export const dynamic = "force-dynamic";

const KPI_TARGET = "65%";

export default async function TeamAnalyticsPage(props: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await props.searchParams;
  const period = parseMonthParam(month);
  const currentMonthParam =
    month ?? `${period.year}-${String(period.month).padStart(2, "0")}`;

  const session = await auth();
  const managerId = session?.user?.id;

  const manager = managerId ? await getManagerWithTeam(managerId) : null;
  const teamId = manager?.teamId;
  const teamName = manager?.team?.name ?? "Team";

  const analytics = teamId ? await getTeamAnalytics(teamId, period) : null;
  const { current, trends, tables, reportMetrics, memberCount } = analytics ?? {
    current: {
      totalProductsSold: 0, distinctCustomers: 0, generalPerformance: 0,
      upsellRate: 0, confirmationRate: 0, deliveryRate: 0, cancellationRate: 0,
      recoveryRate: 0, reorderRate: 0, kpi: 0, bestProduct: null,
      total: 0, delivered: 0,
    },
    trends: {
      distinctCustomers: "—", total: "—", delivered: "—", generalPerformance: "—",
      upsellRate: "—", confirmationRate: "—", deliveryRate: "—", cancellationRate: "—",
      recoveryRate: "—", reorderRate: "—", kpi: "—",
    },
    tables: { bestSellingTable: [], upsellingTable: [] },
    reportMetrics: null,
    memberCount: 0,
  };

  const ml = monthLabel(period);
  const periodText = ml === "This Month" ? "this month" : `in ${ml}`;

  const data: AnalyticsData = {
    monthLabel: periodText,
    totalProductsSold: { value: String(current.delivered), trend: trends.delivered },
    totalOrderCustomer: { value: String(current.total), trend: trends.total },
    bestSellingProduct: { name: current.bestProduct?.name ?? "—", subtitle: periodText },
    generalPerformance: { value: `${current.generalPerformance}%`, trend: trends.generalPerformance },
    upsellingRate: { value: `${current.upsellRate}%`, trend: trends.upsellRate },
    confirmationRate: { value: `${current.confirmationRate}%`, trend: trends.confirmationRate },
    deliveryRate: { value: `${current.deliveryRate}%`, trend: trends.deliveryRate },
    cancellationRate: { value: `${current.cancellationRate}%`, trend: trends.cancellationRate },
    recoveryRate: { value: `${current.recoveryRate}%`, trend: trends.recoveryRate },
    reorderRate: { value: `${current.reorderRate}%`, trend: trends.reorderRate },
    kpi: {
      value: `${current.kpi}%`,
      trend: trends.kpi,
      target: KPI_TARGET,
      delivered: current.delivered,
      handled: current.total,
    },
    bonus: {
      // Team aggregate → scale the minimum-orders threshold by the number of reps.
      ...calculateBonus(current.kpi, current.total, "month", memberCount),
      kpi: current.kpi,
      periodLabel: "Monthly",
    },
    bestSellingTable: tables.bestSellingTable,
    upsellingTable: tables.upsellingTable,
  };

  return (
    <AnalyticsDashboardClient
      header={{ type: "team" }}
      data={data}
      monthSelector={<MonthSelect />}
      reportButtons={
        reportMetrics ? (
          <TeamAnalyticsReportButtons
            monthlyData={reportMetrics}
            month={currentMonthParam}
            teamName={teamName}
          />
        ) : undefined
      }
    />
  );
}
