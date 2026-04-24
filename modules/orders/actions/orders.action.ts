"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";

async function getOwnedOrder(orderId: string, salesRepId: string) {
  return prisma.order.findUnique({
    where: { id: orderId, salesRepId, deletedAt: null },
  });
}

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/sales-rep/orders");
  revalidatePath(`/sales-rep/orders/${orderId}`);
}

export async function confirmOrderAction(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await getOwnedOrder(orderId, session.user.id);
  if (!order || order.status !== "PENDING") throw new Error("Cannot confirm this order");

  await prisma.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });
  revalidateOrderPaths(orderId);
}

export async function cancelOrderAction(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await getOwnedOrder(orderId, session.user.id);
  if (!order || (order.status !== "PENDING" && order.status !== "CONFIRMED")) {
    throw new Error("Cannot cancel this order");
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  revalidateOrderPaths(orderId);
}

export async function failOrderAction(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await getOwnedOrder(orderId, session.user.id);
  if (!order || order.status !== "CONFIRMED") throw new Error("Cannot fail this order");

  await prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } });
  revalidateOrderPaths(orderId);
}

export async function deliverOrderAction(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await getOwnedOrder(orderId, session.user.id);
  if (!order || order.status !== "CONFIRMED") throw new Error("Cannot mark order as delivered");

  await prisma.order.update({ where: { id: orderId }, data: { status: "DELIVERED" } });
  revalidateOrderPaths(orderId);
}

export async function addOrderItemsAction(
  orderId: string,
  items: Array<{ productId: string; quantity: number }>
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await getOwnedOrder(orderId, session.user.id);
  if (!order || order.status !== "PENDING") throw new Error("Cannot modify this order");

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, name: true, sellingPrice: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  let addedTotal = 0;

  const itemsToCreate = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    const unitPrice = Number(product.sellingPrice);
    const lineTotal = unitPrice * item.quantity;
    addedTotal += lineTotal;
    return { orderId, productId: item.productId, quantity: item.quantity, unitPrice, lineTotal };
  });

  await prisma.$transaction([
    prisma.orderItem.createMany({ data: itemsToCreate }),
    prisma.order.update({
      where: { id: orderId },
      data: { totalAmount: { increment: addedTotal }, netAmount: { increment: addedTotal } },
    }),
  ]);

  revalidatePath(`/sales-rep/orders/${orderId}`);
}
