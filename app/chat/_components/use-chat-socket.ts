"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "@/modules/chat/services/messages.service";

export type ChatSocketEvent =
  | { type: "message.created"; conversationId: string; message: ChatMessage }
  | { type: "presence.snapshot"; userIds: string[] }
  | { type: "presence.update"; userId: string; online: boolean }
  | { type: "typing"; conversationId: string; userId: string; typing: boolean };

type Handler = (evt: ChatSocketEvent) => void;

export type SendTyping = (
  conversationId: string,
  recipientUserIds: string[],
  typing: boolean
) => void;

const KNOWN_EVENTS = new Set([
  "message.created",
  "presence.snapshot",
  "presence.update",
  "typing",
]);

/**
 * Connects the browser to the standalone chat socket server for the lifetime of
 * the chat surface. It fetches a fresh signed token on every (re)connect, so
 * tokens stay short-lived, and reconnects with capped exponential backoff.
 *
 * If realtime is not configured (`/api/chat/socket-token` returns
 * `enabled: false`), it quietly stops — the app keeps working via optimistic UI.
 *
 * Returns `sendTyping`, the one client→server frame the socket server accepts.
 * It no-ops while disconnected, which is the right behaviour for an ephemeral
 * hint: a typing notice that arrives late is worse than one that never arrives.
 */
export function useChatSocket(onEvent: Handler): SendTyping {
  // Kept in a ref so the connection effect never re-runs (and the socket never
  // reconnects) just because the caller passed a new closure.
  const handlerRef = useRef(onEvent);
  useEffect(() => {
    handlerRef.current = onEvent;
  });
  const wsRef = useRef<WebSocket | null>(null);

  const sendTyping = useCallback<SendTyping>(
    (conversationId, recipientUserIds, typing) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      if (recipientUserIds.length === 0) return;
      try {
        ws.send(
          JSON.stringify({ type: "typing", conversationId, recipientUserIds, typing })
        );
      } catch {
        // no-op: best-effort
      }
    },
    []
  );

  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    let retry = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function scheduleReconnect() {
      if (closed) return;
      retry = Math.min(retry + 1, 6);
      const delay = Math.min(1000 * 2 ** retry, 30000);
      reconnectTimer = setTimeout(connect, delay);
    }

    async function connect() {
      if (closed) return;
      try {
        const res = await fetch("/api/chat/socket-token", { cache: "no-store" });
        if (!res.ok) return scheduleReconnect();
        const cfg = await res.json();
        // Realtime deliberately off — stop for good. A malformed/partial
        // response is a different case: retry rather than killing realtime
        // for the rest of the page's life.
        if (!cfg.enabled) return;
        if (!cfg.url || !cfg.token) return scheduleReconnect();

        const url = `${cfg.url}/ws?token=${encodeURIComponent(cfg.token)}`;
        ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          retry = 0;
        };
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data as string) as ChatSocketEvent;
            if (data?.type && KNOWN_EVENTS.has(data.type)) handlerRef.current(data);
          } catch {
            // ignore malformed frames
          }
        };
        ws.onclose = () => {
          wsRef.current = null;
          if (!closed) scheduleReconnect();
        };
        ws.onerror = () => {
          try {
            ws?.close();
          } catch {
            // no-op
          }
        };
      } catch {
        scheduleReconnect();
      }
    }

    connect();

    return () => {
      closed = true;
      wsRef.current = null;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try {
        ws?.close();
      } catch {
        // no-op
      }
    };
  }, []);

  return sendTyping;
}
