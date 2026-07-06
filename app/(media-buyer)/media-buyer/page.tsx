import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { getMediaBuyerDashboard } from "@/modules/media-buyer/services/media-buyer.service";
import { MediaBuyerDashboardClient } from "./dashboard-client";

export const metadata: Metadata = { title: "Dashboard" };

export default async function MediaBuyerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const firstName = (session?.user?.name ?? "there").split(" ")[0];
  const period = (await searchParams).period ?? "this-month";

  const data = userId
    ? await getMediaBuyerDashboard(userId, period)
    : {
        metrics: {
          totalDeliveredOrders: 0,
          totalLeads: 0,
          conversionRate: 0,
          totalForms: 0,
          productLines: [],
          bestPerformingProduct: null,
        },
        funnel: { views: 0, leads: 0, conversion: 0 },
        forms: [],
      };

  return <MediaBuyerDashboardClient data={data} firstName={firstName} period={period} />;
}
