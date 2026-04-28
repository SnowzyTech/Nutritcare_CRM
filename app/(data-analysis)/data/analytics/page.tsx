import { AnalyticsClient } from "../_components/AnalyticsClient";
import { getTeamsAnalytics } from "@/modules/data-analysis/services/data-analysis.service";

export default async function AnalyticsPage() {
  const teamsData = await getTeamsAnalytics();
  return <AnalyticsClient teamsData={teamsData} />;
}
