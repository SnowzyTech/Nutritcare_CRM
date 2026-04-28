import { AnalyticsClient } from "../_components/AnalyticsClient";
import {
  getTeamsAnalytics,
  getCompanyAnalytics,
} from "@/modules/data-analysis/services/data-analysis.service";

export default async function AnalyticsPage() {
  const [teamsData, companyData] = await Promise.all([
    getTeamsAnalytics(),
    getCompanyAnalytics(),
  ]);
  return <AnalyticsClient teamsData={teamsData} companyData={companyData} />;
}
