import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { MediaBuyerTopbar } from "../_components/topbar";

export const metadata: Metadata = { title: "Notifications" };

/**
 * Notifications — scaffold only. Wiring to the `Notification` model for the
 * media-buyer role is a later pass; shown as an empty state for now.
 */
export default function NotificationsPage() {
  return (
    <div className="max-w-[900px] mx-auto pb-16">
      <MediaBuyerTopbar
        title="Notifications"
        subtitle="Updates about your forms, leads and deliveries."
        showCreate={false}
      />

      <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center py-24 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <Bell size={26} />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-700">You&apos;re all caught up</p>
          <p className="text-sm text-slate-400 mt-1">No new notifications right now.</p>
        </div>
      </div>
    </div>
  );
}
