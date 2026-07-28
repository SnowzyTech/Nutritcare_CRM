import { getTeamOrders } from "@/modules/orders/services/orders.service";
import { upsellExtraCount } from "@/lib/orders/upsell";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { OrderAssignmentClient } from "./order-assignment-client";
import type { TeamOrderListItem } from "../orders/team-orders-client";
import { resolveManagerScope } from "../_lib/manager-scope";

export const dynamic = "force-dynamic";

export default async function OrderAssignmentPage() {
  const { reps: members } = await resolveManagerScope();
  const memberIds = members.map(m => m.id);

  const [dbOrders, allProducts] = await Promise.all([
    getTeamOrders(memberIds),
    getActiveProducts(),
  ]);
  const products = allProducts.map(p => p.name);

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
    isReorder: o.isReorder,
    itemNames: o.items.map(i => i.product.name),
    extraCount: upsellExtraCount(o.items),
    date: o.createdAt.toISOString().split("T")[0],
    statusDate: o.updatedAt.toISOString().split("T")[0],
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

  return <OrderAssignmentClient orders={orders} counts={counts} salesReps={salesReps} products={products} />;
}
