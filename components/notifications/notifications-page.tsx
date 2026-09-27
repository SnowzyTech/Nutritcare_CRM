import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getUserNotifications } from "@/modules/notifications/services/notifications.service";
import { NotificationListClient } from "./notification-list-client";

/**
 * Server half of a role's /notifications page: auth + first page, then the
 * shared client list. A role page is just `<NotificationsPage />`.
 */
export async function NotificationsPage({ emptyHint }: { emptyHint?: string }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const initialPage = await getUserNotifications(session.user.id);
  return <NotificationListClient initialPage={initialPage} emptyHint={emptyHint} />;
}
