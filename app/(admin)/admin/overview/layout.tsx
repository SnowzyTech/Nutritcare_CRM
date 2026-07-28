import { requireAdminPageAccess } from "@/lib/auth/guard-admin-page";

export default async function OverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPageAccess("overview");
  return <>{children}</>;
}
