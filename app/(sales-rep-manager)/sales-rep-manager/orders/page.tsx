import { auth } from "@/lib/auth/auth";
import { getManagerWithTeam, getTeamMembersWithStats } from "@/modules/users/services/users.service";
import { getTeamOrders } from "@/modules/orders/services/orders.service";
import { TeamOrdersClient, type TeamOrderListItem } from "./team-orders-client";

export const dynamic = "force-dynamic";

export default async function TeamOrdersPage() {
  const session = await auth();
  const managerId = session?.user?.id;

  const manager = managerId ? await getManagerWithTeam(managerId) : null;
  const teamId = manager?.teamId;
  const members = teamId ? await getTeamMembersWithStats(teamId) : [];
  const memberIds = members.map(m => m.id);

  const dbOrders = await getTeamOrders(memberIds);

  const orders: TeamOrderListItem[] = dbOrders.map(o => ({
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

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    confirmed: orders.filter(o => o.status === "CONFIRMED").length,
    delivered: orders.filter(o => o.status === "DELIVERED").length,
    cancelled: orders.filter(o => o.status === "CANCELLED").length,
    failed: orders.filter(o => o.status === "FAILED").length,
  };

  return <TeamOrdersClient orders={orders} counts={counts} />;
}
