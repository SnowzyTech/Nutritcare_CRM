"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import {
  deliverOrder,
  deliveryRefusalMessage,
} from "@/modules/orders/services/deliver-order.service";
import { resolveDeliveredDate } from "@/lib/orders/delivered-date";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { recordWhatsAppResult } from "@/modules/audit/services/whatsapp-audit.service";
import { suppressCameraForRequest } from "@/lib/audit/context";
import { sendOrderDeliveredTemplate } from "@/lib/whatsapp/whatsapp";
import { reassignAgentForOrder } from "@/modules/orders/services/reassign-agent.service";

/**
 * Company Sales Manager marks a confirmed order as delivered — a one-click
 * override (no delivery code required), mirroring the data analyst's authority.
 *
 * On success:
 *  1. Order status → DELIVERED
 *  2. Delivery record status → DELIVERED (deliveredTime stamped)
 *  3. Assigned agent's StockLevel decremented for every item in the order
 *  4. AgentLedgerEntry recorded (idempotent)
 *
 * Steps 1-4 are one transaction inside `deliverOrder`, which REFUSES the whole
 * thing if the agent's recorded stock won't cover the order (an agent can be
 * over-booked on purpose) rather than letting the balance go negative.
 *  5. WhatsApp "delivered" notification sent to the customer (fire-and-forget)
 *
 * The CONFIRMED guard makes this safe alongside the delivery agent's and
 * analyst's own mark-delivered: whoever marks first wins; the rest are rejected.
 * The flip itself is a guarded updateMany, so a double-submit cannot double-debit.
 */
export async function markOrderDeliveredByManager(
  orderId: string,
  deliveredDate?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (session.user.role !== "SALES_REP_MANAGER") return { success: false, error: "Forbidden" };
  suppressCameraForRequest();

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: {
      customer: { select: { name: true, whatsappNumber: true, phone: true } },
      deliveries: { select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  if (!order) return { success: false, error: "Order not found" };
  if (order.status !== "CONFIRMED") {
    return { success: false, error: "Only confirmed orders can be marked as delivered" };
  }

  const confirmedAt = order.deliveries[0]?.createdAt ?? order.createdAt;
  const resolved = resolveDeliveredDate(deliveredDate, confirmedAt);
  if ("error" in resolved) return { success: false, error: resolved.error };
  const deliveredAt = resolved.deliveredAt;

  // Status flip, agent stock debit (refused rather than overdrawn) and the agent
  // ledger entry all live in the shared service - see deliver-order.service.ts.
  const delivered = await deliverOrder({ orderId, deliveredAt });
  if (!delivered.ok) {
    return { success: false, error: deliveryRefusalMessage(delivered, "office") };
  }

  // Log against the order's sales rep for their History page; show the manager as actor.
  await logActivity({
    userId: order.salesRepId,
    actorName: session.user.name,
    actorRole: session.user.role,
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
      prescription: order.notes ?? "-",
    })
      .then((result) =>
        recordWhatsAppResult({
          userId: session.user.id,
          orderId,
          orderNumber: order.orderNumber,
          channel: "delivered",
          result,
        }),
      )
      .catch((err) => console.error("[WhatsApp] markOrderDeliveredByManager send error:", err));
  }

  revalidatePath("/sales-manager/orders");
  revalidatePath(`/sales-manager/orders/${orderId}`);
  revalidatePath("/sales-manager");
  return { success: true };
}

/**
 * Company Sales Manager reassigns an order to a different delivery agent — the
 * same authority admins have. Works on CONFIRMED or FAILED orders; a FAILED order
 * is revived to CONFIRMED. The target agent must be holding enough stock.
 */
export async function reassignOrderAgentByManager(
  orderId: string,
  agentId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (session.user.role !== "SALES_REP_MANAGER") return { success: false, error: "Forbidden" };
  suppressCameraForRequest();

  const result = await reassignAgentForOrder(orderId, agentId, { verifyStock: true });
  if (!result.ok) {
    return {
      success: false,
      error:
        result.reason === "no_stock"
          ? "The selected agent isn't holding enough stock to take this order. Please choose another agent."
          : "This order can no longer be reassigned.",
    };
  }

  // Log against the order's sales rep for their History page; show the manager as actor.
  await logActivity({
    userId: result.order.salesRepId,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: "Reassigned",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${result.order.orderNumber} reassigned to a different delivery agent`,
  });

  revalidatePath("/sales-manager/orders");
  revalidatePath(`/sales-manager/orders/${orderId}`);
  revalidatePath("/sales-manager");
  return { success: true };
}

/**
 * Company Sales Manager marks a confirmed order as failed, recording the reason
 * — mirroring the data analyst's authority.
 *
 * On success:
 *  1. Order status → FAILED
 *  2. Delivery record status → FAILED (failureReason stored)
 */
export async function markOrderFailedByManager(
  orderId: string,
  failureReason: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (session.user.role !== "SALES_REP_MANAGER") return { success: false, error: "Forbidden" };
  suppressCameraForRequest();

  const reason = failureReason.trim();
  if (!reason) return { success: false, error: "A failure reason is required" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: { id: true, status: true, orderNumber: true, salesRepId: true },
  });
  if (!order) return { success: false, error: "Order not found" };
  if (order.status !== "CONFIRMED") {
    return { success: false, error: "Only confirmed orders can be marked as failed" };
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } }),
    prisma.delivery.updateMany({
      where: { orderId },
      data: { status: "FAILED", failureReason: reason },
    }),
  ]);

  // Log against the order's sales rep for their History page; show the manager as actor.
  await logActivity({
    userId: order.salesRepId,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: "Failed",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${order.orderNumber} failed — ${reason}`,
  });

  revalidatePath("/sales-manager/orders");
  revalidatePath(`/sales-manager/orders/${orderId}`);
  revalidatePath("/sales-manager");
  return { success: true };
}
