import React from "react";
import type { Metadata } from "next";
import { InventorySidebar } from "@/components/layout/inventory-sidebar";
import { NotificationRoot } from "@/components/notifications/notification-root";

export const metadata: Metadata = {
  title: {
    default: "Inventory Management",
    template: "%s | Nutricare CRM",
  },
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationRoot>
      <div className="flex h-screen bg-[#F8F9FB] font-sans overflow-hidden">
        <InventorySidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </NotificationRoot>
  );
}
