import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

/** A browser `PushSubscription.toJSON()`, validated. */
export const pushSubscriptionSchema = z.object({
  // Push services are always HTTPS; anything else is not a real subscription.
  endpoint: z
    .string()
    .max(2048)
    .startsWith("https://")
    .refine((v) => URL.canParse(v), "Invalid endpoint"),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

/** Most devices one user may register; the oldest is dropped beyond this. */
const MAX_DEVICES_PER_USER = 10;

/**
 * Registers (or re-claims) a device for `userId`. Upserting by endpoint means a
 * shared phone always belongs to whoever is signed in on it now — the previous
 * user stops receiving that phone's pushes the moment the next one opens the app.
 */
export async function savePushSubscription(
  userId: string,
  sub: PushSubscriptionInput,
  userAgent: string | null,
): Promise<void> {
  const data = {
    userId,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    userAgent: userAgent?.slice(0, 300) ?? null,
    lastSeenAt: new Date(),
    failureCount: 0,
  };
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { endpoint: sub.endpoint, ...data },
    update: data,
  });

  const devices = await prisma.pushSubscription.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true },
  });
  if (devices.length > MAX_DEVICES_PER_USER) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: devices.slice(MAX_DEVICES_PER_USER).map((d) => d.id) } },
    });
  }
}

/** Removes a device — only if it currently belongs to `userId`. */
export async function removePushSubscription(userId: string, endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
}

export async function countPushDevices(userId: string): Promise<number> {
  return prisma.pushSubscription.count({ where: { userId } });
}
