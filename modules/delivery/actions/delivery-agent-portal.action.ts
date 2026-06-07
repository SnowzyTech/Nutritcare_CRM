"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import bcryptjs from "bcryptjs";
import { getAgentIdByUserId } from "@/modules/delivery/services/delivery-agent-portal.service";
import { recordDeliveryFeeEntry } from "@/modules/finance/services/agent-settlement.service";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { sendOrderDeliveredTemplate } from "@/lib/whatsapp/whatsapp";

export async function updateAgentProfileAction(data: {
  name: string;
  phone: string;
  whatsappNumber: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const name = data.name.trim();
  if (!name || name.length < 2) return { error: "Name must be at least 2 characters" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone: data.phone.trim() || null,
      whatsappNumber: data.whatsappNumber.trim() || null,
    },
  });

  revalidatePath("/delivery-agents/profile");
  return { success: true };
}

export async function changePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!data.newPassword || data.newPassword.length < 8)
    return { error: "New password must be at least 8 characters" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user) return { error: "User not found" };

  const valid = await bcryptjs.compare(data.currentPassword, user.password);
  if (!valid) return { error: "Current password is incorrect" };

  const hashed = await bcryptjs.hash(data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  return { success: true };
}

/**
 * Agent marks an order as delivered after the customer provides the 6-digit
 * delivery code that was sent to them via WhatsApp on order confirmation.
 *
 * On success:
 *  1. Order status → DELIVERED
 *  2. Delivery record status → DELIVERED (deliveredTime stamped)
 *  3. Agent's StockLevel decremented for every item in the order
 *  4. AgentLedgerEntry created (agent collected cash, owes company)
 */
export async function markOrderDeliveredAction(orderId: string, deliveryCode: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const agentId = await getAgentIdByUserId(session.user.id);
  if (!agentId) return { error: "Agent not found" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, agentId, deletedAt: null },
    include: {
      items: { select: { productId: true, quantity: true } },
      customer: { select: { name: true, whatsappNumber: true, phone: true } },
    },
  });
  if (!order) return { error: "Order not found" };
  if (order.status !== "CONFIRMED") return { error: "Only confirmed orders can be marked as delivered" };

  // ── Verify delivery code ──────────────────────────────────────────────────
  const delivery = await prisma.delivery.findFirst({
    where: { orderId, agentId },
    select: { id: true, deliveryCode: true },
  });
  if (!delivery) return { error: "Delivery record not found" };

  const codeMatches =
    delivery.deliveryCode && delivery.deliveryCode === deliveryCode.trim();
  if (!codeMatches) {
    return { error: "Incorrect delivery code. Please ask the customer to check the WhatsApp message sent at time of order confirmation." };
  }

  // ── Commit all changes in one transaction ─────────────────────────────────
  const now = new Date();

  const stockDeductions = order.items.map((item) =>
    prisma.stockLevel.updateMany({
      where: {
        productId: item.productId,
        locationKind: "AGENT",
        locationId: agentId,
      },
      data: { quantity: { decrement: item.quantity } },
    }),
  );

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "DELIVERED" } }),
    prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: "DELIVERED", deliveredTime: now },
    }),
    ...stockDeductions,
  ]);

  // Record ledger entry (idempotent)
  await recordDeliveryFeeEntry({
    agentId,
    netAmount: Number(order.netAmount),
    orderNumber: order.orderNumber,
    date: order.date,
  });

  // Log against the order's sales rep so it surfaces in their History page
  await logActivity({
    userId: order.salesRepId,
    action: "Delivered",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${order.orderNumber} delivered`,
  });

  // Send WhatsApp delivery notification (fire-and-forget — never throws)
  const waPhone = order.customer.whatsappNumber || order.customer.phone;
  if (waPhone) {
    sendOrderDeliveredTemplate({
      to: waPhone,
      customerName: order.customer.name,
      orderNumber: order.orderNumber,
    })
      .then((result) => console.log("[WhatsApp] delivery notification result:", JSON.stringify(result)))
      .catch((err) => console.error("[WhatsApp] markOrderDelivered send error:", err));
  }

  revalidatePath("/delivery-agents");
  revalidatePath(`/delivery-agents/${orderId}`);
  return { success: true };
}

export async function markOrderFailedAction(orderId: string, failureReason: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const agentId = await getAgentIdByUserId(session.user.id);
  if (!agentId) return { error: "Agent not found" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, agentId, deletedAt: null },
  });
  if (!order) return { error: "Order not found" };

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } }),
    prisma.delivery.updateMany({
      where: { orderId, agentId },
      data: { status: "FAILED", failureReason },
    }),
  ]);

  // Log against the order's sales rep so it surfaces in their History page
  await logActivity({
    userId: order.salesRepId,
    action: "Failed",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${order.orderNumber} failed`,
  });

  revalidatePath("/delivery-agents");
  revalidatePath(`/delivery-agents/${orderId}`);
  return { success: true };
}

export async function updateDeliveryFeeAction(orderId: string, fee: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const agentId = await getAgentIdByUserId(session.user.id);
  if (!agentId) return { error: "Agent not found" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, agentId, deletedAt: null },
  });
  if (!order) return { error: "Order not found" };

  await prisma.order.update({
    where: { id: orderId },
    data: { deliveryFee: fee },
  });

  revalidatePath(`/delivery-agents/${orderId}`);
  return { success: true };
}

export async function rescheduleOrderAction(orderId: string, scheduledDate: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const agentId = await getAgentIdByUserId(session.user.id);
  if (!agentId) return { error: "Agent not found" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, agentId, deletedAt: null },
  });
  if (!order) return { error: "Order not found" };

  await prisma.delivery.updateMany({
    where: { orderId, agentId },
    data: { scheduledTime: new Date(scheduledDate) },
  });

  revalidatePath("/delivery-agents");
  revalidatePath(`/delivery-agents/${orderId}`);
  return { success: true };
}
