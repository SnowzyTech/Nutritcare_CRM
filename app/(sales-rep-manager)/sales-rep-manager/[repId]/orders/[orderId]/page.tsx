import { notFound } from "next/navigation";
import { getSalesRepById } from "@/modules/users/services/users.service";
import { getOrderWithDetails } from "@/modules/orders/services/orders.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { getAgentsForReassignment } from "@/modules/delivery/services/agents.service";
import { getOrderFeedback } from "@/modules/reports/sales/services/feedback.service";
import { getOrderFollowUps } from "@/modules/reports/sales/services/follow-up.service";
import { OrderDetailClient } from "./order-detail-client";
import { mapOrderToDetail } from "../../../_lib/map-order-detail";
import { mapOrderInteraction } from "@/lib/orders/order-interaction";
import { mapAgentsForReassignment } from "../../../_lib/map-agents";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ repId: string; orderId: string }>;
}) {
  const { repId, orderId } = await params;

  const [rep, dbOrder, rawAgents, rawProducts, customerFeedback, followUps] = await Promise.all([
    getSalesRepById(repId),
    getOrderWithDetails(orderId),
    getAgentsForReassignment(),
    getActiveProducts(),
    getOrderFeedback(orderId),
    getOrderFollowUps(orderId),
  ]);

  if (!rep || !dbOrder) notFound();

  const order = mapOrderToDetail(dbOrder, rep.name);
  const interaction = mapOrderInteraction(dbOrder.feedbacks, customerFeedback, followUps);

  return (
    <OrderDetailClient
      repId={repId}
      repName={rep.name}
      order={order}
      interaction={interaction}
      agents={mapAgentsForReassignment(rawAgents)}
      products={rawProducts.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
