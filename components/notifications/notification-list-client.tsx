"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { listMyNotificationsAction } from "@/modules/notifications/actions/notifications.action";
import type {
  NotificationListItem,
  NotificationPage,
} from "@/modules/notifications/services/notifications.service";
import { useNotifications } from "./notification-provider";
import { NotificationIcon, priorityTone } from "./notification-icon";
import { PushPermissionCard } from "./push-permission-card";

/**
 * Full notification list (a role's /notifications page). Cursor-paginated,
 * optimistic mark-read, and re-fetches the first page whenever the provider
 * reports new arrivals.
 */
export function NotificationListClient({
  initialPage,
  emptyHint = "You'll be notified here when something needs your attention.",
}: {
  initialPage: NotificationPage;
  emptyHint?: string;
}) {
  const router = useRouter();
  const { version, markRead, markAllRead } = useNotifications();
  const [items, setItems] = useState<NotificationListItem[]>(initialPage.items);
  const [cursor, setCursor] = useState<string | null>(initialPage.nextCursor);
  const [loadingMore, startLoadMore] = useTransition();
  const firstVersion = useRef(version);

  // New arrivals: re-fetch page one and merge it over what is loaded.
  useEffect(() => {
    if (version === firstVersion.current) return;
    void (async () => {
      const res = await listMyNotificationsAction();
      if (!res.ok) return;
      setItems((prev) => {
        const fresh = res.data.items;
        const freshIds = new Set(fresh.map((i) => i.id));
        return [...fresh, ...prev.filter((i) => !freshIds.has(i.id))];
      });
    })();
  }, [version]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const open = useCallback(
    (n: NotificationListItem) => {
      if (!n.isRead) {
        setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
        void markRead(n.id);
      }
      if (n.link) router.push(n.link);
    },
    [markRead, router],
  );

  const handleMarkAll = () => {
    if (unreadCount === 0) return;
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    void markAllRead();
  };

  const loadMore = () => {
    if (!cursor) return;
    startLoadMore(async () => {
      const res = await listMyNotificationsAction(cursor);
      if (!res.ok) return;
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...res.data.items.filter((i) => !seen.has(i.id))];
      });
      setCursor(res.data.nextCursor);
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1e1e2d]">Notifications</h2>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <button
          onClick={handleMarkAll}
          disabled={unreadCount === 0}
          className="flex items-center gap-2 text-xs font-bold text-[#ad1df4] disabled:text-gray-300 transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          Mark all read
        </button>
      </div>

      <PushPermissionCard />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-[#faf5ff] flex items-center justify-center text-[#ad1df4] mb-4">
            <Bell className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-gray-700">No notifications yet</p>
          <p className="text-xs text-gray-400 mt-1">{emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => open(n)}
              className={cn(
                "w-full text-left flex gap-3 p-4 rounded-2xl border transition-all hover:border-[#ad1df4]/40",
                n.isRead ? "bg-white border-gray-100" : "bg-[#faf5ff] border-[#eddcfb]",
              )}
            >
              <div
                className={cn(
                  "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  priorityTone(n.priority, n.isRead),
                )}
              >
                <NotificationIcon type={n.type} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900 truncate">{n.title}</p>
                  {!n.isRead && <span className="shrink-0 w-2 h-2 rounded-full bg-[#ad1df4]" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-1.5">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            </button>
          ))}
          {cursor && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-[#ad1df4] disabled:text-gray-300"
            >
              {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Load older
            </button>
          )}
        </div>
      )}
    </div>
  );
}
