import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getSalesRepOrders } from "@/modules/orders/services/orders.service";
import { OrdersClient } from "./orders-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rawOrders = await getSalesRepOrders(session.user.id);

  // Serialize Dates before passing to client component
  const orders = rawOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    customer: { name: o.customer.name, email: o.customer.email ?? null },
    agent: o.agent
      ? { companyName: o.agent.companyName, state: o.agent.state ?? null }
      : null,
    items: o.items.map((item) => ({
      quantity: item.quantity,
      product: { name: item.product.name },
    })),
  }));

  // Derive per-status counts from the single fetch (no extra DB round-trip per tab)
  const counts = {
    all: orders.length,
    pending:   orders.filter((o) => o.status === "PENDING").length,
    confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
    failed:    orders.filter((o) => o.status === "FAILED").length,
  };

  return (
    <OrdersClient
      orders={orders}
      counts={counts}
      userName={session.user.name ?? ""}
    />
  );
}
