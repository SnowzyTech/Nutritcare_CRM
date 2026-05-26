"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { recordDeliveryFeeEntry } from "@/modules/finance/services/agent-settlement.service";
import type { OrderStatus } from "@prisma/client";
import { findEligibleAgentForOrder } from "@/modules/delivery/services/agents.service";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

async function getOrder(orderId: string) {
  return prisma.order.findFirst({ where: { id: orderId, deletedAt: null } });
}

function revalidate(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function adminConfirmOrderAction(orderId: string, deliveryDate?: string) {
  await checkAdmin();

  if (!deliveryDate) throw new Error("Please select a delivery date before confirming.");

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: {
      customer: { select: { state: true } },
      items: { select: { productId: true, quantity: true } },
    },
  });
  if (!order || order.status !== "PENDING") throw new Error("Cannot confirm this order");

  const agentId = await findEligibleAgentForOrder(order.customer.state, order.items);

  if (!agentId) {
    throw new Error(
      "No delivery agent is currently available in this area with the required stock. Please try again later.",
    );
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED", agentId },
    }),
    prisma.delivery.create({
      data: {
        orderId,
        agentId,
        scheduledTime: new Date(deliveryDate),
        status: "PENDING_DISPATCH",
      },
    }),
  ]);

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

  if (order.agentId) {
    await recordDeliveryFeeEntry({
      agentId: order.agentId,
      netAmount: Number(order.netAmount),
      orderNumber: order.orderNumber,
      date: order.date,
    });
  }

  revalidate(orderId);
}

export async function adminUpdateOrderTotalAction(orderId: string, totalAmount: number) {
  await checkAdmin();
  const order = await getOrder(orderId);
  if (!order || order.status !== "PENDING") throw new Error("Cannot update total for this order");

  await prisma.order.update({
    where: { id: orderId },
    data: { totalAmount, netAmount: totalAmount },
  });
  revalidate(orderId);
}

// Distribute orderIds equally (round-robin) among salesRepIds and update salesRepId.
export async function adminReassignOrdersAction(
  orderIds: string[],
  salesRepIds: string[]
) {
  await checkAdmin();
  if (!orderIds.length) throw new Error("No orders selected");
  if (!salesRepIds.length) throw new Error("No sales reps selected");

  const updates = orderIds.map((orderId, i) =>
    prisma.order.updateMany({
      where: { id: orderId, status: { in: ["PENDING", "CONFIRMED"] as OrderStatus[] }, deletedAt: null },
      data: { salesRepId: salesRepIds[i % salesRepIds.length] },
    })
  );

  await prisma.$transaction(updates);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/order-assignment");
  revalidatePath("/sales-rep/orders");
}

export async function adminReassignOrderAgentAction(orderId: string, agentId: string) {
  await checkAdmin();
  const order = await getOrder(orderId);
  if (!order || (order.status !== "CONFIRMED" && order.status !== "FAILED")) {
    throw new Error("Cannot reassign agent for this order");
  }
  await prisma.order.update({
    where: { id: orderId },
    data: { agentId, ...(order.status === "FAILED" ? { status: "CONFIRMED" } : {}) },
  });
  revalidate(orderId);
}

export async function adminUpdateOrderNotesAction(orderId: string, notes: string) {
  await checkAdmin();
  const order = await getOrder(orderId);
  if (!order || order.status === "DELIVERED" || order.status === "CANCELLED") {
    throw new Error("Cannot update notes for this order");
  }
  await prisma.order.update({ where: { id: orderId }, data: { notes: notes.trim() || null } });
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
    select: { id: true, sellingPrice: true, costPrice: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  let addedTotal = 0;

  const itemsToCreate = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    const unitPrice = Number(product.sellingPrice);
    const lineTotal = unitPrice * item.quantity;
    addedTotal += lineTotal;
    return { orderId, productId: item.productId, quantity: item.quantity, unitPrice, lineTotal, costPriceAtSale: Number(product.costPrice) };
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
