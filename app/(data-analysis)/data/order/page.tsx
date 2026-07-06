import { OrdersClient } from "../_components/OrdersClient";
import { getAllOrders, getDeliveryAgents, getSalesRepsForFilter, getSalesTeams, getProductsForFilter } from "@/modules/data-analysis/services/data-analysis.service";
import { auth } from "@/lib/auth/auth";

export default async function OrderPage() {
  const [session, orders, deliveryAgents, salesReps, teams, products] = await Promise.all([
    auth(),
    getAllOrders(),
    getDeliveryAgents(),
    getSalesRepsForFilter(),
    getSalesTeams(),
    getProductsForFilter(),
  ]);

  return <OrdersClient initialOrders={orders} deliveryAgents={deliveryAgents} salesReps={salesReps} teams={teams} products={products} userName={session?.user?.name ?? null} />;
}
