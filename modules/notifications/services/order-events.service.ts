import { prisma } from "@/lib/db/prisma";
import { runAfterResponse } from "@/lib/audit/schedule";
import { formatDate } from "@/lib/utils";
import { summarizeItems } from "@/lib/notifications/catalog";
import { notify } from "@/modules/notifications/services/notify.service";

/**
 * Order lifecycle → notifications for sales reps and delivery agents.
 *
 * Each helper takes ids (not loaded rows) so call sites stay one line, and is
 * fire-and-forget: the lookup + `notify()` run AFTER the response is sent, so
 * they add no latency to the action and can never throw into it. Call them
 * after the business write commits (no need to await).
 *
 * `actorId` is whoever caused the event; they are never notified about their
 * own action (a rep cancelling their own order gets no alert for it).
 */

type Actor = { id?: string | null; name?: string | null };

async function loadOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      salesRepId: true,
      agentId: true,
      status: true,
      customer: { select: { state: true } },
      items: { select: { quantity: true, product: { select: { name: true } } } },
      deliveries: {
        select: { scheduledTime: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

function itemSummary(order: NonNullable<Awaited<ReturnType<typeof loadOrder>>>): string {
  return summarizeItems(order.items.map((i) => ({ name: i.product.name, quantity: i.quantity })));
}

/** Runs `fn` after the response is sent; errors are logged, never thrown. */
function safely(label: string, fn: () => Promise<void>): void {
  runAfterResponse(async () => {
    try {
      await fn();
    } catch (err) {
      console.error(`[order-events] ${label} failed:`, err);
    }
  });
}

// ── Sales rep ──────────────────────────────────────────────────────────────

/** A new order landed in a rep's queue (public form, or keyed for them by someone else). */
export function notifyRepNewOrder(orderId: string, actor?: Actor): void {
  safely("notifyRepNewOrder", async () => {
    const order = await loadOrder(orderId);
    if (!order) return;
    await notify({
      type: "order.new",
      vars: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        summary: itemSummary(order),
        state: order.customer.state ?? "",
      },
      to: { userIds: [order.salesRepId] },
      actorId: actor?.id,
      entityType: "Order",
      entityId: order.id,
      dedupeKey: `order.new:${order.id}`,
    });
  });
}

/**
 * Orders were moved onto reps (manager/admin reassignment). One aggregated
 * notification per receiving rep — never one per order.
 */
export function notifyRepsOrdersAssigned(orderIds: string[], actor?: Actor): void {
  safely("notifyRepsOrdersAssigned", async () => {
    if (orderIds.length === 0) return;
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, orderNumber: true, salesRepId: true },
      orderBy: { createdAt: "asc" },
    });
    const byRep = new Map<string, typeof orders>();
    for (const o of orders) {
      const list = byRep.get(o.salesRepId) ?? [];
      list.push(o);
      byRep.set(o.salesRepId, list);
    }
    const batch = Date.now();
    await Promise.all(
      [...byRep.entries()].map(([repId, list]) => {
        const numbers = list.map((o) => o.orderNumber);
        const shown = numbers.slice(0, 4).join(", ");
        return notify({
          type: "orders.assigned_to_you",
          vars: {
            count: list.length,
            orderNumbers: numbers.length > 4 ? `${shown} +${numbers.length - 4} more` : shown,
            firstOrderId: list[0].id,
          },
          to: { userIds: [repId] },
          actorId: actor?.id,
          entityType: list.length === 1 ? "Order" : undefined,
          entityId: list.length === 1 ? list[0].id : undefined,
          dedupeKey: `orders.assigned:${repId}:${batch}`,
        });
      }),
    );
  });
}

/** Tell the rep what happened at the door. */
export function notifyRepDeliveryOutcome(
  orderId: string,
  outcome:
    | { kind: "delivered" }
    | { kind: "failed"; reason?: string | null }
    | { kind: "rescheduled"; date: Date }
    | { kind: "blocked" },
  actor?: Actor,
): void {
  safely("notifyRepDeliveryOutcome", async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, salesRepId: true },
    });
    if (!order) return;
    const base = {
      to: { userIds: [order.salesRepId] },
      actorId: actor?.id,
      entityType: "Order",
      entityId: order.id,
    };
    const ref = { orderId: order.id, orderNumber: order.orderNumber };
    const who = actor?.name?.trim() || "The delivery team";

    switch (outcome.kind) {
      case "delivered":
        await notify({
          ...base,
          type: "order.delivered",
          vars: { ...ref, actorName: who },
          dedupeKey: `order.delivered:${order.id}:${Date.now()}`,
        });
        return;
      case "failed":
        await notify({
          ...base,
          type: "order.failed",
          vars: { ...ref, actorName: who, reason: outcome.reason?.trim() ?? "" },
          dedupeKey: `order.failed:${order.id}:${Date.now()}`,
        });
        return;
      case "rescheduled":
        await notify({
          ...base,
          type: "order.rescheduled",
          vars: { ...ref, date: formatDate(outcome.date) },
        });
        return;
      case "blocked":
        await notify({
          ...base,
          type: "order.delivery_blocked",
          vars: ref,
          // One open alert per order: retries of a refused delivery don't flood.
          dedupeKey: `order.blocked:${order.id}:${new Date().toISOString().slice(0, 10)}`,
        });
        return;
    }
  });
}

// ── Delivery agent ─────────────────────────────────────────────────────────

/** An order is now this agent's to deliver (confirm, revive, or reassigned to them). */
export function notifyAgentAssigned(orderId: string, actor?: Actor): void {
  safely("notifyAgentAssigned", async () => {
    const order = await loadOrder(orderId);
    if (!order?.agentId) return;
    const scheduled = order.deliveries[0]?.scheduledTime;
    await notify({
      type: "delivery.assigned",
      vars: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        summary: itemSummary(order),
        state: order.customer.state ?? "",
        date: scheduled ? formatDate(scheduled) : "",
      },
      to: { agentId: order.agentId },
      actorId: actor?.id,
      entityType: "Order",
      entityId: order.id,
      // Per agent AND per assignment time: re-assigning back to the same agent
      // later is a new, real event.
      dedupeKey: `delivery.assigned:${order.id}:${order.agentId}:${Date.now()}`,
    });
  });
}

/** The order was taken off an agent (moved elsewhere). */
export function notifyAgentUnassigned(
  orderId: string,
  previousAgentId: string | null | undefined,
  actor?: Actor,
): void {
  safely("notifyAgentUnassigned", async () => {
    if (!previousAgentId) return;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, agentId: true },
    });
    if (!order || order.agentId === previousAgentId) return;
    await notify({
      type: "delivery.unassigned",
      vars: { orderId: order.id, orderNumber: order.orderNumber },
      to: { agentId: previousAgentId },
      actorId: actor?.id,
      entityType: "Order",
      entityId: order.id,
    });
  });
}

/** Reassignment from one agent to another: warn the old one, brief the new one. */
export function notifyAgentReassigned(
  orderId: string,
  previousAgentId: string | null | undefined,
  actor?: Actor,
): void {
  notifyAgentUnassigned(orderId, previousAgentId, actor);
  notifyAgentAssigned(orderId, actor);
}

/**
 * The order was cancelled while an agent held it. Pass the agent it was with
 * (read before the write, since revive/cancel paths may clear `agentId`).
 */
export function notifyAgentCancelled(
  orderId: string,
  agentId: string | null | undefined,
  actor?: Actor,
): void {
  safely("notifyAgentCancelled", async () => {
    if (!agentId) return;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true },
    });
    if (!order) return;
    await notify({
      type: "delivery.cancelled",
      vars: { orderId: order.id, orderNumber: order.orderNumber },
      to: { agentId },
      actorId: actor?.id,
      entityType: "Order",
      entityId: order.id,
      dedupeKey: `delivery.cancelled:${order.id}:${agentId}`,
    });
  });
}

/** Items/quantities changed on an order an agent is carrying. Quantities only. */
export function notifyAgentItemsChanged(orderId: string, actor?: Actor): void {
  safely("notifyAgentItemsChanged", async () => {
    const order = await loadOrder(orderId);
    if (!order?.agentId || order.status !== "CONFIRMED") return;
    await notify({
      type: "delivery.items_changed",
      vars: { orderId: order.id, orderNumber: order.orderNumber, summary: itemSummary(order) },
      to: { agentId: order.agentId },
      actorId: actor?.id,
      entityType: "Order",
      entityId: order.id,
    });
  });
}

/** Order notes (the prescription) changed on an order an agent is carrying. */
export function notifyAgentNotesChanged(orderId: string, actor?: Actor): void {
  safely("notifyAgentNotesChanged", async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, agentId: true, status: true },
    });
    if (!order?.agentId || order.status !== "CONFIRMED") return;
    await notify({
      type: "delivery.notes_changed",
      vars: { orderId: order.id, orderNumber: order.orderNumber },
      to: { agentId: order.agentId },
      actorId: actor?.id,
      entityType: "Order",
      entityId: order.id,
    });
  });
}
