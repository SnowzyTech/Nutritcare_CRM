import { OrdersClient } from "../_components/OrdersClient";
import { getAllOrders, getDeliveryAgents, getSalesRepsForFilter, getSalesTeams, getProductsForFilter } from "@/modules/data-analysis/services/data-analysis.service";

export default async function OrderPage() {
  const [orders, deliveryAgents, salesReps, teams, products] = await Promise.all([
    getAllOrders(),
    getDeliveryAgents(),
    getSalesRepsForFilter(),
    getSalesTeams(),
    getProductsForFilter(),
  ]);

  return <OrdersClient initialOrders={orders} deliveryAgents={deliveryAgents} salesReps={salesReps} teams={teams} products={products} />;
}
