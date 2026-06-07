import { SalesRepListClient } from "./_components/SalesRepListClient";
import { getSalesRepsList, getSalesTeams } from "@/modules/data-analysis/services/data-analysis.service";

export default async function DataDashboard() {
  const [reps, teams] = await Promise.all([
    getSalesRepsList(),
    getSalesTeams(),
  ]);
  return <SalesRepListClient initialReps={reps} teams={teams} />;
}
