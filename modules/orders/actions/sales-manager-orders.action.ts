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
import { formatCurrency } from "@/lib/utils";
import {
  applyUpsellItems,
  previewUpsellPrice,
  upsellOrderSelect,
} from "@/modules/orders/services/upsell-apply.service";
import {
  changeItemQuantity,
  swapItemProduct,
  previewLineReprice,
  reviseOrderSelect,
} from "@/modules/orders/services/revise-order.service";
import { applyOrderNegotiatedPrice } from "@/modules/orders/services/apply-discount.service";

type PreviewResult =
  | {
      lineTotal: number;
      unitPrice: number;
      source: "package" | "surplus";
      requiresUnitPrice: boolean;
      mergedQty: number;
    }
  | { error: string };

/** Revalidate every place a company sales manager sees this order. */
function revalidateManagerOrder(orderId: string, salesRepId: string) {
  revalidatePath("/sales-manager/orders");
  revalidatePath(`/sales-manager/orders/${orderId}`);
  revalidatePath(`/sales-manager/${salesRepId}/orders/${orderId}`);
  revalidatePath("/sales-manager");
}
import {
  notifyAgentReassigned,
  notifyRepDeliveryOutcome,
} from "@/modules/notifications/services/order-events.service";

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
  notifyRepDeliveryOutcome(orderId, { kind: "delivered" }, { id: session.user.id, name: session.user.name });

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
  if (result.order.previousAgentId !== agentId) {
    notifyAgentReassigned(orderId, result.order.previousAgentId, {
      id: session.user.id,
      name: session.user.name,
    });
  }

  revalidatePath("/sales-manager/orders");
  revalidatePath(`/sales-manager/orders/${orderId}`);
  revalidatePath("/sales-manager");
  return { success: true };
}

// ── Order editing (on behalf of the rep) ─────────────────────────────────────
// All logged under the order's sales rep with the manager shown as actor, same
// on-behalf-of convention as mark-delivered above. Money math is the shared
// services; these only add auth + logging + revalidation.

async function requireManager() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
  if (session.user.role !== "SALES_REP_MANAGER") return { ok: false as const, error: "Forbidden" };
  return { ok: true as const, session };
}

/** Add product(s) to an order — recorded as an upsell (rep add-on). */
export async function addOrderItemsByManager(
  orderId: string,
  items: Array<{ productId: string; quantity: number; unitPrice?: number }>,
): Promise<{ error?: string }> {
  const gate = await requireManager();
  if (!gate.ok) return { error: gate.error };
  const { session } = gate;
  suppressCameraForRequest();

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: { ...upsellOrderSelect, salesRepId: true },
  });
  if (!order) return { error: "Order not found." };

  const result = await applyUpsellItems(order, items, session.user.id);
  if ("error" in result) return { error: result.error };

  await logActivity({
    userId: order.salesRepId,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: "Updated",
    entityType: "Order",
    entityId: orderId,
    description: `Added ${result.addedCount} product line${result.addedCount === 1 ? "" : "s"} to Order #${order.orderNumber}`,
  });
  for (const s of result.surplusPlans) {
    await logActivity({
      userId: order.salesRepId,
      actorName: session.user.name,
      actorRole: session.user.role,
      action: "Updated",
      entityType: "OrderItem",
      entityId: orderId,
      description: `Manual unit price ${formatCurrency(s.typedUnitPrice)} used for ${s.productName} (qty ${s.mergedQty}) on Order #${order.orderNumber}`,
      details: { field: "unitPrice", amount: s.lineTotal, productId: s.productId, typedUnitPrice: s.typedUnitPrice },
    });
  }

  revalidateManagerOrder(orderId, order.salesRepId);
  return {};
}

/** Live price preview for the manager Add-Product popup (merge-aware). */
export async function resolveUpsellPriceForManager(
  orderId: string,
  productId: string,
  addedQty: number,
  typedUnitPrice?: number,
): Promise<PreviewResult> {
  const gate = await requireManager();
  if (!gate.ok) return { error: gate.error };

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: { formId: true, items: { where: { productId }, select: { quantity: true } } },
  });
  if (!order) return { error: "Order not found." };
  return previewUpsellPrice(order.formId, order.items, productId, addedQty, typedUnitPrice ?? 0);
}

/** Change a line's quantity and re-price it — a customer revision (not upsell). */
export async function changeOrderItemQuantityByManager(
  orderId: string,
  orderItemId: string,
  newQuantity: number,
  unitPrice?: number,
): Promise<{ error?: string }> {
  const gate = await requireManager();
  if (!gate.ok) return { error: gate.error };
  const { session } = gate;
  suppressCameraForRequest();

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: { ...reviseOrderSelect, salesRepId: true },
  });
  if (!order) return { error: "Order not found." };

  const result = await changeItemQuantity(order, orderItemId, newQuantity, unitPrice ?? 0);
  if ("error" in result) return { error: result.error };

  await logActivity({
    userId: order.salesRepId,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: "Updated",
    entityType: "Order",
    entityId: orderId,
    description: `Changed ${result.productName} quantity ${result.oldQuantity} → ${result.newQuantity} on Order #${order.orderNumber}`,
    details: { field: "quantity", before: result.oldQuantity, after: result.newQuantity, amount: result.newLineTotal },
  });
  if (result.surplus) {
    await logActivity({
      userId: order.salesRepId,
      actorName: session.user.name,
      actorRole: session.user.role,
      action: "Updated",
      entityType: "OrderItem",
      entityId: orderId,
      description: `Manual unit price ${formatCurrency(result.surplus.typedUnitPrice)} used for ${result.surplus.productName} (qty ${result.surplus.quantity}) on Order #${order.orderNumber}`,
      details: { field: "unitPrice", amount: result.surplus.lineTotal, productId: result.surplus.productId, typedUnitPrice: result.surplus.typedUnitPrice },
    });
  }

  revalidateManagerOrder(orderId, order.salesRepId);
  return {};
}

/** Replace a line's product with a different one — a customer revision (not upsell). */
export async function swapOrderItemProductByManager(
  orderId: string,
  orderItemId: string,
  newProductId: string,
  newQuantity: number,
  unitPrice?: number,
): Promise<{ error?: string }> {
  const gate = await requireManager();
  if (!gate.ok) return { error: gate.error };
  const { session } = gate;
  suppressCameraForRequest();

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: { ...reviseOrderSelect, salesRepId: true },
  });
  if (!order) return { error: "Order not found." };

  const result = await swapItemProduct(order, orderItemId, newProductId, newQuantity, unitPrice ?? 0, session.user.id);
  if ("error" in result) return { error: result.error };

  await logActivity({
    userId: order.salesRepId,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: "Updated",
    entityType: "Order",
    entityId: orderId,
    description: `Swapped ${result.oldProductName} → ${result.newProductName} (qty ${result.newQuantity}) on Order #${order.orderNumber}`,
    details: { field: "product", before: result.oldProductName, after: result.newProductName, amount: result.newLineTotal },
  });
  if (result.surplus) {
    await logActivity({
      userId: order.salesRepId,
      actorName: session.user.name,
      actorRole: session.user.role,
      action: "Updated",
      entityType: "OrderItem",
      entityId: orderId,
      description: `Manual unit price ${formatCurrency(result.surplus.typedUnitPrice)} used for ${result.surplus.productName} (qty ${result.surplus.quantity}) on Order #${order.orderNumber}`,
      details: { field: "unitPrice", amount: result.surplus.lineTotal, productId: result.surplus.productId, typedUnitPrice: result.surplus.typedUnitPrice },
    });
  }

  revalidateManagerOrder(orderId, order.salesRepId);
  return {};
}

/** Live price preview for the manager Edit-line popup (absolute quantity). */
export async function resolveLineRepriceForManager(
  orderId: string,
  productId: string,
  absoluteQty: number,
  typedUnitPrice?: number,
): Promise<PreviewResult> {
  const gate = await requireManager();
  if (!gate.ok) return { error: gate.error };

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: { formId: true },
  });
  if (!order) return { error: "Order not found." };
  return previewLineReprice(order.formId, productId, absoluteQty, typedUnitPrice ?? 0);
}

/** Apply a negotiated (discounted) price — the price-change-at-delivery case. */
export async function applyOrderDiscountByManager(
  orderId: string,
  negotiatedPrice: number,
  reason?: string,
): Promise<{ error?: string; discountAmount?: number; discountPercent?: number; netAmount?: number; totalAmount?: number }> {
  const gate = await requireManager();
  if (!gate.ok) return { error: gate.error };
  const { session } = gate;
  suppressCameraForRequest();

  const result = await applyOrderNegotiatedPrice(orderId, negotiatedPrice, reason, session.user.id);
  if ("error" in result) return { error: result.error };

  if (result.hasDiscount) {
    await logActivity({
      userId: result.salesRepId,
      actorName: session.user.name,
      actorRole: session.user.role,
      action: "Discount",
      entityType: "Order",
      entityId: orderId,
      description: `Discount of ${formatCurrency(result.discountAmount)} (${result.discountPercent}%) applied to Order #${result.orderNumber}`,
      details: { before: formatCurrency(result.gross), after: formatCurrency(result.negotiatedPrice), field: "price", amount: result.discountAmount },
    });
  }

  revalidateManagerOrder(orderId, result.salesRepId);
  return {
    discountAmount: result.discountAmount,
    discountPercent: result.discountPercent,
    netAmount: result.negotiatedPrice,
    totalAmount: result.gross,
  };
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
  notifyRepDeliveryOutcome(orderId, { kind: "failed", reason }, { id: session.user.id, name: session.user.name });

  revalidatePath("/sales-manager/orders");
  revalidatePath(`/sales-manager/orders/${orderId}`);
  revalidatePath("/sales-manager");
  return { success: true };
}
