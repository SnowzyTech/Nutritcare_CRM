import type { Metadata } from "next";
import { MediaBuyerTopbar } from "../_components/topbar";
import { NotificationsPage } from "@/components/notifications/notifications-page";

export const metadata: Metadata = { title: "Notifications" };

export default function MediaBuyerNotificationsPage() {
  return (
    <div className="max-w-[900px] mx-auto pb-16">
      <MediaBuyerTopbar
        title="Notifications"
        subtitle="Updates about your forms, leads and deliveries."
        showCreate={false}
      />
      <NotificationsPage />
    </div>
  );
}
