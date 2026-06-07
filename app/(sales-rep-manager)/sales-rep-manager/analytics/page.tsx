import { auth } from "@/lib/auth/auth";
import { getManagerWithTeam, getTeamAnalytics } from "@/modules/users/services/users.service";
import { parseMonthParam } from "@/lib/month-period";
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
  const { current, trends, tables, reportMetrics } = analytics ?? {
    current: {
      totalProductsSold: 0, distinctCustomers: 0, generalPerformance: 0,
      upsellRate: 0, confirmationRate: 0, deliveryRate: 0, cancellationRate: 0,
      recoveryRate: 0, reorderRate: 0, kpi: 0, bestProduct: null,
    },
    trends: {
      totalProductsSold: "—", distinctCustomers: "—", generalPerformance: "—",
      upsellRate: "—", confirmationRate: "—", deliveryRate: "—", cancellationRate: "—",
      recoveryRate: "—", reorderRate: "—", kpi: "—",
    },
    tables: { bestSellingTable: [], upsellingTable: [] },
    reportMetrics: null,
  };

  const data: AnalyticsData = {
    totalProductsSold: { value: String(current.totalProductsSold), trend: trends.totalProductsSold },
    totalOrderCustomer: { value: String(current.distinctCustomers), trend: trends.distinctCustomers },
    bestSellingProduct: { name: current.bestProduct?.name ?? "—", subtitle: "this month" },
    generalPerformance: { value: `${current.generalPerformance}%`, trend: trends.generalPerformance },
    upsellingRate: { value: `${current.upsellRate}%`, trend: trends.upsellRate },
    confirmationRate: { value: `${current.confirmationRate}%`, trend: trends.confirmationRate },
    deliveryRate: { value: `${current.deliveryRate}%`, trend: trends.deliveryRate },
    cancellationRate: { value: `${current.cancellationRate}%`, trend: trends.cancellationRate },
    recoveryRate: { value: `${current.recoveryRate}%`, trend: trends.recoveryRate },
    reorderRate: { value: `${current.reorderRate}%`, trend: trends.reorderRate },
    kpi: { value: `${current.kpi}%`, trend: trends.kpi, target: KPI_TARGET },
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
