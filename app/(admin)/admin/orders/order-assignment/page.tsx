import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getAssignableOrders } from "@/modules/orders/services/orders.service";
import { getActiveSalesRepsWithOrderCounts } from "@/modules/users/services/users.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { OrderAssignmentClient } from "./order-assignment-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Assignment" };

export default async function OrderAssignmentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [rawOrders, rawReps, rawProducts] = await Promise.all([
    getAssignableOrders(),
    getActiveSalesRepsWithOrderCounts(),
    getActiveProducts(),
  ]);

  const orders = rawOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status as "PENDING" | "CONFIRMED",
    createdAt: o.createdAt.toISOString(),
    customer: {
      name: o.customer.name,
      email: o.customer.email ?? null,
      state: o.customer.state,
    },
    agent: o.agent
      ? { companyName: o.agent.companyName, state: o.agent.state ?? null }
      : null,
    items: o.items.map((item) => ({
      quantity: item.quantity,
      product: { name: item.product.name },
    })),
    salesRep: { id: o.salesRep.id, name: o.salesRep.name },
  }));

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
  };

  const salesReps = rawReps.map((r) => ({
    id: r.id,
    name: r.name,
    avatarUrl: r.avatarUrl ?? null,
    activeOrderCount: r._count.orders,
  }));

  const products = rawProducts.map((p) => ({ id: p.id, name: p.name }));

  return (
    <OrderAssignmentClient
      orders={orders}
      counts={counts}
      salesReps={salesReps}
      products={products}
    />
  );
}
