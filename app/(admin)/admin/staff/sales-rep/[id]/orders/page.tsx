import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSalesRepById } from "@/modules/users/services/users.service";
import { getOrdersBySalesRep } from "@/modules/orders/services/orders.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { AdminOrdersClient } from "../../../../orders/orders-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const rep = await getSalesRepById(id);
  return { title: rep ? `${rep.name} — Orders` : "Orders" };
}

export default async function SalesRepOrdersPage({ params }: Props) {
  const { id } = await params;
  const [rep, rawOrders, rawProducts] = await Promise.all([
    getSalesRepById(id),
    getOrdersBySalesRep(id),
    getActiveProducts(),
  ]);

  if (!rep) notFound();

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

  return (
    <div className="max-w-[1400px] mx-auto">
      <Link
        href={`/admin/staff/sales-rep/${id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 mb-6 transition-colors group no-underline"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">Back to Profile</span>
      </Link>

      <div className="flex justify-between items-baseline mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{rep.name}&apos;s Orders</h1>
        <span className="text-base text-gray-400">Sales Representatives</span>
      </div>

      <AdminOrdersClient orders={orders} counts={counts} products={products} />
    </div>
  );
}
