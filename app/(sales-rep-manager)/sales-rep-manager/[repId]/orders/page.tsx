import { notFound } from "next/navigation";
import { getSalesRepById } from "@/modules/users/services/users.service";
import { getSalesRepOrders } from "@/modules/orders/services/orders.service";
import { OrdersClient, type OrderListItem } from "./orders-client";

export const dynamic = "force-dynamic";

export default async function RepOrdersPage({
  params,
}: {
  params: Promise<{ repId: string }>;
}) {
  const { repId } = await params;
  const rep = await getSalesRepById(repId);

  if (!rep) notFound();

  const dbOrders = await getSalesRepOrders(repId);

  const orders: OrderListItem[] = dbOrders.map(o => ({
    id: o.id,
    status: o.status,
    email: o.customer.email ?? "",
    name: o.customer.name,
    agent: o.agent ? { name: o.agent.companyName, state: o.agent.state ?? "" } : null,
    product: o.items[0]?.product.name ?? "—",
    qty: o.items.reduce((sum, i) => sum + i.quantity, 0),
    date: o.createdAt.toISOString().split("T")[0],
  }));

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    confirmed: orders.filter(o => o.status === "CONFIRMED").length,
    delivered: orders.filter(o => o.status === "DELIVERED").length,
    cancelled: orders.filter(o => o.status === "CANCELLED").length,
    failed: orders.filter(o => o.status === "FAILED").length,
  };

  return <OrdersClient repId={repId} repName={rep.name} orders={orders} counts={counts} />;
}
