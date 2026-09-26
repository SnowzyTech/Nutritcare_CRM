"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "@/modules/chat/services/messages.service";
import { sendRealtime, subscribeRealtime } from "@/lib/realtime/socket-client";

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
 * Chat's view of the shared realtime connection (`lib/realtime/socket-client.ts`
 * owns the one WebSocket per tab, its token refresh and reconnect backoff).
 * This hook only filters to chat frames for the lifetime of the component.
 *
 * If realtime is not configured, it quietly receives nothing — the app keeps
 * working via optimistic UI.
 *
 * Returns `sendTyping`, the one client→server frame the socket server accepts.
 * It no-ops while disconnected, which is the right behaviour for an ephemeral
 * hint: a typing notice that arrives late is worse than one that never arrives.
 */
export function useChatSocket(onEvent: Handler): SendTyping {
  // Kept in a ref so the subscription never re-runs just because the caller
  // passed a new closure.
  const handlerRef = useRef(onEvent);
  useEffect(() => {
    handlerRef.current = onEvent;
  });

  const sendTyping = useCallback<SendTyping>(
    (conversationId, recipientUserIds, typing) => {
      if (recipientUserIds.length === 0) return;
      sendRealtime({ type: "typing", conversationId, recipientUserIds, typing });
    },
    []
  );

  useEffect(
    () =>
      subscribeRealtime((frame) => {
        if (KNOWN_EVENTS.has(frame.type)) handlerRef.current(frame as unknown as ChatSocketEvent);
      }),
    []
  );

  return sendTyping;
}
