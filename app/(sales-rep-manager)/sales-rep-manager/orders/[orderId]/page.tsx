import { notFound } from "next/navigation";
import { getOrderWithDetails } from "@/modules/orders/services/orders.service";
import { OrderDetailClient } from "../../[repId]/orders/[orderId]/order-detail-client";
import { mapOrderToDetail } from "../../_lib/map-order-detail";

export const dynamic = "force-dynamic";

export default async function TeamOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const dbOrder = await getOrderWithDetails(orderId);

  if (!dbOrder) notFound();

  const repName = dbOrder.salesRep?.name ?? "Sales Rep";
  const repId = dbOrder.salesRepId ?? "unknown";

  const order = mapOrderToDetail(dbOrder, repName);

  return <OrderDetailClient repId={repId} repName={repName} order={order} />;
}
