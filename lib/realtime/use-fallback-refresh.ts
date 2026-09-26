"use client";

import { useEffect, useRef } from "react";
import { isRealtimeOpen, subscribeRealtimeStatus } from "@/lib/realtime/socket-client";

/** Poll interval while the socket is down (or realtime isn't configured). */
const FALLBACK_POLL_MS = 150_000;
/** Minimum gap between refreshes triggered by focus / tab-visible. */
const FOCUS_MIN_GAP_MS = 30_000;

/**
 * Keeps a server-owned count (unread chats, unread notifications) correct
 * without paying for polling when it isn't needed:
 *
 *  - once on mount (the layout's seed can be a cached render),
 *  - when the tab comes back into view — throttled — to catch anything that
 *    happened while the phone was asleep or the tab was in the background,
 *  - once when the socket RE-connects, since events sent while it was down
 *    were never delivered,
 *  - on a slow interval ONLY while the socket is not open (server down, or
 *    realtime not configured). While it is open, events arrive live and a poll
 *    would be pure cost — one function call + one DB query per tab per tick.
 *
 * `refresh` should be stable (useCallback) and de-duplicate its own in-flight calls.
 */
export function useFallbackRefresh(refresh: () => void | Promise<void>): void {
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  });

  useEffect(() => {
    let lastRun = 0;
    let poll: ReturnType<typeof setInterval> | null = null;
    let hasBeenOpen = isRealtimeOpen();

    const run = () => {
      lastRun = Date.now();
      void refreshRef.current();
    };

    const visible = () => document.visibilityState === "visible";

    // Poll only while the socket is down AND someone is looking at the tab.
    const syncPolling = () => {
      const shouldPoll = !isRealtimeOpen() && visible();
      if (shouldPoll && !poll) {
        poll = setInterval(run, FALLBACK_POLL_MS);
      } else if (!shouldPoll && poll) {
        clearInterval(poll);
        poll = null;
      }
    };

    const onVisible = () => {
      syncPolling();
      if (visible() && Date.now() - lastRun >= FOCUS_MIN_GAP_MS) run();
    };

    const unsubscribe = subscribeRealtimeStatus((open) => {
      if (open && hasBeenOpen) run(); // reconnected: catch up on what was missed
      if (open) hasBeenOpen = true;
      syncPolling();
    });

    run();
    syncPolling();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      unsubscribe();
      if (poll) clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);
}
