/**
 * Server-side bridge to the standalone chat socket server, which lives in a
 * separate project alongside this app (`../nutricare-chat-socket/`).
 *
 * This app stays the sole source of truth: it writes authoritatively, then
 * publishes `message.created` to the socket server over a shared-secret HTTP
 * call. The socket server holds no DB and routes purely by `userId`, so the
 * publish payload carries the exact recipient list this app computed.
 *
 * Everything degrades gracefully: if the socket env vars are absent the helpers
 * no-op, and the app behaves exactly as Phase 1 (optimistic UI, no realtime).
 *
 * NOTE: server-only. Uses `node:crypto`; never import from a client component.
 */
import crypto from "node:crypto";

const TOKEN_SECRET = process.env.CHAT_SOCKET_TOKEN_SECRET ?? "";
const PUBLISH_URL = process.env.CHAT_SOCKET_PUBLISH_URL ?? "";
const PUBLISH_SECRET = process.env.CHAT_SOCKET_PUBLISH_SECRET ?? "";
const PUBLIC_WS_URL = process.env.NEXT_PUBLIC_CHAT_SOCKET_URL ?? "";

const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour; client refetches on every reconnect
const PUBLISH_TIMEOUT_MS = 2000;

/** Whether clients should attempt to connect (token minting is configured). */
export function isSocketEnabled(): boolean {
  return Boolean(PUBLIC_WS_URL && TOKEN_SECRET);
}

export function getSocketUrl(): string {
  return PUBLIC_WS_URL;
}

/**
 * Mint a short-lived, HMAC-signed connect token carrying just the userId. The
 * socket server verifies it with the same secret and routes events to this
 * user's live sockets. Format: `base64url(payload).base64url(hmac)`.
 */
export function signSocketToken(userId: string): string | null {
  if (!TOKEN_SECRET) return null;
  const payload = { userId, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

export type PublishInput = {
  conversationId: string;
  recipientUserIds: string[];
  message: unknown;
};

/**
 * Fire-and-forget publish of `message.created`. Never throws and never blocks
 * the authoritative send for long — a down/slow socket server must not degrade
 * message delivery (the DB write already succeeded).
 */
export async function publishMessageCreated(input: PublishInput): Promise<void> {
  if (!PUBLISH_URL || !PUBLISH_SECRET) return; // realtime not configured
  if (input.recipientUserIds.length === 0) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PUBLISH_TIMEOUT_MS);
  try {
    await fetch(`${PUBLISH_URL}/publish`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-publish-secret": PUBLISH_SECRET,
      },
      body: JSON.stringify({ event: "message.created", ...input }),
      signal: controller.signal,
    });
  } catch {
    // swallow: realtime is best-effort; the DB is authoritative
  } finally {
    clearTimeout(timer);
  }
}
