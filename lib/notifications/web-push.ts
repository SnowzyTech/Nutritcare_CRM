/**
 * Web Push (VAPID) sender. Server-only — never import from a client component.
 *
 * Env (all three required; any missing → push is disabled and every send is a
 * no-op, the same graceful degradation as the chat socket):
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — also read by the browser to subscribe
 *   VAPID_PRIVATE_KEY
 *   VAPID_SUBJECT                 — "mailto:ops@…" or an https URL
 * Generate a pair with: npx web-push generate-vapid-keys
 */
import webpush, { WebPushError } from "web-push";
import type { NotificationPriority } from "@/lib/notifications/catalog";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT = process.env.VAPID_SUBJECT ?? "";

const SEND_TIMEOUT_MS = 5000;

let configured = false;

export function isPushEnabled(): boolean {
  if (!PUBLIC_KEY || !PRIVATE_KEY || !SUBJECT) return false;
  if (!configured) {
    try {
      webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
      configured = true;
    } catch (err) {
      console.error("[web-push] invalid VAPID configuration:", err);
      return false;
    }
  }
  return true;
}

/** What the service worker's `push` handler receives (see public/sw.js). */
export interface PushPayload {
  id: string;
  /** Catalog type — lets an open tab pick the right icon. */
  type: string;
  title: string;
  body: string;
  url: string | null;
  /** Coalescing key: a newer push with the same tag replaces the older one. */
  tag: string;
  priority: NotificationPriority;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export type PushSendResult =
  | { ok: true }
  /** `gone`: the subscription is dead (404/410) and must be deleted. */
  | { ok: false; gone: boolean; error: string };

export async function sendPush(target: PushTarget, payload: PushPayload): Promise<PushSendResult> {
  if (!isPushEnabled()) return { ok: false, gone: false, error: "push not configured" };

  const critical = payload.priority === "critical";
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(payload),
      {
        // A new-order alert is worthless tomorrow; don't let it queue for days.
        TTL: critical ? 60 * 60 : 12 * 60 * 60,
        urgency: critical || payload.priority === "high" ? "high" : "normal",
        // Topic must be ≤32 URL-safe chars; the push service replaces a pending
        // (undelivered) message with the same topic.
        topic: payload.tag.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || undefined,
        timeout: SEND_TIMEOUT_MS,
      },
    );
    return { ok: true };
  } catch (err) {
    if (err instanceof WebPushError) {
      const gone = err.statusCode === 404 || err.statusCode === 410;
      return { ok: false, gone, error: `${err.statusCode}: ${err.body || err.message}`.slice(0, 500) };
    }
    return { ok: false, gone: false, error: String(err).slice(0, 500) };
  }
}
