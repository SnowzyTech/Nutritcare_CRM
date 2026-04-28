import { OrdersClient } from "../_components/OrdersClient";
import { getAllOrders } from "@/modules/data-analysis/services/data-analysis.service";

export default async function OrderPage() {
  const orders = await getAllOrders();
  return <OrdersClient initialOrders={orders} />;
}
