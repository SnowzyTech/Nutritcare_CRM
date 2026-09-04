"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { recordDeliveryFeeEntry } from "@/modules/finance/services/agent-settlement.service";
import { resolveDeliveredDate } from "@/lib/orders/delivered-date";
import type { OrderStatus } from "@prisma/client";
import {
  findEligibleAgentForOrder,
  agentHasAvailableStock,
  lockAgent,
} from "@/modules/delivery/services/agents.service";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { recordWhatsAppResult } from "@/modules/audit/services/whatsapp-audit.service";
import {
  sendOrderConfirmationTemplate,
  sendDeliveryCodeTemplate,
} from "@/lib/whatsapp/whatsapp";
import { formatCurrency, formatDate } from "@/lib/utils";
import { isAdmin } from "@/lib/auth/role-routes";
import { suppressCameraForRequest } from "@/lib/audit/context";
import { describeReassignment } from "@/modules/orders/services/reassign-description.service";
import {
  applyUpsellItems,
  previewUpsellPrice,
  upsellOrderSelect,
} from "@/modules/orders/services/upsell-apply.service";

// Returned (not thrown) so the message survives production builds, where Next.js
// strips messages from thrown server-action errors.
type ActionResult = { success: true } | { error: string };

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
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

/** Generates a random 6-digit numeric delivery code (mirrors the sales-rep confirm). */
function generateDeliveryCode(): string {
  const min = 100_000;
  const max = 999_999;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

export async function adminConfirmOrderAction(orderId: string, deliveryDate?: string): Promise<ActionResult> {
  await checkAdmin();
  suppressCameraForRequest();

  if (!deliveryDate) return { error: "Please select a delivery date before confirming." };

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
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
  if (!order || order.status !== "PENDING") return { error: "Cannot confirm this order" };

  const agentId = await findEligibleAgentForOrder(order.customer.state, order.items);

  if (!agentId) {
    return {
      error:
        "No delivery agent is currently available in this area with the required stock. Please try again later.",
    };
  }

  const deliveryCode = generateDeliveryCode();

  // Assign under a per-agent lock and re-verify availability inside it, so two
  // orders confirmed at the same instant can't both grab the same agent's stock.
  let capacityHit = false;
  await prisma.$transaction(async (tx) => {
    await lockAgent(tx, agentId);
    const ok = await agentHasAvailableStock(tx, agentId, order.items);
    if (!ok) {
      capacityHit = true;
      return; // leave the order untouched
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED", agentId },
    });
    await tx.delivery.create({
      data: {
        orderId,
        agentId,
        scheduledTime: new Date(deliveryDate),
        status: "PENDING_DISPATCH",
        deliveryCode,
      },
    });
  });

  if (capacityHit) {
    return {
      error:
        "The selected delivery agent just reached capacity for one or more items. Please try again — another agent will be chosen.",
    };
  }

  await logActivity({
    userId: order.salesRepId,
    action: "Order Confirmed",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${order.orderNumber} confirmed`,
  });

  // Send WhatsApp confirmation + delivery code to customer (fire-and-forget — never throws)
  const waPhone = order.customer.whatsappNumber || order.customer.phone;
  if (waPhone) {
    // Message 1: order confirmation (no delivery code)
    sendOrderConfirmationTemplate({
      to: waPhone,
      customerName: order.customer.name,
      orderNumber: order.orderNumber,
      deliveryAddress: order.customer.deliveryAddress,
      deliveryDate: formatDate(new Date(deliveryDate)),
      items: order.items.map((i) => ({ name: i.product.name, quantity: i.quantity })),
      totalAmount: formatCurrency(Number(order.netAmount)),
    })
      .then((result) => {
        recordWhatsAppResult({
          userId: order.salesRepId,
          orderId,
          orderNumber: order.orderNumber,
          channel: "confirmation",
          result,
        });
        // Message 2: delivery verification code (sent after confirmation)
        return sendDeliveryCodeTemplate({ to: waPhone, deliveryCode });
      })
      .then((result) =>
        recordWhatsAppResult({
          userId: order.salesRepId,
          orderId,
          orderNumber: order.orderNumber,
          channel: "delivery code",
          result,
        }),
      )
      .catch((err) => console.error("[WhatsApp] adminConfirmOrder send error:", err));
  }

  revalidate(orderId);
  return { success: true };
}

export async function adminCancelOrderAction(orderId: string): Promise<ActionResult> {
  await checkAdmin();
  suppressCameraForRequest();
  const order = await getOrder(orderId);
  if (!order || (order.status !== "PENDING" && order.status !== "CONFIRMED")) {
    return { error: "Cannot cancel this order" };
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
  return { success: true };
}

export async function adminFailOrderAction(orderId: string): Promise<ActionResult> {
  await checkAdmin();
  suppressCameraForRequest();
  const order = await getOrder(orderId);
  if (!order || order.status !== "CONFIRMED") return { error: "Cannot fail this order" };
  await prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } });
  await logActivity({
    userId: order.salesRepId,
    action: "Failed",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${order.orderNumber} failed`,
  });
  revalidate(orderId);
  return { success: true };
}

export async function adminReviveOrderAction(orderId: string): Promise<ActionResult> {
  await checkAdmin();
  suppressCameraForRequest();
  const order = await getOrder(orderId);
  if (!order || (order.status !== "CANCELLED" && order.status !== "FAILED")) {
    return { error: "Only cancelled or failed orders can be revived" };
  }
  if (order.status === "FAILED") {
    // Keep original agent + delivery; back to CONFIRMED so it can be delivered again.
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } }),
      prisma.delivery.updateMany({
        where: { orderId },
        data: { status: "PENDING_DISPATCH", failureReason: null },
      }),
    ]);
  } else {
    // Cancelled → fresh pending order.
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: "PENDING", cancellationReason: null, agentId: null },
      }),
      prisma.delivery.deleteMany({ where: { orderId } }),
    ]);
  }
  await logActivity({
    userId: order.salesRepId,
    action: "Revived",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${order.orderNumber} revived`,
  });
  revalidate(orderId);
  return { success: true };
}

export async function adminDeliverOrderAction(
  orderId: string,
  deliveredDate?: string,
): Promise<ActionResult> {
  await checkAdmin();
  suppressCameraForRequest();
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: {
      items: { select: { productId: true, quantity: true } },
      deliveries: { select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  if (!order || order.status !== "CONFIRMED") return { error: "Cannot mark order as delivered" };

  const confirmedAt = order.deliveries[0]?.createdAt ?? order.createdAt;
  const resolved = resolveDeliveredDate(deliveredDate, confirmedAt);
  if ("error" in resolved) return { error: resolved.error };
  const deliveredAt = resolved.deliveredAt;
  // Deduct the delivered units from the agent's on-hand stock, mirroring the
  // delivery-agent/sales-manager/data-analyst paths — otherwise the goods stay
  // on the agent's StockLevel as phantom stock after delivery.
  const stockDeductions = order.agentId
    ? order.items.map((item) =>
        prisma.stockLevel.updateMany({
          where: { productId: item.productId, locationKind: "AGENT", locationId: order.agentId! },
          data: { quantity: { decrement: item.quantity } },
        }),
      )
    : [];

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "DELIVERED" } }),
    prisma.delivery.updateMany({
      where: { orderId },
      data: { status: "DELIVERED", deliveredTime: deliveredAt },
    }),
    ...stockDeductions,
  ]);

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
      // Date the funding on the chosen delivery day so the ledger matches the data view.
      date: deliveredAt,
    });
  }

  revalidate(orderId);
  return { success: true };
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
  suppressCameraForRequest();

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
  const session = await checkAdmin();
  suppressCameraForRequest();
  if (!orderIds.length) throw new Error("No orders selected");
  if (!salesRepIds.length) throw new Error("No sales reps selected");

  const updates = orderIds.map((orderId, i) =>
    prisma.order.updateMany({
      where: { id: orderId, status: { in: ["PENDING", "CONFIRMED"] as OrderStatus[] }, deletedAt: null },
      data: { salesRepId: salesRepIds[i % salesRepIds.length] },
    })
  );

  await prisma.$transaction(updates);
  await logActivity({
    userId: session.user.id,
    action: "Reassigned",
    entityType: "Order",
    entityId: orderIds[0] ?? "bulk",
    description: await describeReassignment(orderIds, salesRepIds),
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/order-assignment");
  revalidatePath("/sales-rep/orders");
}

export async function adminReassignOrderAgentAction(orderId: string, agentId: string): Promise<ActionResult> {
  const session = await checkAdmin();
  suppressCameraForRequest();
  const order = await getOrder(orderId);
  if (!order || (order.status !== "CONFIRMED" && order.status !== "FAILED")) {
    return { error: "Cannot reassign agent for this order" };
  }
  await prisma.order.update({
    where: { id: orderId },
    data: { agentId, ...(order.status === "FAILED" ? { status: "CONFIRMED" } : {}) },
  });
  await logActivity({
    userId: session.user.id, action: "Reassigned", entityType: "Order", entityId: orderId,
    description: `Order #${order.orderNumber} reassigned to a different delivery agent`,
  });
  revalidate(orderId);
  return { success: true };
}

export async function adminUpdateOrderNotesAction(orderId: string, notes: string): Promise<ActionResult> {
  const session = await checkAdmin();
  suppressCameraForRequest();
  const order = await getOrder(orderId);
  if (!order || order.status === "DELIVERED" || order.status === "CANCELLED") {
    return { error: "Cannot update notes for this order" };
  }
  await prisma.order.update({ where: { id: orderId }, data: { notes: notes.trim() || null } });
  await logActivity({
    userId: session.user.id, action: "Updated", entityType: "Order", entityId: orderId,
    description: `Updated notes on Order #${order.orderNumber}`,
  });
  revalidate(orderId);
  return { success: true };
}

export async function adminAddOrderItemsAction(
  orderId: string,
  // `unitPrice` is the price-of-one typed in the popup — only used (and required)
  // when the merged quantity has no exact package. Shared with the rep flow.
  items: Array<{ productId: string; quantity: number; unitPrice?: number }>
): Promise<ActionResult> {
  const session = await checkAdmin();
  suppressCameraForRequest();

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: upsellOrderSelect,
  });
  if (!order) return { error: "Order not found" };

  // Same merge + package-pricing + tracking core as the rep flow (PENDING +
  // CONFIRMED, incl. the agent stock-capacity check on CONFIRMED).
  const result = await applyUpsellItems(order, items, session.user.id);
  if ("error" in result) return { error: result.error };

  await logActivity({
    userId: session.user.id,
    action: "Updated",
    entityType: "Order",
    entityId: orderId,
    description: `Added ${result.addedCount} product line${result.addedCount === 1 ? "" : "s"} to Order #${order.orderNumber}`,
  });

  // Audit trail for every manually-priced (surplus) line.
  for (const s of result.surplusPlans) {
    await logActivity({
      userId: session.user.id,
      action: "Updated",
      entityType: "OrderItem",
      entityId: orderId,
      description: `Manual unit price ${formatCurrency(
        s.typedUnitPrice,
      )} used for ${s.productName} (qty ${s.mergedQty}) on Order #${order.orderNumber}`,
      details: {
        field: "unitPrice",
        amount: s.lineTotal,
        productId: s.productId,
        mergedQty: s.mergedQty,
        typedUnitPrice: s.typedUnitPrice,
      },
    });
  }

  revalidate(orderId);
  return { success: true };
}

/**
 * Live price preview for the admin Add-Product popup (admin counterpart to
 * `resolveUpsellPriceAction`). Read-only; writes nothing.
 */
export async function adminResolveUpsellPriceAction(
  orderId: string,
  productId: string,
  addedQty: number,
  typedUnitPrice?: number
): Promise<
  | {
      lineTotal: number;
      unitPrice: number;
      source: "package" | "surplus";
      requiresUnitPrice: boolean;
      mergedQty: number;
    }
  | { error: string }
> {
  await checkAdmin();
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: {
      formId: true,
      items: { where: { productId }, select: { quantity: true } },
    },
  });
  if (!order) return { error: "Order not found." };

  return previewUpsellPrice(
    order.formId,
    order.items,
    productId,
    addedQty,
    typedUnitPrice ?? 0,
  );
}

/**
 * Admin counterpart to `removeOrderItemAction` — hard-deletes a product line
 * from a pending order and recomputes totals (preserving the discount amount).
 */
export async function adminRemoveOrderItemAction(orderId: string, itemId: string): Promise<ActionResult> {
  const session = await checkAdmin();
  suppressCameraForRequest();

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: { items: { select: { id: true, lineTotal: true } } },
  });
  if (!order) return { error: "Order not found" };
  if (order.status !== "PENDING") return { error: "Products can only be removed from pending orders." };

  if (!order.items.some((i) => i.id === itemId)) return { error: "Product not found on this order." };
  if (order.items.length <= 1) return { error: "An order must have at least one product." };

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

  await logActivity({
    userId: session.user.id, action: "Updated", entityType: "Order", entityId: orderId,
    description: `Removed a product line from Order #${order.orderNumber}`,
  });

  revalidate(orderId);
  return { success: true };
}
