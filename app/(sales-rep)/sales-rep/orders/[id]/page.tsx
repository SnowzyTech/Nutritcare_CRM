import { auth } from "@/lib/auth/auth";
import { notFound, redirect } from "next/navigation";
import { getOrderWithDetails } from "@/modules/orders/services/orders.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { OrderDetailClient } from "./order-detail-client";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id}` };
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [rawOrder, rawProducts] = await Promise.all([
    getOrderWithDetails(id),
    getActiveProducts(),
  ]);

  if (!rawOrder) notFound();

  // Only the owning sales rep can view this order
  if (rawOrder.salesRepId !== session.user.id && session.user.role !== "ADMIN") {
    notFound();
  }

  // Serialize all non-plain values before passing to the client component
  const order = {
    id: rawOrder.id,
    orderNumber: rawOrder.orderNumber,
    status: rawOrder.status,
    totalAmount: rawOrder.totalAmount.toString(),
    netAmount: rawOrder.netAmount.toString(),
    deliveryFee: rawOrder.deliveryFee.toString(),
    notes: rawOrder.notes ?? null,
    createdAt: rawOrder.createdAt.toISOString(),
    customer: {
      name: rawOrder.customer.name,
      phone: rawOrder.customer.phone,
      whatsappNumber: rawOrder.customer.whatsappNumber ?? null,
      email: rawOrder.customer.email ?? null,
      deliveryAddress: rawOrder.customer.deliveryAddress,
      state: rawOrder.customer.state,
      lga: rawOrder.customer.lga,
      landmark: rawOrder.customer.landmark ?? null,
      source: rawOrder.customer.source ?? null,
    },
    agent: rawOrder.agent
      ? {
          id: rawOrder.agent.id,
          companyName: rawOrder.agent.companyName,
          state: rawOrder.agent.state ?? null,
        }
      : null,
    items: rawOrder.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString(),
      product: { id: item.product.id, name: item.product.name },
    })),
    salesRep: {
      id: rawOrder.salesRep.id,
      name: rawOrder.salesRep.name,
    },
    deliveries: rawOrder.deliveries.map((d) => ({
      scheduledTime: d.scheduledTime?.toISOString() ?? null,
      deliveredTime: d.deliveredTime?.toISOString() ?? null,
      status: d.status,
    })),
  };

  const products = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    sellingPrice: p.sellingPrice.toString(),
    sku: p.sku,
  }));

  return <OrderDetailClient order={order} products={products} />;
}
