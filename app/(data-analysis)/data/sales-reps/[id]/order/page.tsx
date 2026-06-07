import { OrderDashboardClient } from "../../../_components/OrderDashboardClient";
import { getSalesRepOrders, getSalesRepProfile, getDeliveryAgents, getProductsForFilter } from "@/modules/data-analysis/services/data-analysis.service";
import { notFound } from "next/navigation";

export default async function SalesRepOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [orders, repProfile, deliveryAgents, products] = await Promise.all([
    getSalesRepOrders(id),
    getSalesRepProfile(id),
    getDeliveryAgents(),
    getProductsForFilter(),
  ]);

  if (!repProfile) {
    notFound();
  }

  return <OrderDashboardClient initialOrders={orders} repProfile={repProfile} deliveryAgents={deliveryAgents} products={products} />;
}
