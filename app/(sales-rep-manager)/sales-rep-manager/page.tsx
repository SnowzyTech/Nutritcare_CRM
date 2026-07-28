import { TeamRepsClient } from "./team-reps-client";
import { CompanyOverviewClient, type CompanyRep } from "./company-overview-client";
import { resolveManagerScope } from "./_lib/manager-scope";
import {
  getCompanyAnalytics,
  getCompanyOrderStatusCounts,
  getSalesTeamLeads,
} from "@/modules/users/services/users.service";
import { parseRange, resolveAnalyticsPeriod } from "./analytics/analytics-period";

export const dynamic = "force-dynamic";

export default async function SalesRepManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; month?: string }>;
}) {
  const { isCompanyManager, reps, teamName } = await resolveManagerScope();

  if (!isCompanyManager) {
    return <TeamRepsClient reps={reps} teamName={teamName} />;
  }

  const { range: rangeParam, month } = await searchParams;
  const range = parseRange(rangeParam);
  const { periodArg, periodText } = resolveAnalyticsPeriod(range, month);

  const [analytics, pipeline, salesLeads] = await Promise.all([
    getCompanyAnalytics(periodArg),
    getCompanyOrderStatusCounts(),
    getSalesTeamLeads(),
  ]);

  const { current, trends } = analytics;
  const unassignedLeads = salesLeads
    .filter((l) => !l.team)
    .map((l) => ({ id: l.id, name: l.name }));

  return (
    <CompanyOverviewClient
      reps={reps as CompanyRep[]}
      pipeline={pipeline}
      unassignedLeads={unassignedLeads}
      periodText={periodText}
      performance={{
        totalOrders: current.total,
        delivered: current.delivered,
        kpi: current.kpi,
        deliveryRate: current.deliveryRate,
        trends: {
          total: trends.total,
          delivered: trends.delivered,
          kpi: trends.kpi,
          deliveryRate: trends.deliveryRate,
        },
      }}
    />
  );
}
