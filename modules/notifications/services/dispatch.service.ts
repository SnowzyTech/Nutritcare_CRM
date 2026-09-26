import { prisma } from "@/lib/db/prisma";
import { publishEvent } from "@/lib/chat/socket";
import { sendPush, isPushEnabled, type PushPayload } from "@/lib/notifications/web-push";
import { sendSms, isSmsEnabled } from "@/lib/notifications/sms";
import type { NotificationPriority } from "@/lib/notifications/catalog";

/** A freshly written notification row, with the text already rendered. */
export interface DispatchRow {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  priority: NotificationPriority;
  sms: string | null;
  tag: string;
}

/** Shape of the `notification.created` realtime frame's `message`. */
export interface RealtimeNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  priority: NotificationPriority;
}

/** A subscription is dropped after this many consecutive non-fatal failures. */
const MAX_PUSH_FAILURES = 5;
/** At most one fallback SMS per user in this window — a burst of orders is one text. */
const SMS_WINDOW_MS = 10 * 60 * 1000;

type Channel = "PUSH" | "SMS";
type Status = "SENT" | "FAILED" | "SKIPPED" | "PENDING";

/**
 * Out-of-band delivery for rows `notify()` just wrote. Runs after the response.
 *
 *  - Realtime: live toast/badge in every open tab (best-effort, not recorded).
 *  - Web Push: every registered device of the recipient.
 *  - SMS: `critical` only, and only when push could not reach the user (no
 *    device, or every device failed). Rate-limited per user.
 *
 * Each channel is isolated — one failing never stops the others.
 */
export async function dispatchNotifications(rows: DispatchRow[]): Promise<void> {
  if (rows.length === 0) return;

  await Promise.allSettled(rows.map((row) => publishRealtime(row)));

  const pushReached = await dispatchPush(rows);

  const smsCandidates = rows.filter(
    (r) => r.priority === "critical" && r.sms && !pushReached.has(r.id),
  );
  // Sequential on purpose: the per-user rate limit must see the previous send.
  for (const row of smsCandidates) {
    await dispatchSms(row).catch((err) => console.error("[notify] sms failed:", err));
  }
}

async function publishRealtime(row: DispatchRow): Promise<void> {
  const payload: RealtimeNotification = {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    priority: row.priority,
  };
  await publishEvent("notification.created", [row.recipientId], payload);
}

/** Sends to every device of every recipient. Returns ids of rows at least one device accepted. */
async function dispatchPush(rows: DispatchRow[]): Promise<Set<string>> {
  const reached = new Set<string>();
  if (!isPushEnabled()) return reached;

  const recipientIds = [...new Set(rows.map((r) => r.recipientId))];
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: recipientIds } },
    select: { id: true, userId: true, endpoint: true, p256dh: true, auth: true, failureCount: true },
  });
  if (subs.length === 0) return reached;

  const byUser = new Map<string, typeof subs>();
  for (const s of subs) {
    const list = byUser.get(s.userId) ?? [];
    list.push(s);
    byUser.set(s.userId, list);
  }

  const gone: string[] = [];
  const failed: string[] = [];
  const recovered: string[] = [];
  const log: { notificationId: string; recipientId: string; status: Status; error: string | null }[] = [];

  await Promise.all(
    rows.map(async (row) => {
      const devices = byUser.get(row.recipientId) ?? [];
      const payload: PushPayload = {
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        url: row.link,
        tag: row.tag,
        priority: row.priority,
      };
      const results = await Promise.all(devices.map((d) => sendPush(d, payload)));
      results.forEach((res, i) => {
        const device = devices[i];
        if (res.ok) {
          reached.add(row.id);
          if (device.failureCount > 0) recovered.push(device.id);
        } else if (res.gone) {
          gone.push(device.id);
        } else {
          failed.push(device.id);
        }
      });
      const firstError = results.find((r) => !r.ok);
      log.push({
        notificationId: row.id,
        recipientId: row.recipientId,
        status: reached.has(row.id) ? "SENT" : "FAILED",
        error: reached.has(row.id) || !firstError || firstError.ok ? null : firstError.error,
      });
    }),
  );

  await Promise.allSettled([
    gone.length > 0 && prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } }),
    failed.length > 0 &&
      prisma.pushSubscription
        .updateMany({ where: { id: { in: failed } }, data: { failureCount: { increment: 1 } } })
        .then(() =>
          prisma.pushSubscription.deleteMany({
            where: { id: { in: failed }, failureCount: { gte: MAX_PUSH_FAILURES } },
          }),
        ),
    recovered.length > 0 &&
      prisma.pushSubscription.updateMany({ where: { id: { in: recovered } }, data: { failureCount: 0 } }),
    log.length > 0 &&
      prisma.notificationDelivery.createMany({
        data: log.map((l) => ({ ...l, channel: "PUSH" satisfies Channel })),
      }),
  ]);

  return reached;
}

async function dispatchSms(row: DispatchRow): Promise<void> {
  if (!isSmsEnabled() || !row.sms) return;

  // Claim the SMS slot under a per-user advisory lock, so two concurrent requests
  // (e.g. two orders submitted in the same second) can't both pass the check.
  const claimId = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`sms:${row.recipientId}`}))`;
    const recent = await tx.notificationDelivery.count({
      where: {
        recipientId: row.recipientId,
        channel: "SMS",
        status: { in: ["SENT", "PENDING"] },
        createdAt: { gte: new Date(Date.now() - SMS_WINDOW_MS) },
      },
    });
    const status: Status = recent > 0 ? "SKIPPED" : "PENDING";
    const claim = await tx.notificationDelivery.create({
      data: {
        notificationId: row.id,
        recipientId: row.recipientId,
        channel: "SMS",
        status,
        error: recent > 0 ? "rate-limited: an SMS was sent in the last 10 minutes" : null,
      },
      select: { id: true },
    });
    return status === "PENDING" ? claim.id : null;
  });
  if (!claimId) return;

  const user = await prisma.user.findUnique({
    where: { id: row.recipientId },
    select: { phone: true, whatsappNumber: true },
  });
  const phone = user?.phone || user?.whatsappNumber;
  const result = phone ? await sendSms(phone, row.sms) : ({ ok: false, error: "no phone number on file" } as const);

  await prisma.notificationDelivery.update({
    where: { id: claimId },
    data: result.ok ? { status: "SENT" } : { status: "FAILED", error: result.error },
  });
}
