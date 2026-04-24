import { auth } from "@/lib/auth/auth";
import { getManagerWithTeam, getTeamMembersWithStats } from "@/modules/users/services/users.service";
import { getTeamOrders } from "@/modules/orders/services/orders.service";
import { OrderAssignmentClient } from "./order-assignment-client";
import type { TeamOrderListItem } from "../orders/team-orders-client";

export const dynamic = "force-dynamic";

export default async function OrderAssignmentPage() {
  const session = await auth();
  const managerId = session?.user?.id;

  const manager = managerId ? await getManagerWithTeam(managerId) : null;
  const teamId = manager?.teamId;
  const members = teamId ? await getTeamMembersWithStats(teamId) : [];
  const memberIds = members.map(m => m.id);

  const dbOrders = await getTeamOrders(memberIds);

  // Only PENDING and CONFIRMED orders can be reassigned
  const assignableDbOrders = dbOrders.filter(
    o => o.status === "PENDING" || o.status === "CONFIRMED"
  );

  const orders: TeamOrderListItem[] = assignableDbOrders.map(o => ({
    id: o.id,
    status: o.status,
    email: o.customer.email ?? "",
    name: o.customer.name,
    agent: o.agent ? { name: o.agent.companyName, state: o.agent.state ?? "" } : null,
    salesRep: o.salesRep?.name ?? "—",
    product: o.items[0]?.product.name ?? "—",
    qty: o.items.reduce((sum, i) => sum + i.quantity, 0),
    date: o.createdAt.toISOString().split("T")[0],
  }));

  const salesReps = members.map(m => ({
    id: m.id,
    name: m.name,
    pendingOrders: m.pendingOrders,
    phone: m.phone ?? undefined,
    performance: m.performance,
    avatar: m.avatarUrl ?? undefined,
  }));

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    confirmed: orders.filter(o => o.status === "CONFIRMED").length,
    delivered: 0,
    cancelled: 0,
    failed: 0,
  };

  return <OrderAssignmentClient orders={orders} counts={counts} salesReps={salesReps} />;
}
