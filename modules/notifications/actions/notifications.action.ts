"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import {
  getUnreadNotificationCount,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationPage,
} from "@/modules/notifications/services/notifications.service";
import {
  pushSubscriptionSchema,
  removePushSubscription,
  savePushSubscription,
} from "@/modules/notifications/services/push-subscriptions.service";
import { notify } from "@/modules/notifications/services/notify.service";
import { forgetPushDevice, rememberPushDevice } from "@/lib/notifications/push-device-cookie";

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

// Every action acts on the SESSION's user — never a client-supplied user id.
// Deliberately no revalidatePath: the bell/list update client-side, and a
// revalidation here would re-render whichever dashboard the user is on.

const idSchema = z.string().min(1).max(64);

export async function listMyNotificationsAction(
  cursor?: string | null,
): Promise<Result<NotificationPage>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  const parsed = idSchema.nullish().safeParse(cursor);
  if (!parsed.success) return { ok: false, error: "Invalid cursor" };
  try {
    return { ok: true, data: await getUserNotifications(session.user.id, { cursor: parsed.data }) };
  } catch {
    return { ok: false, error: "Could not load notifications" };
  }
}

export async function getMyUnreadNotificationCountAction(): Promise<Result<number>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  try {
    return { ok: true, data: await getUnreadNotificationCount(session.user.id) };
  } catch {
    return { ok: false, error: "Could not load count" };
  }
}

export async function markNotificationReadAction(id: string): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid id" };
  await markNotificationRead(session.user.id, parsed.data);
  return { ok: true, data: undefined };
}

export async function markAllNotificationsReadAction(): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  await markAllNotificationsRead(session.user.id);
  return { ok: true, data: undefined };
}

export async function savePushSubscriptionAction(sub: unknown): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  const parsed = pushSubscriptionSchema.safeParse(sub);
  if (!parsed.success) return { ok: false, error: "Invalid subscription" };
  try {
    const userAgent = (await headers()).get("user-agent");
    await savePushSubscription(session.user.id, parsed.data, userAgent);
    await rememberPushDevice(parsed.data.endpoint);
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "Could not save subscription" };
  }
}

export async function removePushSubscriptionAction(endpoint: string): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  const parsed = z.string().min(1).max(2048).safeParse(endpoint);
  if (!parsed.success) return { ok: false, error: "Invalid endpoint" };
  await removePushSubscription(session.user.id, parsed.data);
  await forgetPushDevice(session.user.id);
  return { ok: true, data: undefined };
}

/** Sends the caller a test notification through every channel they have. */
export async function sendTestNotificationAction(): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  await notify({
    type: "system.test",
    vars: {},
    to: { userIds: [session.user.id] },
  });
  return { ok: true, data: undefined };
}
