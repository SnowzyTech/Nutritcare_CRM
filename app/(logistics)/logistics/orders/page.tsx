import { getLogisticsOrders, getLogisticsOrderStatusCounts } from "@/modules/delivery/services/logistics-orders.service";
import { LogisticsOrdersClient } from "./orders-client";

export const metadata = { title: "Orders" };

export default async function LogisticsOrdersPage() {
  const [rawOrders, statusCounts] = await Promise.all([
    getLogisticsOrders(),
    getLogisticsOrderStatusCounts(),
  ]);

  const orders = rawOrders.map((o) => ({
    id: o.id,
    status: o.status,
    date: o.date.toISOString(),
    customer: { name: o.customer.name, email: o.customer.email },
    agent: o.agent ? { companyName: o.agent.companyName, state: o.agent.state } : null,
    items: o.items.map((i) => ({ quantity: i.quantity, product: { name: i.product.name } })),
  }));

  return <LogisticsOrdersClient orders={orders} statusCounts={statusCounts} />;
}
