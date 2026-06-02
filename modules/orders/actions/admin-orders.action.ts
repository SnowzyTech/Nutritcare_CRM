"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { recordDeliveryFeeEntry } from "@/modules/finance/services/agent-settlement.service";
import type { OrderStatus } from "@prisma/client";
import { findEligibleAgentForOrder } from "@/modules/delivery/services/agents.service";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { formatCurrency } from "@/lib/utils";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
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

  await logActivity({
    userId: order.salesRepId,
    action: "Order Confirmed",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${order.orderNumber} confirmed`,
  });

  revalidate(orderId);
}

export async function adminCancelOrderAction(orderId: string) {
  await checkAdmin();
  const order = await getOrder(orderId);
  if (!order || (order.status !== "PENDING" && order.status !== "CONFIRMED")) {
    throw new Error("Cannot cancel this order");
  }
  await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  await logActivity({
    userId: order.salesRepId,
    action: "Cancel",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${order.orderNumber} cancelled`,
  });
  revalidate(orderId);
}

export async function adminFailOrderAction(orderId: string) {
  await checkAdmin();
  const order = await getOrder(orderId);
  if (!order || order.status !== "CONFIRMED") throw new Error("Cannot fail this order");
  await prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } });
  await logActivity({
    userId: order.salesRepId,
    action: "Failed",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${order.orderNumber} failed`,
  });
  revalidate(orderId);
}

export async function adminDeliverOrderAction(orderId: string) {
  await checkAdmin();
  const order = await getOrder(orderId);
  if (!order || order.status !== "CONFIRMED") throw new Error("Cannot mark order as delivered");
  await prisma.order.update({ where: { id: orderId }, data: { status: "DELIVERED" } });

  await logActivity({
    userId: order.salesRepId,
    action: "Delivered",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${order.orderNumber} delivered`,
  });

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

/**
 * Admin applies a negotiated discount to an order. Mirrors
 * `applyOrderDiscountAction` (sales rep) but with admin auth, and records the
 * admin as the discounter. See that action for the field semantics.
 */
export async function adminApplyOrderDiscountAction(
  orderId: string,
  negotiatedPrice: number,
  reason?: string,
): Promise<{ discountAmount: number; discountPercent: number; netAmount: number; totalAmount: number }> {
  const session = await checkAdmin();

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: { items: { select: { lineTotal: true } } },
  });
  if (!order) throw new Error("Order not found");
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    throw new Error("Discounts can only be applied to pending or confirmed orders.");
  }

  const gross = Math.round(order.items.reduce((s, i) => s + Number(i.lineTotal), 0) * 100) / 100;

  if (!Number.isFinite(negotiatedPrice) || negotiatedPrice < 0) {
    throw new Error("Enter a valid negotiated price.");
  }
  if (negotiatedPrice > gross) {
    throw new Error("Negotiated price cannot exceed the original total.");
  }

  const discountAmount = Math.round((gross - negotiatedPrice) * 100) / 100;
  const discountPercent = gross > 0 ? Math.round((discountAmount / gross) * 10000) / 100 : 0;
  const hasDiscount = discountAmount > 0;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      totalAmount: gross,
      netAmount: negotiatedPrice,
      discountAmount,
      discountPercent,
      discountedById: hasDiscount ? session.user.id : null,
      discountReason: hasDiscount ? reason?.trim() || null : null,
      discountedAt: hasDiscount ? new Date() : null,
    },
  });

  if (hasDiscount) {
    await logActivity({
      userId: order.salesRepId,
      action: "Discount",
      entityType: "Order",
      entityId: orderId,
      description: `Discount of ${formatCurrency(discountAmount)} (${discountPercent}%) applied to Order #${order.orderNumber}`,
    });
  }

  revalidate(orderId);
  return { discountAmount, discountPercent, netAmount: negotiatedPrice, totalAmount: gross };
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
  const session = await checkAdmin();
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
    return { orderId, productId: item.productId, quantity: item.quantity, unitPrice, lineTotal, costPriceAtSale: Number(product.costPrice), isUpsell: true, addedById: session.user.id };
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

/**
 * Admin counterpart to `removeOrderItemAction` — hard-deletes a product line
 * from a pending order and recomputes totals (preserving the discount amount).
 */
export async function adminRemoveOrderItemAction(orderId: string, itemId: string) {
  await checkAdmin();

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: { items: { select: { id: true, lineTotal: true } } },
  });
  if (!order) throw new Error("Order not found");
  if (order.status !== "PENDING") throw new Error("Products can only be removed from pending orders.");

  if (!order.items.some((i) => i.id === itemId)) throw new Error("Product not found on this order.");
  if (order.items.length <= 1) throw new Error("An order must have at least one product.");

  const remainingGross =
    Math.round(
      order.items.filter((i) => i.id !== itemId).reduce((s, i) => s + Number(i.lineTotal), 0) * 100,
    ) / 100;
  const discountAmount = Math.min(Number(order.discountAmount), remainingGross);
  const netAmount = Math.round((remainingGross - discountAmount) * 100) / 100;
  const discountPercent =
    remainingGross > 0 ? Math.round((discountAmount / remainingGross) * 10000) / 100 : 0;

  await prisma.$transaction([
    prisma.orderItem.delete({ where: { id: itemId } }),
    prisma.order.update({
      where: { id: orderId },
      data: { totalAmount: remainingGross, netAmount, discountAmount, discountPercent },
    }),
  ]);

  revalidate(orderId);
}
