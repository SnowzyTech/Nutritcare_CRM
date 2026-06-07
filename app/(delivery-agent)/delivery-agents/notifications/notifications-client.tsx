"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Truck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/modules/delivery/actions/notifications.action";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

interface Props {
  notifications: NotificationItem[];
}

function iconForType(type: string) {
  switch (type) {
    case "delivery_fee_changed":
      return <Truck className="w-5 h-5" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
}

export function NotificationsClient({ notifications }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(notifications);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const handleClick = (n: NotificationItem) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
      startTransition(() => {
        markNotificationReadAction(n.id);
      });
    }
    if (n.link) router.push(n.link);
  };

  const handleMarkAll = () => {
    if (unreadCount === 0) return;
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    startTransition(() => {
      markAllNotificationsReadAction();
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1e1e2d]">Notifications</h2>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <button
          onClick={handleMarkAll}
          disabled={unreadCount === 0 || isPending}
          className="flex items-center gap-2 text-xs font-bold text-[#ad1df4] disabled:text-gray-300 transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          Mark all read
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-[#faf5ff] flex items-center justify-center text-[#ad1df4] mb-4">
            <Bell className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-gray-700">No notifications yet</p>
          <p className="text-xs text-gray-400 mt-1">
            You&apos;ll be notified here about changes to your deliveries.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left flex gap-3 p-4 rounded-2xl border transition-all ${
                n.isRead
                  ? "bg-white border-gray-100"
                  : "bg-[#faf5ff] border-[#eddcfb]"
              } hover:border-[#ad1df4]/40`}
            >
              <div
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  n.isRead ? "bg-gray-50 text-gray-400" : "bg-[#ad1df4]/10 text-[#ad1df4]"
                }`}
              >
                {iconForType(n.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900 truncate">{n.title}</p>
                  {!n.isRead && <span className="shrink-0 w-2 h-2 rounded-full bg-[#ad1df4]" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-1.5">
                  {formatDate(n.createdAt)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
