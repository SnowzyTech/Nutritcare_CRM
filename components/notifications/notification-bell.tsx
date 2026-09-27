"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listMyNotificationsAction } from "@/modules/notifications/actions/notifications.action";
import type { NotificationListItem } from "@/modules/notifications/services/notifications.service";
import { useNotifications } from "./notification-provider";
import { NotificationIcon, priorityTone } from "./notification-icon";

/** Red unread bubble for any Bell icon. Renders nothing at 0. */
export function NotificationUnreadBadge({ className }: { className?: string }) {
  const { unreadCount } = useNotifications();
  if (unreadCount <= 0) return null;
  return (
    <span
      aria-label={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
      className={cn(
        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none border-2 border-white pointer-events-none",
        className,
      )}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}

/**
 * Bell + dropdown of the latest notifications. Drop it into any role header.
 * `viewAllHref` points at the role's full list page when it has one.
 *
 * With `label`, it renders as a sidebar row (icon + label + count) instead of a
 * round icon button — pass `collapsed` from the sidebar to fall back to the icon.
 */
export function NotificationBell({
  viewAllHref,
  className,
  iconClassName,
  label,
  collapsed = false,
  side = "bottom",
  align = "end",
}: {
  viewAllHref?: string;
  className?: string;
  iconClassName?: string;
  label?: string;
  collapsed?: boolean;
  side?: "bottom" | "right" | "top" | "left";
  align?: "start" | "center" | "end";
}) {
  const router = useRouter();
  const { version, markRead, markAllRead, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationListItem[] | null>(null);

  // Load when opened, and again if something new arrives while it is open.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void listMyNotificationsAction().then((res) => {
      if (!cancelled && res.ok) setItems(res.data.items.slice(0, 10));
    });
    return () => {
      cancelled = true;
    };
  }, [open, version]);

  const select = (n: NotificationListItem) => {
    if (!n.isRead) {
      setItems((prev) => prev?.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)) ?? null);
      void markRead(n.id);
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const markAll = () => {
    setItems((prev) => prev?.map((i) => ({ ...i, isRead: true })) ?? null);
    void markAllRead();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {label ? (
        <PopoverTrigger
          aria-label="Notifications"
          title={collapsed ? label : undefined}
          className={cn(
            "relative w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition",
            className,
            collapsed && "justify-center px-0",
          )}
        >
          <span className="flex items-center gap-3">
            <Bell className={cn("h-5 w-5 shrink-0", iconClassName)} />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </span>
          <NotificationUnreadBadge className={collapsed ? "absolute top-0.5 right-2" : undefined} />
        </PopoverTrigger>
      ) : (
        <PopoverTrigger
          aria-label="Notifications"
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition",
            className,
          )}
        >
          <Bell className={cn("h-5 w-5", iconClassName)} />
          <NotificationUnreadBadge className="absolute -top-1 -right-1" />
        </PopoverTrigger>
      )}
      <PopoverContent
        side={side}
        align={align}
        sideOffset={8}
        className="w-[22rem] max-w-[calc(100vw-2rem)] p-0 gap-0 bg-white text-gray-900"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Notifications</p>
          <button
            type="button"
            onClick={markAll}
            disabled={unreadCount === 0}
            className="flex items-center gap-1 text-[11px] font-bold text-[#ad1df4] disabled:text-gray-300"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {items === null ? (
            <div className="flex justify-center py-10 text-gray-300">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-xs text-gray-400">No notifications yet</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => select(n)}
                className={cn(
                  "w-full text-left flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50",
                  !n.isRead && "bg-[#faf5ff]",
                )}
              >
                <div
                  className={cn(
                    "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    priorityTone(n.priority, n.isRead),
                  )}
                >
                  <NotificationIcon type={n.type} className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate">{n.title}</p>
                  <p className="text-[11px] text-gray-500 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.isRead && <span className="shrink-0 mt-1 w-2 h-2 rounded-full bg-[#ad1df4]" />}
              </button>
            ))
          )}
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-bold text-[#ad1df4] py-3 border-t border-gray-100 hover:bg-gray-50"
          >
            View all
          </Link>
        )}
      </PopoverContent>
    </Popover>
  );
}
