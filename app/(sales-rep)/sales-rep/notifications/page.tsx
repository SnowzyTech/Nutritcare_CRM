import type { Metadata } from "next";
import { NotificationsPage } from "@/components/notifications/notifications-page";

export const metadata: Metadata = { title: "Notifications" };

export default function SalesRepNotificationsPage() {
  return (
    <NotificationsPage emptyHint="You'll be notified here when a new order arrives or a delivery changes." />
  );
}
