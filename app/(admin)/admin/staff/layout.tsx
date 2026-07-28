import { requireAdminPageAccess } from "@/lib/auth/guard-admin-page";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPageAccess("staff");
  return <>{children}</>;
}
