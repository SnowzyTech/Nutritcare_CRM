import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { runAfterResponse } from "@/lib/audit/schedule";
import {
  renderNotification,
  type NotificationType,
  type NotificationVars,
} from "@/lib/notifications/catalog";
import {
  resolveRecipientIds,
  type NotificationRecipients,
} from "@/modules/notifications/services/recipients.service";
import {
  dispatchNotifications,
  type DispatchRow,
} from "@/modules/notifications/services/dispatch.service";

export interface NotifyInput<T extends NotificationType> {
  type: T;
  vars: NotificationVars<T>;
  to: NotificationRecipients;
  /** The user who caused the event — never notified about their own action. */
  actorId?: string | null;
  entityType?: string;
  entityId?: string;
  /**
   * Idempotency key, unique per recipient (e.g. `order.new:{orderId}`). A retry
   * or double submit with the same key creates nothing and sends nothing.
   */
  dedupeKey?: string;
}

/**
 * The single entry point for every notification.
 *
 *  1. resolves recipients (active + approved users, minus the actor),
 *  2. writes the in-app rows — the source of truth for the bell,
 *  3. schedules realtime / Web Push / SMS delivery AFTER the response is sent.
 *
 * Call it after the business write has committed, never inside a transaction.
 * Never throws: a notification problem must not change an action's result.
 */
export async function notify<T extends NotificationType>(input: NotifyInput<T>): Promise<void> {
  try {
    const recipientIds = await resolveRecipientIds(input.to, input.actorId);
    if (recipientIds.length === 0) return;

    const rendered = renderNotification(input.type, input.vars);
    const data = input.vars as unknown as Prisma.InputJsonValue;

    // With skipDuplicates, only rows actually inserted come back — so a
    // duplicate (same recipient + dedupeKey) is never dispatched twice.
    const rows = await prisma.notification.createManyAndReturn({
      data: recipientIds.map((recipientId) => ({
        recipientId,
        type: input.type,
        priority: rendered.priority,
        title: rendered.title,
        message: rendered.body,
        link: rendered.link,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        data,
        dedupeKey: input.dedupeKey ?? null,
      })),
      skipDuplicates: true,
      select: { id: true, recipientId: true },
    });
    if (rows.length === 0) return;

    const dispatch: DispatchRow[] = rows.map((r) => ({
      id: r.id,
      recipientId: r.recipientId,
      type: input.type,
      title: rendered.title,
      body: rendered.body,
      link: rendered.link,
      priority: rendered.priority,
      sms: rendered.sms,
      // One system notification per entity: "assigned" then "cancelled" for the
      // same order replaces rather than stacks, so the tray shows its latest state.
      tag: input.entityId ? `${input.entityType ?? "entity"}:${input.entityId}` : r.id,
    }));

    runAfterResponse(() =>
      dispatchNotifications(dispatch).catch((err) =>
        console.error("[notify] dispatch failed:", err),
      ),
    );
  } catch (err) {
    console.error(`[notify] ${input.type} failed:`, err);
  }
}
