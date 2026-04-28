import { AnalyticsDashboardClient } from "../../../_components/AnalyticsDashboardClient";
import { getSalesRepAnalyticsForUI, getSalesRepProfile } from "@/modules/data-analysis/services/data-analysis.service";
import { notFound } from "next/navigation";

export default async function SalesRepAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [analytics, repProfile] = await Promise.all([
    getSalesRepAnalyticsForUI(id),
    getSalesRepProfile(id),
  ]);

  if (!repProfile) {
    notFound();
  }

  return <AnalyticsDashboardClient analytics={analytics} repProfile={repProfile} />;
}
