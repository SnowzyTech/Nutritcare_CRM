import { auth } from "@/lib/auth/auth";
import type { Metadata } from "next";
import { SalesRepSidebarClient } from "./sales-rep/sidebar-client";

export const metadata: Metadata = {
  title: {
    default: "Sales Rep Dashboard",
    template: "%s | Nutricare CRM",
  },
};

export default async function SalesRepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sales Rep Sidebar */}
      <SalesRepSidebarClient user={session?.user} />

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
