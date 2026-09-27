import { auth } from "@/lib/auth/auth";
import { getUnreadNotificationCount } from "@/modules/notifications/services/notifications.service";
import { NotificationProvider } from "./notification-provider";

/**
 * Server wrapper for a role layout: seeds the live notification state with the
 * signed-in user's unread count. Put the bell (`NotificationBell`) wherever the
 * layout's header/sidebar has room.
 */
export async function NotificationRoot({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const initialCount = session?.user?.id
    ? await getUnreadNotificationCount(session.user.id).catch(() => 0)
    : 0;
  return <NotificationProvider initialCount={initialCount}>{children}</NotificationProvider>;
}
