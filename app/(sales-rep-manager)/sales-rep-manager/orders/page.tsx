import { getTeamOrders } from "@/modules/orders/services/orders.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { TeamOrdersClient, type TeamOrderListItem } from "./team-orders-client";
import { resolveManagerScope } from "../_lib/manager-scope";

export const dynamic = "force-dynamic";

export default async function TeamOrdersPage() {
  const { reps } = await resolveManagerScope();
  const memberIds = reps.map(m => m.id);

  const [dbOrders, allProducts] = await Promise.all([
    getTeamOrders(memberIds),
    getActiveProducts(),
  ]);
  const products = allProducts.map(p => p.name);

  const orders: TeamOrderListItem[] = dbOrders.map(o => ({
    id: o.id,
    status: o.status,
    email: o.customer.email ?? "",
    name: o.customer.name,
    agent: o.agent ? { name: o.agent.companyName, state: o.agent.state ?? "" } : null,
    salesRep: o.salesRep?.name ?? "—",
    teamId: o.salesRep?.team?.id ?? null,
    teamName: o.salesRep?.team?.name ?? null,
    product: o.items[0]?.product.name ?? "—",
    qty: o.items.reduce((sum, i) => sum + i.quantity, 0),
    isReorder: o.isReorder,
    itemNames: o.items.map(i => i.product.name),
    date: o.createdAt.toISOString().split("T")[0],
    statusDate: o.updatedAt.toISOString().split("T")[0],
  }));

  // Distinct teams present in these orders — drives the (company-manager) team filter.
  const teams = Array.from(
    new Map(
      orders
        .filter(o => o.teamId && o.teamName)
        .map(o => [o.teamId as string, { id: o.teamId as string, name: o.teamName as string }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    confirmed: orders.filter(o => o.status === "CONFIRMED").length,
    delivered: orders.filter(o => o.status === "DELIVERED").length,
    cancelled: orders.filter(o => o.status === "CANCELLED").length,
    failed: orders.filter(o => o.status === "FAILED").length,
  };

  return <TeamOrdersClient orders={orders} counts={counts} products={products} teams={teams} />;
}
