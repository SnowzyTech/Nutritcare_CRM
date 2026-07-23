import { requireAdminPageAccess } from "@/lib/auth/guard-admin-page";

export default async function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPageAccess("inventory");
  return <>{children}</>;
}
