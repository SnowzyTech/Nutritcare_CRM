import { notFound } from "next/navigation";
import { getSalesRepById } from "@/modules/users/services/users.service";
import { getOrderWithDetails } from "@/modules/orders/services/orders.service";
import { formatCurrency } from "@/lib/utils";
import { OrderDetailClient } from "./order-detail-client";
import type { OrderDetail } from "@/lib/mock-data/sales-rep-manager";

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

  const firstItem = dbOrder.items[0];
  const secondItem = dbOrder.items[1];

  const order: OrderDetail = {
    orderId: dbOrder.id,
    status: dbOrder.status as OrderDetail["status"],
    customer: {
      fullName: dbOrder.customer.name,
      phone: dbOrder.customer.phone,
      whatsapp: dbOrder.customer.whatsappNumber ?? dbOrder.customer.phone,
      email: dbOrder.customer.email ?? "",
      address: dbOrder.customer.deliveryAddress,
      state: dbOrder.customer.state,
      lga: dbOrder.customer.lga,
      landmark: dbOrder.customer.landmark ?? "",
    },
    product: firstItem?.product.name ?? "—",
    quantity: dbOrder.items.reduce((sum, i) => sum + i.quantity, 0),
    upsell: secondItem ? { product: secondItem.product.name, quantity: secondItem.quantity } : null,
    totalPrice: formatCurrency(Number(dbOrder.totalAmount)),
    source: dbOrder.customer.source ?? "—",
    contactedVia: "none",
    prescription: dbOrder.notes ?? "",
    history: [
      "Order Created",
      `Sales Rep Assigned: ${rep.name}`,
      ...(dbOrder.agent ? [`Agent: ${dbOrder.agent.companyName}`] : []),
    ],
  };

  return <OrderDetailClient repId={repId} repName={rep.name} order={order} />;
}
