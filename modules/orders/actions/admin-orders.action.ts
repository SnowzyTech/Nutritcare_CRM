"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

async function getOrder(orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId, deletedAt: null } });
}

function revalidate(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function adminConfirmOrderAction(orderId: string) {
  await checkAdmin();
  const order = await getOrder(orderId);
  if (!order || order.status !== "PENDING") throw new Error("Cannot confirm this order");
  await prisma.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });
  revalidate(orderId);
}

export async function adminCancelOrderAction(orderId: string) {
  await checkAdmin();
  const order = await getOrder(orderId);
  if (!order || (order.status !== "PENDING" && order.status !== "CONFIRMED")) {
    throw new Error("Cannot cancel this order");
  }
  await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  revalidate(orderId);
}

export async function adminFailOrderAction(orderId: string) {
  await checkAdmin();
  const order = await getOrder(orderId);
  if (!order || order.status !== "CONFIRMED") throw new Error("Cannot fail this order");
  await prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } });
  revalidate(orderId);
}

export async function adminDeliverOrderAction(orderId: string) {
  await checkAdmin();
  const order = await getOrder(orderId);
  if (!order || order.status !== "CONFIRMED") throw new Error("Cannot mark order as delivered");
  await prisma.order.update({ where: { id: orderId }, data: { status: "DELIVERED" } });
  revalidate(orderId);
}

export async function adminAddOrderItemsAction(
  orderId: string,
  items: Array<{ productId: string; quantity: number }>
) {
  await checkAdmin();
  const order = await getOrder(orderId);
  if (!order || order.status !== "PENDING") throw new Error("Cannot modify this order");

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, sellingPrice: true },
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

  revalidatePath(`/admin/orders/${orderId}`);
}
