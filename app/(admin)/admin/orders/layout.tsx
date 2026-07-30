import { requireAdminPageAccess } from "@/lib/auth/guard-admin-page";

export default async function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPageAccess("orders");
  return <>{children}</>;
}
