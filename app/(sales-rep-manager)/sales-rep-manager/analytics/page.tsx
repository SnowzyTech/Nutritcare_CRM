import { getTeamAnalytics, getCompanyAnalytics, getAllTeams } from "@/modules/users/services/users.service";
import { resolveManagerScope } from "../_lib/manager-scope";
import { parseMonthParam } from "@/lib/month-period";
import { calculateBonus } from "@/lib/bonus";
import { AnalyticsDashboardClient, AnalyticsData } from "./analytics-dashboard-client";
import { StaffPeriodFilter } from "@/components/admin/staff-period-filter";
import { TeamSelect } from "./team-select";
import { resolveAnalyticsPeriod } from "./analytics-period";
import { TeamAnalyticsReportButtons } from "./report-buttons";

export const dynamic = "force-dynamic";

const KPI_TARGET = "65%";

export default async function TeamAnalyticsPage(props: {
  searchParams: Promise<{ g?: string; month?: string; w?: string; d?: string; team?: string }>;
}) {
  const { team: teamParam, ...periodParams } = await props.searchParams;
  const { month } = periodParams;
  const { granularity, periodArg, periodText, vsLabel, bonusPeriod, bonusPeriodLabel } =
    resolveAnalyticsPeriod(periodParams);

  const mp = parseMonthParam(month);
  const currentMonthParam =
    month ?? `${mp.year}-${String(mp.month).padStart(2, "0")}`;

  const { isCompanyManager, teamId, teamName } = await resolveManagerScope();

  // Company managers can narrow the company-wide view to a single team ("All"
  // by default). Team-leads have no such filter — always their own team.
  const salesTeams = isCompanyManager
    ? (await getAllTeams()).filter(t => t.department === "SALES")
    : [];
  const selectedTeam =
    isCompanyManager && teamParam ? salesTeams.find(t => t.id === teamParam) ?? null : null;

  const analytics = isCompanyManager
    ? selectedTeam
      ? await getTeamAnalytics(selectedTeam.id, periodArg)
      : await getCompanyAnalytics(periodArg)
    : teamId
      ? await getTeamAnalytics(teamId, periodArg)
      : null;

  const reportTeamName = selectedTeam?.name ?? teamName;
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

  const data: AnalyticsData = {
    monthLabel: periodText,
    vsLabel,
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
      // Bonuses are weekly/monthly only; the Day view shows "not applicable".
      ...(bonusPeriod
        ? calculateBonus(current.kpi, current.total, bonusPeriod, memberCount)
        : { amount: 0, eligible: false, reason: "Bonuses apply to weekly/monthly periods" }),
      kpi: current.kpi,
      periodLabel: bonusPeriodLabel,
    },
    bestSellingTable: tables.bestSellingTable,
    upsellingTable: tables.upsellingTable,
  };

  return (
    <AnalyticsDashboardClient
      header={{ type: "team" }}
      data={data}
      monthSelector={
        <div className="flex flex-wrap items-center gap-3">
          {isCompanyManager && <TeamSelect teams={salesTeams} />}
          <StaffPeriodFilter />
        </div>
      }
      reportButtons={
        granularity === "month" && reportMetrics ? (
          <TeamAnalyticsReportButtons
            monthlyData={reportMetrics}
            month={currentMonthParam}
            teamName={reportTeamName}
          />
        ) : undefined
      }
    />
  );
}
