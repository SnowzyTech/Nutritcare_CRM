import { notFound } from "next/navigation";
import { getOrderWithDetails } from "@/modules/orders/services/orders.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { getAgentsForReassignment } from "@/modules/delivery/services/agents.service";
import { OrderDetailClient } from "../../[repId]/orders/[orderId]/order-detail-client";
import { mapOrderToDetail } from "../../_lib/map-order-detail";
import { mapAgentsForReassignment } from "../../_lib/map-agents";

export const dynamic = "force-dynamic";

export default async function TeamOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const [dbOrder, rawAgents, rawProducts] = await Promise.all([
    getOrderWithDetails(orderId),
    getAgentsForReassignment(),
    getActiveProducts(),
  ]);

  if (!dbOrder) notFound();

  const repName = dbOrder.salesRep?.name ?? "Sales Rep";
  const repId = dbOrder.salesRepId ?? "unknown";

  const order = mapOrderToDetail(dbOrder, repName);

  return (
    <OrderDetailClient
      repId={repId}
      repName={repName}
      order={order}
      agents={mapAgentsForReassignment(rawAgents)}
      products={rawProducts.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
