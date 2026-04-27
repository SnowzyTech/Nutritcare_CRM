import { OrderDetailClient } from "../../_components/OrderDetailClient";
import { ORDER_DETAILS } from "@/lib/mock-data/data-analysis";
import { notFound } from "next/navigation";

export default async function GeneralOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = ORDER_DETAILS[orderId];

  if (!order) {
    // Fallback to first mock order if not found, for prototype purposes
    const fallbackOrder = Object.values(ORDER_DETAILS)[0];
    return <OrderDetailClient order={fallbackOrder} />;
  }

  return <OrderDetailClient order={order} />;
}
