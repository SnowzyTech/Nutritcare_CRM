"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { recordDeliveryFeeEntry } from "@/modules/finance/services/agent-settlement.service";
import { getSalesRepWeeklyAnalytics } from "@/modules/orders/services/analytics.service";
import type { MonthMetrics } from "@/modules/orders/services/analytics.service";
import { findEligibleAgentForOrder } from "@/modules/delivery/services/agents.service";
import {
  sendOrderConfirmationTemplate,
  sendDeliveryCodeTemplate,
  sendOrderDeliveredTemplate,
} from "@/lib/whatsapp/whatsapp";
import { formatCurrency, formatDate } from "@/lib/utils";

/** Generates a cryptographically random 6-digit numeric delivery code. */
function generateDeliveryCode(): string {
  const min = 100_000;
  const max = 999_999;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

/**
 * Deducts order items from the assigned agent's StockLevel rows inside a
 * transaction. Safe to call even if a StockLevel row doesn't exist yet
 * (updateMany with 0 matches is a no-op).
 */
function buildStockDeductionOps(
  items: { productId: string; quantity: number }[],
  agentId: string,
) {
  return items.map((item) =>
    prisma.stockLevel.updateMany({
      where: {
        productId: item.productId,
        locationKind: "AGENT",
        locationId: agentId,
      },
      data: { quantity: { decrement: item.quantity } },
    }),
  );
}

export async function getWeeklyAnalyticsAction(): Promise<MonthMetrics | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  try {
    return await getSalesRepWeeklyAnalytics(session.user.id);
  } catch {
    return { error: "Failed to generate weekly report" };
  }
}

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
      return prisma.order.updateMany({
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
  return prisma.order.findFirst({
    where: { id: orderId, salesRepId, deletedAt: null },
  });
}

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/sales-rep/orders");
  revalidatePath(`/sales-rep/orders/${orderId}`);
}

export async function confirmOrderAction(
  orderId: string,
  notes?: string,
  deliveryDate?: string,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!deliveryDate) throw new Error("Please select a delivery date before confirming.");

  const order = await prisma.order.findFirst({
    where: { id: orderId, salesRepId: session.user.id, deletedAt: null },
    include: {
      customer: {
        select: {
          state: true,
          name: true,
          whatsappNumber: true,
          phone: true,
          deliveryAddress: true,
        },
      },
      items: {
        select: {
          productId: true,
          quantity: true,
          product: { select: { name: true } },
        },
      },
    },
  });
  if (!order || order.status !== "PENDING") throw new Error("Cannot confirm this order");

  const agentId = await findEligibleAgentForOrder(order.customer.state, order.items);

  if (!agentId) {
    throw new Error(
      "No delivery agent is currently available in this area with the required stock. Please try again later or contact your manager.",
    );
  }

  const deliveryCode = generateDeliveryCode();

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        agentId,
        ...(notes !== undefined && { notes: notes || null }),
      },
    }),
    prisma.delivery.create({
      data: {
        orderId,
        agentId,
        scheduledTime: new Date(deliveryDate),
        status: "PENDING_DISPATCH",
        deliveryCode,
      },
    }),
  ]);

  // Send WhatsApp confirmation to customer (fire-and-forget — never throws)
  const waPhone = order.customer.whatsappNumber || order.customer.phone;
  console.log("[WhatsApp] ── confirmOrder: starting WhatsApp step ──");
  console.log("[WhatsApp] orderId:", orderId);
  console.log("[WhatsApp] customer.whatsappNumber:", order.customer.whatsappNumber);
  console.log("[WhatsApp] customer.phone:", order.customer.phone);
  console.log("[WhatsApp] resolved waPhone:", waPhone);

  if (waPhone) {
    // Message 1: order confirmation (no delivery code)
    sendOrderConfirmationTemplate({
      to: waPhone,
      customerName: order.customer.name,
      orderNumber: order.orderNumber,
      deliveryAddress: order.customer.deliveryAddress,
      deliveryDate: formatDate(new Date(deliveryDate)),
      items: order.items.map((i) => ({ name: i.product.name, quantity: i.quantity })),
      productDetails: notes || "-",
      totalAmount: formatCurrency(Number(order.netAmount)),
    })
      .then((result) => {
        console.log("[WhatsApp] order confirmation result:", JSON.stringify(result));
        // Message 2: delivery verification code (sent after confirmation)
        return sendDeliveryCodeTemplate({ to: waPhone, deliveryCode });
      })
      .then((result) => console.log("[WhatsApp] delivery code result:", JSON.stringify(result)))
      .catch((err) => console.error("[WhatsApp] confirmOrder send error:", err));
  } else {
    console.warn("[WhatsApp] no phone available — skipping send");
  }

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

  // Fetch with items (stock deduction) and customer (WhatsApp notification)
  const order = await prisma.order.findFirst({
    where: { id: orderId, salesRepId: session.user.id, deletedAt: null },
    include: {
      items: { select: { productId: true, quantity: true } },
      customer: { select: { name: true, whatsappNumber: true, phone: true } },
    },
  });
  if (!order || order.status !== "CONFIRMED") throw new Error("Cannot mark order as delivered");

  const now = new Date();
  const stockOps = order.agentId
    ? buildStockDeductionOps(order.items, order.agentId)
    : [];

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "DELIVERED" } }),
    prisma.delivery.updateMany({
      where: { orderId },
      data: { status: "DELIVERED", deliveredTime: now },
    }),
    ...stockOps,
  ]);

  if (order.agentId) {
    await recordDeliveryFeeEntry({
      agentId: order.agentId,
      netAmount: Number(order.netAmount),
      orderNumber: order.orderNumber,
      date: order.date,
    });
  }

  // Send WhatsApp delivery notification (fire-and-forget — never throws)
  const waPhone = order.customer.whatsappNumber || order.customer.phone;
  if (waPhone) {
    sendOrderDeliveredTemplate({
      to: waPhone,
      customerName: order.customer.name,
      orderNumber: order.orderNumber,
    })
      .then((result) => console.log("[WhatsApp] delivery notification result:", JSON.stringify(result)))
      .catch((err) => console.error("[WhatsApp] deliverOrder send error:", err));
  }

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

export async function createOrderAction(input: {
  customerName: string;
  phone: string;
  whatsappNumber: string;
  email?: string;
  deliveryAddress: string;
  state: string;
  landmark?: string;
  products: Array<{ productId: string; quantity: number }>;
}): Promise<{ orderId: string; orderNumber: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const { customerName, phone, whatsappNumber, email, deliveryAddress, state, landmark, products } = input;

  if (!products.length) return { error: "At least one product is required." };

  const cleanPhone = phone.replace(/\s+/g, "");

  let customer = await prisma.customer.findFirst({ where: { phone: cleanPhone } });
  if (customer) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: customerName.trim(),
        whatsappNumber: whatsappNumber?.trim() || null,
        email: email?.trim() || null,
        deliveryAddress: deliveryAddress.trim(),
        state: state.trim(),
        landmark: landmark?.trim() || null,
      },
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        name: customerName.trim(),
        phone: cleanPhone,
        whatsappNumber: whatsappNumber?.trim() || null,
        email: email?.trim() || null,
        deliveryAddress: deliveryAddress.trim(),
        state: state.trim(),
        lga: "",
        landmark: landmark?.trim() || null,
      },
    });
  }

  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;

  const dbProducts = await prisma.product.findMany({
    where: { id: { in: products.map((p) => p.productId) }, deletedAt: null },
    select: { id: true, sellingPrice: true, costPrice: true },
  });
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  for (const item of products) {
    if (!productMap.has(item.productId)) {
      return { error: "One or more selected products are unavailable." };
    }
  }

  const orderItemsData = products.map((item) => {
    const product = productMap.get(item.productId)!;
    const unitPrice = Number(product.sellingPrice);
    const lineTotal = unitPrice * item.quantity;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      costPriceAtSale: Number(product.costPrice),
    };
  });

  const totalAmount = orderItemsData.reduce((sum, i) => sum + i.lineTotal, 0);

  try {
    const order = await prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          salesRepId: session.user.id,
          totalAmount,
          netAmount: totalAmount,
          status: "PENDING",
          items: { create: orderItemsData },
        },
      });
    });

    revalidatePath("/sales-rep/orders");
    return { orderId: order.id, orderNumber: order.orderNumber };
  } catch (err) {
    console.error("[createOrderAction] Error:", err);
    return { error: "Failed to create order. Please try again." };
  }
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
    select: { id: true, name: true, sellingPrice: true, costPrice: true },
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

  revalidatePath(`/sales-rep/orders/${orderId}`);
}
