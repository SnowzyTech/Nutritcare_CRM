import { AnalyticsDashboardClient } from "../../../_components/AnalyticsDashboardClient";

export default async function SalesRepAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AnalyticsDashboardClient id={id} />;
}
