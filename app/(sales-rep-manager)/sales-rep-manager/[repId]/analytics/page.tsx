import { MOCK_REP_DETAILS } from "@/lib/mock-data/sales-rep-manager";
import { notFound } from "next/navigation";
import { AnalyticsDashboardClient, AnalyticsData } from "../../analytics/analytics-dashboard-client";

export const dynamic = "force-dynamic";

export default async function RepAnalyticsPage({
  params,
}: {
  params: Promise<{ repId: string }>;
}) {
  const { repId } = await params;
  const rep = MOCK_REP_DETAILS[repId] || MOCK_REP_DETAILS["2"];

  if (!rep) {
    notFound();
  }

  // Exact mock data matching Image 1
  const mockData: AnalyticsData = {
    totalProductsSold: { value: "180", trend: "+21%" },
    totalOrderCustomer: { value: "64", trend: "+12%" },
    bestSellingProduct: { name: "Prosxact", subtitle: "Neuro-Vive Balm\nlast month" },
    generalPerformance: { value: "80%", trend: "+12%" },
    upsellingRate: { value: "30%", trend: "+12%" },
    confirmationRate: { value: "60%", trend: "+12%" },
    deliveryRate: { value: "78%", trend: "+12%" },
    cancellationRate: { value: "8%", trend: "+12%" },
    recoveryRate: { value: "27%", trend: "+12%" },
    kpi: { value: "21%", trend: "+12%", target: "XXXXXXX" },
    bestSellingTable: [
      { product: "Prosxact", amountSold: 41 },
      { product: "Neuro-Vive Balm", amountSold: 33 },
      { product: "Trim and Tone", amountSold: 29 },
      { product: "After-Natal", amountSold: 25 },
      { product: "Shred Belly", amountSold: 22 },
      { product: "Linix", amountSold: 18 },
      { product: "Fonio Mill", amountSold: 12 },
    ],
    upsellingTable: [
      { product: "Neuro-Vive Balm", noOfUpsell: 10 },
      { product: "Prosxact", noOfUpsell: 5 },
      { product: "After-Natal", noOfUpsell: 5 },
      { product: "Trim and Tone", noOfUpsell: 4 },
      { product: "Fonio Mill", noOfUpsell: 0 },
      { product: "Shred Belly", noOfUpsell: 0 },
      { product: "Linix", noOfUpsell: 0 },
    ],
  };

  return (
    <AnalyticsDashboardClient
      header={{
        type: "rep",
        repName: rep.name,
        repTeam: rep.team,
      }}
      data={mockData}
      showReports={false}
    />
  );
}
