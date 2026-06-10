import { auth } from "@/lib/auth/auth";
import type { Metadata } from "next";
import { WarehouseSidebarClient } from "./warehouse/sidebar-client";
import { getSelfProfile } from "@/modules/users/services/users.service";

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
  // Read the avatar from the DB (the session JWT doesn't carry it), so an
  // avatar changed on the settings page reflects here after revalidation.
  const profile = session?.user?.id ? await getSelfProfile(session.user.id) : null;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <WarehouseSidebarClient
        user={{
          name: session?.user?.name,
          email: session?.user?.email,
          image: profile?.avatarUrl ?? null,
        }}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
