import { TeamRepsClient } from "./team-reps-client";
import { CompanyOverviewClient, type CompanyRep } from "./company-overview-client";
import { resolveManagerScope } from "./_lib/manager-scope";

export const dynamic = "force-dynamic";

export default async function SalesRepManagerPage() {
  const { isCompanyManager, reps, teamName } = await resolveManagerScope();

  if (isCompanyManager) {
    return <CompanyOverviewClient reps={reps as CompanyRep[]} />;
  }

  return <TeamRepsClient reps={reps} teamName={teamName} />;
}
