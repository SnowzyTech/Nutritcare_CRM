"use client";

import { signOut } from "next-auth/react";
import { disablePush } from "@/lib/notifications/push-client";

/**
 * Sign out from a client component. Unregisters this device's push subscription
 * first — staff phones are shared, and the next person to pick one up must not
 * get the previous user's order alerts on the lock screen.
 *
 * Push cleanup is bounded so a slow network can never block logging out.
 */
export async function signOutAndUnsubscribe(
  options: Parameters<typeof signOut>[0] = { callbackUrl: "/login" },
): Promise<void> {
  await Promise.race([disablePush(), new Promise((resolve) => setTimeout(resolve, 2500))]);
  await signOut(options);
}
