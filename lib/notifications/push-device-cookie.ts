/**
 * Remembers which push endpoint belongs to THIS browser (httpOnly cookie), so a
 * server-side logout — the `<form action={logoutAction}>` paths, which never run
 * client code — can still unregister the device. Staff phones are shared: the
 * next person must not receive the previous user's alerts.
 *
 * Server-only (next/headers). Client logouts also unsubscribe in the browser via
 * `signOutAndUnsubscribe` (lib/auth/client-sign-out.ts).
 */
import { cookies } from "next/headers";
import { removePushSubscription } from "@/modules/notifications/services/push-subscriptions.service";

const COOKIE = "nc_push_ep";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function rememberPushDevice(endpoint: string): Promise<void> {
  (await cookies()).set(COOKIE, endpoint, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
}

/** Unregisters this browser's device for `userId` (if any). Never throws. */
export async function forgetPushDevice(userId: string | null | undefined): Promise<void> {
  try {
    const jar = await cookies();
    const endpoint = jar.get(COOKIE)?.value;
    if (endpoint && userId) await removePushSubscription(userId, endpoint);
    jar.delete(COOKIE);
  } catch {
    // best-effort: logging out must never fail on this
  }
}
