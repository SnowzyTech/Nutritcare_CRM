import React from "react";
import { auth } from "@/lib/auth/auth";
import { DeliveryAgentSidebarClient } from "./delivery-agents/sidebar-client";
import {
  getAgentIdByUserId,
  getAgentOrderStatusCounts,
} from "@/modules/delivery/services/delivery-agent-portal.service";
import { getUnreadNotificationCount } from "@/modules/delivery/services/notifications.service";

export default async function DeliveryAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  let pendingCount = 0;
  let unreadNotifications = 0;
  if (userId) {
    const [agentId, unread] = await Promise.all([
      getAgentIdByUserId(userId),
      getUnreadNotificationCount(userId),
    ]);
    unreadNotifications = unread;
    if (agentId) {
      const counts = await getAgentOrderStatusCounts(agentId);
      pendingCount = (counts.PENDING ?? 0) + (counts.CONFIRMED ?? 0);
    }
  }

  return (
    <div className="flex h-screen bg-[#fafafb] text-gray-900">
      <DeliveryAgentSidebarClient
        user={session?.user}
        pendingCount={pendingCount}
        unreadNotifications={unreadNotifications}
      />

      <main className="flex-1 flex flex-col min-w-0 relative pb-20 lg:pb-0">
        <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
