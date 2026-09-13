"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import {
  deliverOrder,
  deliveryRefusalMessage,
} from "@/modules/orders/services/deliver-order.service";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { recordWhatsAppResult } from "@/modules/audit/services/whatsapp-audit.service";
import { suppressCameraForRequest } from "@/lib/audit/context";
import { sendOrderDeliveredTemplate } from "@/lib/whatsapp/whatsapp";
import {
  getSalesRepAnalyticsForUI,
  getTeamsAnalytics,
  getCompanyAnalytics,
  hardDeleteOrder,
} from "@/modules/data-analysis/services/data-analysis.service";
import { isUserTeamLead } from "@/modules/users/services/users.service";
import {
  createManualOrder,
  logManualOrderCreated,
  manualOrderSchema,
} from "@/modules/orders/services/manual-order.service";
import { reassignAgentForOrder } from "@/modules/orders/services/reassign-agent.service";
import { resolveDeliveredDate } from "@/lib/orders/delivered-date";
import type {
  RepAnalyticsData,
  TeamAnalyticsEntry,
  Period,
} from "@/modules/data-analysis/services/data-analysis.service";
import { getSalesRepWeeklyAnalytics } from "@/modules/orders/services/analytics.service";
import type { MonthMetrics } from "@/modules/orders/services/analytics.service";
import { z } from "zod";

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
  suppressCameraForRequest();

  // Only the roles allowed into the data module (route-protected to DATA_ANALYST +
  // SUPER_ADMIN) may permanently delete an order. Closes the gap where any signed-in
  // role — or an unauthenticated direct call — could reach this action.
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "DATA_ANALYST" && role !== "SUPER_ADMIN")) {
    return { success: false, error: "You are not authorized to delete orders." };
  }

  const result = await hardDeleteOrder(orderNumber, session.user.id);

  if (result.success) {
    if (session?.user?.id) {
      await logActivity({
        userId: session.user.id,
        actorName: session.user.name,
        actorRole: session.user.role,
        action: "Deleted",
        entityType: "Order",
        entityId: orderNumber,
        description: `Permanently deleted order #${orderNumber}`,
      });
    }
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
 *
 * Steps 1-4 are one transaction inside `deliverOrder`, which REFUSES the whole
 * thing if the agent's recorded stock won't cover the order (an agent can be
 * over-booked on purpose) rather than letting the balance go negative.
 *  5. WhatsApp "delivered" notification sent to the customer (fire-and-forget)
 *
 * The CONFIRMED guard makes this safe alongside the delivery agent's own
 * mark-delivered: whoever marks first wins; the other is rejected.
 * The flip itself is a guarded updateMany, so a double-submit cannot double-debit.
 */
export async function markOrderDeliveredByAnalyst(
  orderId: string,
  // Optional actual delivery date (yyyy-mm-dd) the analyst picks on the calendar.
  // Omitted → today. Used for BOTH Delivery.deliveredTime and the agent ledger date
  // so data and accounting stay in lockstep.
  deliveredDate?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (session.user.role !== "DATA_ANALYST") return { success: false, error: "Forbidden" };
  if (!(await isUserTeamLead(session.user.id))) {
    return { success: false, error: "Only the Data Analyst team lead can finalize orders" };
  }
  suppressCameraForRequest();

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: {
      customer: { select: { name: true, whatsappNumber: true, phone: true } },
      // Earliest delivery row = created at confirmation; its date is the lower bound.
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

  // Log against the order's sales rep for their History page; show the analyst as actor.
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
  if (!(await isUserTeamLead(session.user.id))) {
    return { success: false, error: "Only the Data Analyst team lead can finalize orders" };
  }
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

  // Log against the order's sales rep for their History page; show the analyst as actor.
  await logActivity({
    userId: order.salesRepId,
    actorName: session.user.name,
    actorRole: session.user.role,
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

/**
 * Data analyst (team lead only) reassigns an order to a different delivery agent
 * — the same authority admins have. Works on CONFIRMED or FAILED orders; a FAILED
 * order is revived to CONFIRMED. The target agent must be holding enough stock.
 */
export async function reassignOrderAgentByAnalyst(
  orderId: string,
  agentId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (session.user.role !== "DATA_ANALYST") return { success: false, error: "Forbidden" };
  if (!(await isUserTeamLead(session.user.id))) {
    return { success: false, error: "Only the Data Analyst team lead can reassign orders" };
  }
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

  // Log against the order's sales rep for their History page; show the analyst as actor.
  await logActivity({
    userId: result.order.salesRepId,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: "Reassigned",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${result.order.orderNumber} reassigned to a different delivery agent`,
  });

  revalidatePath("/data/order");
  revalidatePath(`/data/order/${result.order.orderNumber}`);
  revalidatePath("/data");
  return { success: true };
}

/**
 * The analyst must name the SALES_REP an order belongs to. `Order.salesRepId` is
 * required and drives every rep analytics/commission report, so an analyst-keyed
 * order is credited to the rep who owns the customer — never to the analyst.
 */
const analystOrderSchema = manualOrderSchema.extend({
  salesRepId: z.string().min(1, "Choose the sales rep this order belongs to."),
});

export type CreateOrderByAnalystInput = z.input<typeof analystOrderSchema>;

/**
 * Data analyst keys in an order on behalf of a sales rep (e.g. one phoned or
 * WhatsApped in that never went through a form).
 *
 * Uses the exact same pricing + write core as the rep's own "Add Order" modal
 * (`createManualOrder`), so package pricing and surplus-unit rules stay
 * identical. The audit row is filed under the rep with the analyst recorded as
 * the real actor — the same on-behalf-of convention as
 * `markOrderDeliveredByAnalyst`.
 */
export async function createOrderByAnalystAction(
  input: CreateOrderByAnalystInput,
): Promise<{ orderId: string; orderNumber: string } | { error: string }> {
  const session = await auth();
  // Called in the action body (never inside an awaited guard) so the suppression
  // actually reaches the writes below and the camera does not double-log.
  suppressCameraForRequest();

  // Route-protected to DATA_ANALYST + SUPER_ADMIN; re-checked here because a
  // server action is reachable directly, not only from the page that renders it.
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "DATA_ANALYST" && role !== "SUPER_ADMIN")) {
    return { error: "You are not authorized to create orders." };
  }

  const parsed = analystOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid order details." };
  }
  const { salesRepId, ...orderInput } = parsed.data;

  const rep = await prisma.user.findFirst({
    where: { id: salesRepId, role: "SALES_REP", isActive: true },
    select: { id: true, name: true },
  });
  if (!rep) {
    return { error: "That sales rep is no longer active. Pick another rep." };
  }

  const result = await createManualOrder(orderInput, rep.id);
  if ("error" in result) return { error: result.error };

  await logManualOrderCreated({
    salesRepId: rep.id,
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    customerName: orderInput.customerName,
    totalAmount: result.totalAmount,
    surplusLines: result.surplusLines,
    actor: { name: session.user.name, role: session.user.role },
    onBehalfOfName: rep.name,
  });

  revalidatePath("/data/order");
  revalidatePath("/data");
  // The order lands on the rep's own list too.
  revalidatePath("/sales-rep/orders");
  return { orderId: result.orderId, orderNumber: result.orderNumber };
}
