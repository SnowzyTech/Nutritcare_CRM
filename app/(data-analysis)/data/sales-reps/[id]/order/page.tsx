import { OrderDashboardClient } from "../../../_components/OrderDashboardClient";
import { getSalesRepOrders, getSalesRepProfile } from "@/modules/data-analysis/services/data-analysis.service";
import { notFound } from "next/navigation";

export default async function SalesRepOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [orders, repProfile] = await Promise.all([
    getSalesRepOrders(id),
    getSalesRepProfile(id),
  ]);

  if (!repProfile) {
    notFound();
  }

  return <OrderDashboardClient initialOrders={orders} repProfile={repProfile} />;
}
