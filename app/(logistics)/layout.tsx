import { auth } from "@/lib/auth/auth";
import type { Metadata } from "next";
import { LogisticsSidebarClient } from "./logistics/sidebar-client";

export const metadata: Metadata = {
  title: {
    default: "Logistics Dashboard",
    template: "%s | Nutricare CRM",
  },
};

export default async function LogisticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <LogisticsSidebarClient />

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
