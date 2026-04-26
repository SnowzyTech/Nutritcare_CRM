import { getLogisticsOrders, getLogisticsOrderStatusCounts } from "@/modules/delivery/services/logistics-orders.service";
import { LogisticsOrdersClient } from "./orders-client";

export const metadata = { title: "Orders" };

export default async function LogisticsOrdersPage() {
  const [orders, statusCounts] = await Promise.all([
    getLogisticsOrders(),
    getLogisticsOrderStatusCounts(),
  ]);

  return <LogisticsOrdersClient orders={orders} statusCounts={statusCounts} />;
}
