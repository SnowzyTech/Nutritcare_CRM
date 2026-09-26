import { auth } from "@/lib/auth/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { SalesRepSidebarClient } from "./sales-rep/sidebar-client";
import { getSalesRepById } from "@/modules/users/services/users.service";
import { getTotalUnread } from "@/modules/chat/services/conversations.service";
import { ChatUnreadProvider } from "@/components/chat/chat-unread-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getUnreadNotificationCount } from "@/modules/notifications/services/notifications.service";

export const metadata: Metadata = {
  title: {
    default: "Sales Rep Dashboard",
    template: "%s | Nutricare CRM",
  },
};

export default async function SalesRepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  const [userRecord, unreadChats, unreadNotifications] = userId
    ? await Promise.all([
        getSalesRepById(userId),
        getTotalUnread(userId),
        getUnreadNotificationCount(userId),
      ])
    : [null, 0, 0];
  const isTeamLead = userRecord?.isTeamLead === true;

  const sidebarUser = userRecord ? {
    name: userRecord.name,
    email: userRecord.email,
    avatarUrl: userRecord.avatarUrl,
  } : undefined;

  return (
    <ChatUnreadProvider initialCount={unreadChats}>
      <NotificationProvider initialCount={unreadNotifications}>
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
          <SalesRepSidebarClient user={sidebarUser} />

          <div className="flex flex-col flex-1 overflow-hidden relative">
            <header className="absolute top-0 right-0 left-0 h-16 sm:h-20 px-4 sm:px-8 flex justify-end items-center gap-2 z-10 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-2">
                <NotificationBell
                  viewAllHref="/sales-rep/notifications"
                  className="bg-white border border-gray-100 shadow-sm"
                />
                {isTeamLead && (
                  <Link
                    href="/sales-rep-manager"
                    className="bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-800 transition flex items-center gap-2"
                  >
                    Manager Mode →
                  </Link>
                )}
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 pt-20 pb-24 md:p-8 md:pt-24 md:pb-8">{children}</main>
          </div>
        </div>
      </NotificationProvider>
    </ChatUnreadProvider>
  );
}
