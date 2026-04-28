import { OrderDetailClient } from "../../_components/OrderDetailClient";
import { getOrderByOrderNumber } from "@/modules/data-analysis/services/data-analysis.service";
import { notFound } from "next/navigation";

export default async function GeneralOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await getOrderByOrderNumber(orderId);

  if (!order) {
    notFound();
  }

  return <OrderDetailClient order={order} />;
}
