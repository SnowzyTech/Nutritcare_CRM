"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { subscribeRealtime } from "@/lib/realtime/socket-client";
import { useFallbackRefresh } from "@/lib/realtime/use-fallback-refresh";
import { syncPushSubscription } from "@/lib/notifications/push-client";
import type { NotificationPriority } from "@/lib/notifications/catalog";
import {
  getMyUnreadNotificationCountAction,
  listMyNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/modules/notifications/actions/notifications.action";

/**
 * Live notification state for the signed-in user, for every role layout.
 *
 * The server is the source of truth (`notifications` rows). This provider:
 *  - seeds the unread count from the layout (`initialCount`),
 *  - reacts instantly to `notification.created` on the shared realtime socket
 *    (toast, chime for critical alerts, count bump, refresh of the list the
 *    alert is about),
 *  - also listens to the service worker (a push that landed while the app is
 *    open), re-checks on focus / socket reconnect, and polls slowly ONLY while
 *    the socket is down — so it stays correct with no socket server, without
 *    paying for polling when realtime is working,
 *  - mirrors the count onto the tab title and the installed app's icon badge.
 */

export interface LiveNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  priority: NotificationPriority;
}

interface NotificationContextValue {
  unreadCount: number;
  /** Bumps whenever new notifications arrive — lists re-fetch on change. */
  version: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  soundEnabled: boolean;
  setSoundEnabled: (on: boolean) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const RECONCILE_DELAY_MS = 1_500;
const SOUND_KEY = "nutricare:notification-sound";
const TITLE_PREFIX = /^\(\d+\+?\)\s/;

function readSoundPref(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

/** Two-tone chime via WebAudio — no asset to cache, works offline. */
function playChime(ctx: AudioContext | null): void {
  if (!ctx || ctx.state !== "running") return;
  const now = ctx.currentTime;
  [880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.18;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

function firstSegment(path: string): string {
  return path.split("?")[0].split("/").filter(Boolean)[0] ?? "";
}

export function NotificationProvider({
  initialCount,
  children,
}: {
  initialCount: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [version, setVersion] = useState(0);
  // Lazy (client) read; nothing sound-related renders before mount, so the
  // server's default can't cause a hydration mismatch.
  const [soundEnabled, setSoundState] = useState(() =>
    typeof window === "undefined" ? true : readSoundPref(),
  );

  const inFlight = useRef(false);
  const reconcileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshRouteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shown = useRef(new Set<string>());
  const lastCount = useRef(initialCount);
  const audio = useRef<AudioContext | null>(null);
  const soundRef = useRef(soundEnabled);
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const setSoundEnabled = useCallback((on: boolean) => {
    soundRef.current = on;
    setSoundState(on);
    try {
      window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
    } catch {
      // preference just won't persist
    }
  }, []);

  // Browsers only allow audio after a user gesture: unlock on the first one.
  useEffect(() => {
    const unlock = () => {
      try {
        const Ctx =
          window.AudioContext ??
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        audio.current ??= new Ctx();
        void audio.current.resume();
      } catch {
        // no audio on this device
      }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await getMyUnreadNotificationCountAction();
      if (res.ok) setUnreadCount(res.data);
    } finally {
      inFlight.current = false;
    }
  }, []);

  /** Toast + chime + list refresh for one new notification (once per id). */
  const present = useCallback(
    (n: LiveNotification) => {
      if (shown.current.has(n.id)) return;
      shown.current.add(n.id);

      const open = () => {
        void markNotificationReadAction(n.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        if (n.link) router.push(n.link);
      };
      const opts = {
        description: n.body,
        duration: n.priority === "critical" ? 15_000 : 6_000,
        action: n.link ? { label: "Open", onClick: open } : undefined,
      };
      if (n.priority === "critical") toast.warning(n.title, opts);
      else if (n.priority === "high") toast.error(n.title, opts);
      else toast(n.title, opts);

      if (n.priority === "critical" && soundRef.current) playChime(audio.current);
      if (n.priority === "critical" && "vibrate" in navigator) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch {
          // unsupported
        }
      }

      // If the user is looking at the area this alert is about (their orders
      // list, their deliveries), pull fresh server data so it just appears.
      if (n.link && firstSegment(n.link) === firstSegment(pathRef.current)) {
        if (refreshRouteTimer.current) clearTimeout(refreshRouteTimer.current);
        refreshRouteTimer.current = setTimeout(() => router.refresh(), 800);
      }
      setVersion((v) => v + 1);
    },
    [router],
  );

  const scheduleReconcile = useCallback(() => {
    if (reconcileTimer.current) clearTimeout(reconcileTimer.current);
    reconcileTimer.current = setTimeout(() => void refresh(), RECONCILE_DELAY_MS);
  }, [refresh]);

  // Realtime path.
  useEffect(
    () =>
      subscribeRealtime((frame) => {
        if (frame.type !== "notification.created") return;
        const n = frame.message as LiveNotification | undefined;
        if (!n?.id) return;
        if (!shown.current.has(n.id)) setUnreadCount((c) => c + 1);
        present(n);
        scheduleReconcile();
      }),
    [present, scheduleReconcile],
  );

  // A push arrived while a tab is open (the service worker forwards it).
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; notification?: LiveNotification } | null;
      if (data?.type !== "notification.push" || !data.notification?.id) return;
      if (!shown.current.has(data.notification.id)) setUnreadCount((c) => c + 1);
      present(data.notification);
      scheduleReconcile();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [present, scheduleReconcile]);

  // Polling fallback: when the count rises without a live event (no socket
  // server), fetch the newest items and present the unseen unread ones.
  useEffect(() => {
    if (unreadCount > lastCount.current) {
      void (async () => {
        const res = await listMyNotificationsAction();
        if (!res.ok) return;
        const fresh = res.data.items.filter((i) => !i.isRead && !shown.current.has(i.id));
        // Present a handful; beyond that one summary toast is kinder.
        fresh.slice(0, 3).forEach((i) =>
          present({
            id: i.id,
            type: i.type,
            title: i.title,
            body: i.message,
            link: i.link,
            priority: i.priority as NotificationPriority,
          }),
        );
        fresh.slice(3).forEach((i) => shown.current.add(i.id));
        if (fresh.length > 3) toast(`${fresh.length - 3} more new notifications`);
      })();
    }
    lastCount.current = unreadCount;
  }, [unreadCount, present]);

  // Seed `shown` with what is already there so a later count rise never
  // toasts the backlog; re-claim this device's push subscription.
  useEffect(() => {
    void listMyNotificationsAction().then((res) => {
      if (res.ok) res.data.items.forEach((i) => shown.current.add(i.id));
    });
    void syncPushSubscription();
    const timers = { reconcile: reconcileTimer, route: refreshRouteTimer };
    return () => {
      if (timers.reconcile.current) clearTimeout(timers.reconcile.current);
      if (timers.route.current) clearTimeout(timers.route.current);
    };
  }, []);

  // Count reconciliation: on mount, on tab focus, on socket reconnect — and a
  // slow poll only while the socket is down (see useFallbackRefresh).
  useFallbackRefresh(refresh);

  // Tab title "(3) …" and the installed app's icon badge.
  useEffect(() => {
    const base = document.title.replace(TITLE_PREFIX, "");
    const label = unreadCount > 99 ? "99+" : String(unreadCount);
    document.title = unreadCount > 0 ? `(${label}) ${base}` : base;

    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    try {
      if (unreadCount > 0) void nav.setAppBadge?.(unreadCount).catch(() => undefined);
      else void nav.clearAppBadge?.().catch(() => undefined);
    } catch {
      // Badging API unsupported
    }
  }, [unreadCount, pathname]);

  const markRead = useCallback(async (id: string) => {
    setUnreadCount((c) => Math.max(0, c - 1));
    await markNotificationReadAction(id);
  }, []);

  const markAllRead = useCallback(async () => {
    setUnreadCount(0);
    await markAllNotificationsReadAction();
    setVersion((v) => v + 1);
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({ unreadCount, version, refresh, markRead, markAllRead, soundEnabled, setSoundEnabled }),
    [unreadCount, version, refresh, markRead, markAllRead, soundEnabled, setSoundEnabled],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

/** Live notification state; a no-op fallback outside a provider. */
export function useNotifications(): NotificationContextValue {
  return (
    useContext(NotificationContext) ?? {
      unreadCount: 0,
      version: 0,
      refresh: async () => undefined,
      markRead: async () => undefined,
      markAllRead: async () => undefined,
      soundEnabled: false,
      setSoundEnabled: () => undefined,
    }
  );
}
