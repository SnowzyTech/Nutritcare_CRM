import { notFound } from "next/navigation";
import { getSalesRepById } from "@/modules/users/services/users.service";
import { getOrderWithDetails } from "@/modules/orders/services/orders.service";
import { getAgentsForReassignment } from "@/modules/delivery/services/agents.service";
import { OrderDetailClient } from "./order-detail-client";
import { mapOrderToDetail } from "../../../_lib/map-order-detail";
import { mapAgentsForReassignment } from "../../../_lib/map-agents";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ repId: string; orderId: string }>;
}) {
  const { repId, orderId } = await params;

  const [rep, dbOrder, rawAgents] = await Promise.all([
    getSalesRepById(repId),
    getOrderWithDetails(orderId),
    getAgentsForReassignment(),
  ]);

  if (!rep || !dbOrder) notFound();

  const order = mapOrderToDetail(dbOrder, rep.name);

  return (
    <OrderDetailClient
      repId={repId}
      repName={rep.name}
      order={order}
      agents={mapAgentsForReassignment(rawAgents)}
    />
  );
}
