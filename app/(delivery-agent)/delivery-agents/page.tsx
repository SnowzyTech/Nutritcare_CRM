import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import {
  getAgentIdByUserId,
  getAgentOrders,
  getAgentOrderStatusCounts,
} from "@/modules/delivery/services/delivery-agent-portal.service";
import { OrdersClient } from "./orders-client";

export default async function DeliveryAgentOrders() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const agentId = await getAgentIdByUserId(session.user.id);
  if (!agentId) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center text-gray-400">
        <p className="text-lg font-bold">No agent profile found for your account.</p>
        <p className="text-sm mt-2">Please contact your administrator.</p>
      </div>
    );
  }

  const [orders, counts] = await Promise.all([
    getAgentOrders(agentId),
    getAgentOrderStatusCounts(agentId),
  ]);

  const statusCounts = {
    pending: (counts.PENDING ?? 0) + (counts.CONFIRMED ?? 0),
    delivered: counts.DELIVERED ?? 0,
    failed: (counts.FAILED ?? 0) + (counts.CANCELLED ?? 0),
  };

  return (
    <OrdersClient
      orders={orders}
      statusCounts={statusCounts}
      user={session.user}
    />
  );
}
