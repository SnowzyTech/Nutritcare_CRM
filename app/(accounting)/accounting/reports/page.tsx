import { ReportsClient } from "../_components/ReportsClient";
import { getAgentPerformanceReport } from "@/modules/finance/services/reports.service";

export default async function ReportsPage() {
  const data = await getAgentPerformanceReport();
  return <ReportsClient agentPerformance={data} />;
}
