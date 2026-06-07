import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getUserNotifications } from "@/modules/delivery/services/notifications.service";
import { NotificationsClient } from "./notifications-client";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await getUserNotifications(session.user.id);

  return <NotificationsClient notifications={notifications} />;
}
