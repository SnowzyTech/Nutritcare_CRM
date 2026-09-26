import type { Metadata } from "next";
import { NotificationsPage } from "@/components/notifications/notifications-page";

export const metadata: Metadata = { title: "Notifications" };

export default function DeliveryAgentNotificationsPage() {
  return (
    <NotificationsPage emptyHint="You'll be notified here when a delivery is assigned to you or changes." />
  );
}
