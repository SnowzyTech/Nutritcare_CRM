import { getLogisticsDeliveries } from "@/modules/delivery/services/logistics-orders.service";
import { LogisticsDeliveriesClient } from "./deliveries-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Deliveries" };

export default async function DeliveriesPage() {
  const deliveries = await getLogisticsDeliveries();
  return <LogisticsDeliveriesClient deliveries={deliveries} />;
}
