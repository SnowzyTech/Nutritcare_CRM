import { auth } from "@/lib/auth/auth";
import { getManagerWithTeam, getTeamAnalytics } from "@/modules/users/services/users.service";
import { AnalyticsDashboardClient, AnalyticsData } from "./analytics-dashboard-client";

export const dynamic = "force-dynamic";

export default async function TeamAnalyticsPage() {
  const session = await auth();
  const managerId = session?.user?.id;

  const manager = managerId ? await getManagerWithTeam(managerId) : null;
  const teamId = manager?.teamId;

  const analytics = teamId ? await getTeamAnalytics(teamId) : null;
  const { current, trends, tables } = analytics ?? {
    current: {
      totalProductsSold: 0, distinctCustomers: 0, generalPerformance: 0,
      upsellRate: 0, confirmationRate: 0, deliveryRate: 0, cancellationRate: 0,
      bestProduct: null,
    },
    trends: {
      totalProductsSold: "—", distinctCustomers: "—", generalPerformance: "—",
      upsellRate: "—", confirmationRate: "—", deliveryRate: "—", cancellationRate: "—",
    },
    tables: { bestSellingTable: [], upsellingTable: [] },
  };

  const data: AnalyticsData = {
    totalProductsSold: {
      value: String(current.totalProductsSold),
      trend: trends.totalProductsSold,
    },
    totalOrderCustomer: {
      value: String(current.distinctCustomers),
      trend: trends.distinctCustomers,
    },
    bestSellingProduct: {
      name: current.bestProduct?.name ?? "—",
      subtitle: "this month",
    },
    generalPerformance: {
      value: `${current.generalPerformance}%`,
      trend: trends.generalPerformance,
    },
    upsellingRate: {
      value: `${current.upsellRate}%`,
      trend: trends.upsellRate,
    },
    confirmationRate: {
      value: `${current.confirmationRate}%`,
      trend: trends.confirmationRate,
    },
    deliveryRate: {
      value: `${current.deliveryRate}%`,
      trend: trends.deliveryRate,
    },
    cancellationRate: {
      value: `${current.cancellationRate}%`,
      trend: trends.cancellationRate,
    },
    recoveryRate: { value: "—", trend: "—" },
    kpi: { value: "—", trend: "—", target: "—" },
    bestSellingTable: tables.bestSellingTable,
    upsellingTable: tables.upsellingTable,
  };

  return (
    <AnalyticsDashboardClient
      header={{ type: "team" }}
      data={data}
      showReports={true}
    />
  );
}
