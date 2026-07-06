"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { recordDeliveryFeeEntry } from "@/modules/finance/services/agent-settlement.service";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { sendOrderDeliveredTemplate } from "@/lib/whatsapp/whatsapp";
import {
  getSalesRepAnalyticsForUI,
  getTeamsAnalytics,
  getCompanyAnalytics,
  hardDeleteOrder,
} from "@/modules/data-analysis/services/data-analysis.service";
import type {
  RepAnalyticsData,
  TeamAnalyticsEntry,
  Period,
} from "@/modules/data-analysis/services/data-analysis.service";
import { getSalesRepWeeklyAnalytics } from "@/modules/orders/services/analytics.service";
import type { MonthMetrics } from "@/modules/orders/services/analytics.service";

export async function fetchAnalyticsForMonth(
  salesRepId: string,
  month: number,
  year: number
): Promise<RepAnalyticsData> {
  return getSalesRepAnalyticsForUI(salesRepId, { month, year });
}

export async function fetchTeamsAnalyticsForMonth(
  month: number,
  year: number
): Promise<TeamAnalyticsEntry[]> {
  return getTeamsAnalytics({ month, year, period: "month" });
}

export async function fetchCompanyAnalyticsForMonth(
  month: number,
  year: number
): Promise<RepAnalyticsData> {
  return getCompanyAnalytics({ month, year, period: "month" });
}

export async function fetchTeamsAnalyticsForPeriod(
  period: Period,
  month?: number,
  year?: number
): Promise<TeamAnalyticsEntry[]> {
  return getTeamsAnalytics({ month, year, period });
}

/**
 * Weekly analytics for a specific sales rep — used by the data analyst's
 * per-rep analytics report (weekly PDF) so it reflects that rep, not the viewer.
 */
export async function fetchRepWeeklyAnalytics(
  salesRepId: string
): Promise<MonthMetrics | { error: string }> {
  try {
    return await getSalesRepWeeklyAnalytics(salesRepId);
  } catch {
    return { error: "Failed to generate weekly report" };
  }
}

export async function fetchCompanyAnalyticsForPeriod(
  period: Period,
  month?: number,
  year?: number
): Promise<RepAnalyticsData> {
  return getCompanyAnalytics({ month, year, period });
}

/**
 * Permanently delete an order (hard delete).
 * This action is only available to data analysts.
 */
export async function deleteOrderPermanently(
  orderNumber: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const result = await hardDeleteOrder(orderNumber, session?.user?.id);

  if (result.success) {
    revalidatePath("/data/order");
    revalidatePath("/data");
    revalidatePath("/data/history");
  }

  return result;
}

/**
 * Data analyst marks a confirmed order as delivered — a one-click override
 * (no delivery code required), the same authority the sales rep previously had.
 *
 * On success:
 *  1. Order status → DELIVERED
 *  2. Delivery record status → DELIVERED (deliveredTime stamped)
 *  3. Assigned agent's StockLevel decremented for every item in the order
 *  4. AgentLedgerEntry recorded (idempotent)
 *  5. WhatsApp "delivered" notification sent to the customer (fire-and-forget)
 *
 * The CONFIRMED guard makes this safe alongside the delivery agent's own
 * mark-delivered: whoever marks first wins; the other is rejected.
 */
export async function markOrderDeliveredByAnalyst(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (session.user.role !== "DATA_ANALYST") return { success: false, error: "Forbidden" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: {
      items: { select: { productId: true, quantity: true } },
      customer: { select: { name: true, whatsappNumber: true, phone: true } },
    },
  });
  if (!order) return { success: false, error: "Order not found" };
  if (order.status !== "CONFIRMED") {
    return { success: false, error: "Only confirmed orders can be marked as delivered" };
  }

  const now = new Date();
  const stockDeductions = order.agentId
    ? order.items.map((item) =>
        prisma.stockLevel.updateMany({
          where: {
            productId: item.productId,
            locationKind: "AGENT",
            locationId: order.agentId!,
          },
          data: { quantity: { decrement: item.quantity } },
        }),
      )
    : [];

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "DELIVERED" } }),
    prisma.delivery.updateMany({
      where: { orderId },
      data: { status: "DELIVERED", deliveredTime: now },
    }),
    ...stockDeductions,
  ]);

  if (order.agentId) {
    await recordDeliveryFeeEntry({
      agentId: order.agentId,
      netAmount: Number(order.netAmount),
      orderNumber: order.orderNumber,
      date: order.date,
    });
  }

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
      .catch((err) => console.error("[WhatsApp] markOrderDeliveredByAnalyst send error:", err));
  }

  revalidatePath("/data/order");
  revalidatePath(`/data/order/${order.orderNumber}`);
  revalidatePath("/data");
  return { success: true };
}

/**
 * Data analyst marks a confirmed order as failed, recording the reason — the
 * same authority the sales rep has on their side.
 *
 * On success:
 *  1. Order status → FAILED
 *  2. Delivery record status → FAILED (failureReason stored)
 */
export async function markOrderFailedByAnalyst(
  orderId: string,
  failureReason: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (session.user.role !== "DATA_ANALYST") return { success: false, error: "Forbidden" };

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

  // Log against the order's sales rep so it surfaces in their History page
  await logActivity({
    userId: order.salesRepId,
    action: "Failed",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${order.orderNumber} failed — ${reason}`,
  });

  revalidatePath("/data/order");
  revalidatePath(`/data/order/${order.orderNumber}`);
  revalidatePath("/data");
  return { success: true };
}
