import { auth } from "@/lib/auth/auth";
import type { Metadata } from "next";
import { WarehouseSidebarClient } from "./warehouse/sidebar-client";

export const metadata: Metadata = {
  title: {
    default: "Warehouse Dashboard",
    template: "%s | Nutricare CRM",
  },
};

export default async function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <WarehouseSidebarClient user={session?.user} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
