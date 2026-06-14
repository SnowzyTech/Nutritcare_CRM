"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/modules/chat/services/messages.service";

export type ChatSocketEvent = {
  type: "message.created";
  conversationId: string;
  message: ChatMessage;
};

type Handler = (evt: ChatSocketEvent) => void;

/**
 * Connects the browser to the standalone chat socket server for the lifetime of
 * the chat surface. It fetches a fresh signed token on every (re)connect, so
 * tokens stay short-lived, and reconnects with capped exponential backoff.
 *
 * If realtime is not configured (`/api/chat/socket-token` returns
 * `enabled: false`), it quietly stops — the app keeps working via optimistic UI.
 */
export function useChatSocket(onEvent: Handler): void {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

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
        if (!cfg.enabled || !cfg.url || !cfg.token) return; // realtime disabled — stop

        const url = `${cfg.url}/ws?token=${encodeURIComponent(cfg.token)}`;
        ws = new WebSocket(url);

        ws.onopen = () => {
          retry = 0;
        };
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data as string) as ChatSocketEvent;
            if (data?.type === "message.created") handlerRef.current(data);
          } catch {
            // ignore malformed frames
          }
        };
        ws.onclose = () => {
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
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try {
        ws?.close();
      } catch {
        // no-op
      }
    };
  }, []);
}
