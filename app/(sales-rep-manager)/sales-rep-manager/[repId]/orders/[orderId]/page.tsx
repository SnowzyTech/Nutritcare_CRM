import { notFound } from "next/navigation";
import { getSalesRepById } from "@/modules/users/services/users.service";
import { getOrderWithDetails } from "@/modules/orders/services/orders.service";
import { OrderDetailClient } from "./order-detail-client";
import { mapOrderToDetail } from "../../../_lib/map-order-detail";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ repId: string; orderId: string }>;
}) {
  const { repId, orderId } = await params;

  const [rep, dbOrder] = await Promise.all([
    getSalesRepById(repId),
    getOrderWithDetails(orderId),
  ]);

  if (!rep || !dbOrder) notFound();

  const order = mapOrderToDetail(dbOrder, rep.name);

  return <OrderDetailClient repId={repId} repName={rep.name} order={order} />;
}
