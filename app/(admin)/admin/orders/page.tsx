import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getAdminOrders } from "@/modules/orders/services/orders.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { AdminOrdersClient } from "./orders-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "All Orders" };

export default async function AllOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [rawOrders, rawProducts] = await Promise.all([
    getAdminOrders(),
    getActiveProducts(),
  ]);

  const orders = rawOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
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
    salesRep: { name: o.salesRep.name },
  }));

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
    failed: orders.filter((o) => o.status === "FAILED").length,
  };

  const products = rawProducts.map((p) => ({ id: p.id, name: p.name }));

  return <AdminOrdersClient orders={orders} counts={counts} products={products} />;
}
