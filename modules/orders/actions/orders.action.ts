"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";

export async function reassignOrdersAction(
  orderIds: string[],
  repIds: string[]
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (orderIds.length === 0 || repIds.length === 0) return { error: "No orders or reps selected" };

  await prisma.$transaction(
    orderIds.map((orderId, idx) => {
      const repId = repIds[idx % repIds.length];
      return prisma.order.update({
        where: { id: orderId, deletedAt: null },
        data: { salesRepId: repId },
      });
    })
  );

  revalidatePath("/sales-rep-manager");
  revalidatePath("/sales-rep-manager/orders");
  revalidatePath("/sales-rep-manager/order-assignment");
  return {};
}

async function getOwnedOrder(orderId: string, salesRepId: string) {
  return prisma.order.findUnique({
    where: { id: orderId, salesRepId, deletedAt: null },
  });
}

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/sales-rep/orders");
  revalidatePath(`/sales-rep/orders/${orderId}`);
}

export async function confirmOrderAction(orderId: string, notes?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await getOwnedOrder(orderId, session.user.id);
  if (!order || order.status !== "PENDING") throw new Error("Cannot confirm this order");

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CONFIRMED", ...(notes !== undefined && { notes: notes || null }) },
  });
  revalidateOrderPaths(orderId);
}

export async function updateOrderNotesAction(orderId: string, notes: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await getOwnedOrder(orderId, session.user.id);
  if (!order || order.status !== "CONFIRMED") throw new Error("Cannot update notes for this order");

  await prisma.order.update({ where: { id: orderId }, data: { notes: notes || null } });
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

export async function updateOrderTotalAction(orderId: string, totalAmount: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await getOwnedOrder(orderId, session.user.id);
  if (!order || order.status !== "PENDING") throw new Error("Cannot update total for this order");

  await prisma.order.update({
    where: { id: orderId },
    data: { totalAmount, netAmount: totalAmount },
  });
  revalidateOrderPaths(orderId);
}

export async function reassignOrderAgentAction(orderId: string, agentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await getOwnedOrder(orderId, session.user.id);
  if (!order || (order.status !== "CONFIRMED" && order.status !== "FAILED")) {
    throw new Error("Cannot reassign agent for this order");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { agentId, ...(order.status === "FAILED" ? { status: "CONFIRMED" } : {}) },
  });
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
