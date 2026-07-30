import { OrderDetailClient } from "../../../../_components/OrderDetailClient";
import { getOrderByOrderNumber } from "@/modules/data-analysis/services/data-analysis.service";
import { getAgentsForReassignment } from "@/modules/delivery/services/agents.service";
import { isUserTeamLead } from "@/modules/users/services/users.service";
import { auth } from "@/lib/auth/auth";
import { notFound } from "next/navigation";

export default async function SalesRepOrderDetailPage({ params }: { params: Promise<{ id: string; orderId: string }> }) {
  const { orderId } = await params;

  const session = await auth();
  const [order, rawAgents, isTeamLead] = await Promise.all([
    getOrderByOrderNumber(orderId),
    getAgentsForReassignment(),
    session?.user?.id ? isUserTeamLead(session.user.id) : Promise.resolve(false),
  ]);

  if (!order) {
    notFound();
  }

  // Only the Data Analyst team lead may reassign the delivery agent (mirrors
  // their mark-delivered/failed authority).
  const canReassign = session?.user?.role === "DATA_ANALYST" && isTeamLead;

  const agents = rawAgents.map((a) => ({
    id: a.id,
    companyName: a.companyName,
    state: a.state ?? null,
    phone: a.phone1,
    activeOrders: a._count.orders,
    totalDeliveries: a._count.deliveries,
  }));

  return <OrderDetailClient order={order} canReassign={canReassign} agents={agents} />;
}
