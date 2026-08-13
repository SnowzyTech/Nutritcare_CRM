import React from "react";
import { auth } from "@/lib/auth/auth";
import { DeliveryAgentSidebarClient } from "./delivery-agents/sidebar-client";
import {
  getAgentIdByUserId,
  getAgentOrderStatusCounts,
  isAgentPortalAccessAllowed,
} from "@/modules/delivery/services/delivery-agent-portal.service";
import { getUnreadNotificationCount } from "@/modules/delivery/services/notifications.service";
import { ForceLogout } from "./force-logout";

export default async function DeliveryAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  // A suspended or removed agent keeps a valid JWT until it expires, so re-check
  // their live status here (runs on every navigation) and sign them out on their
  // next interaction if access has been revoked.
  if (userId && !(await isAgentPortalAccessAllowed(userId))) {
    return <ForceLogout />;
  }

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
