"use client";

/**
 * One WebSocket per browser tab to the standalone socket server
 * (`../nutricare-chat-socket/`), shared by every realtime consumer — chat,
 * the chat-unread badge and the notification bell.
 *
 * Ref-counted: the first `subscribe` connects, the last unsubscribe closes. A
 * fresh signed token is fetched on every (re)connect so tokens stay short-lived,
 * and reconnects use capped exponential backoff.
 *
 * If realtime is not configured (`/api/chat/socket-token` → `enabled: false`) it
 * quietly stops; consumers fall back to polling.
 *
 * Consumers that poll as a fallback watch `subscribeRealtimeStatus` and only
 * poll while the socket is NOT open — a live socket already delivers every
 * event, so polling on top of it is pure cost.
 */

export type RealtimeFrame = { type: string } & Record<string, unknown>;
type Handler = (frame: RealtimeFrame) => void;

const handlers = new Set<Handler>();
let ws: WebSocket | null = null;
let retry = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let connecting = false;
/** Realtime is switched off server-side — don't try again for this page's life. */
let disabled = false;

const statusListeners = new Set<(open: boolean) => void>();
let isOpen = false;

function setOpen(open: boolean): void {
  if (isOpen === open) return;
  isOpen = open;
  for (const listener of statusListeners) {
    try {
      listener(open);
    } catch {
      // one consumer throwing must not starve the others
    }
  }
}

function scheduleReconnect(): void {
  if (handlers.size === 0 || disabled) return;
  retry = Math.min(retry + 1, 6);
  const delay = Math.min(1000 * 2 ** retry, 30000);
  reconnectTimer = setTimeout(() => void connect(), delay);
}

async function connect(): Promise<void> {
  if (connecting || ws || handlers.size === 0 || disabled) return;
  connecting = true;
  try {
    const res = await fetch("/api/chat/socket-token", { cache: "no-store" });
    if (!res.ok) return scheduleReconnect();
    const cfg = (await res.json()) as { enabled?: boolean; url?: string; token?: string };
    // Deliberately off — stop for good. A malformed/partial response is a
    // different case: retry rather than killing realtime for the page's life.
    if (!cfg.enabled) {
      disabled = true;
      return;
    }
    if (!cfg.url || !cfg.token) return scheduleReconnect();
    // Everyone unsubscribed while the token was in flight.
    if (handlers.size === 0) return;

    const socket = new WebSocket(`${cfg.url}/ws?token=${encodeURIComponent(cfg.token)}`);
    ws = socket;

    socket.onopen = () => {
      retry = 0;
      setOpen(true);
    };
    socket.onmessage = (e) => {
      let frame: RealtimeFrame;
      try {
        frame = JSON.parse(e.data as string) as RealtimeFrame;
      } catch {
        return; // ignore malformed frames
      }
      if (!frame || typeof frame.type !== "string") return;
      for (const handler of handlers) {
        try {
          handler(frame);
        } catch {
          // one consumer throwing must not starve the others
        }
      }
    };
    socket.onclose = () => {
      // A socket we closed on purpose (last unsubscribe) must not reconnect.
      if (ws !== socket) return;
      ws = null;
      setOpen(false);
      scheduleReconnect();
    };
    socket.onerror = () => {
      try {
        socket.close();
      } catch {
        // no-op
      }
    };
  } catch {
    scheduleReconnect();
  } finally {
    connecting = false;
  }
}

function disconnect(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  const socket = ws;
  ws = null;
  retry = 0;
  setOpen(false);
  try {
    socket?.close();
  } catch {
    // no-op
  }
}

/** Receive every frame from the socket server. Returns the unsubscribe. */
export function subscribeRealtime(handler: Handler): () => void {
  handlers.add(handler);
  void connect();
  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) disconnect();
  };
}

/** Whether the socket is currently open (events are being delivered live). */
export function isRealtimeOpen(): boolean {
  return isOpen;
}

/**
 * Called with `true` when the socket opens and `false` when it drops. On a
 * reconnect, consumers should re-fetch once: events sent while it was down
 * were not delivered.
 */
export function subscribeRealtimeStatus(listener: (open: boolean) => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/** Best-effort client→server frame; no-ops while disconnected. */
export function sendRealtime(frame: unknown): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(frame));
  } catch {
    // no-op: best-effort
  }
}
