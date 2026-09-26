import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  pushSubscriptionSchema,
  savePushSubscription,
} from "@/modules/notifications/services/push-subscriptions.service";
import { rememberPushDevice } from "@/lib/notifications/push-device-cookie";

/**
 * Re-registers a rotated push subscription. Called by the service worker's
 * `pushsubscriptionchange` handler (public/sw.js), which cannot call Server
 * Actions. Same-origin with the session cookie; the app's own UI uses
 * `savePushSubscriptionAction` instead.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await savePushSubscription(session.user.id, parsed.data, req.headers.get("user-agent"));
  await rememberPushDevice(parsed.data.endpoint);
  return new NextResponse(null, { status: 204 });
}
