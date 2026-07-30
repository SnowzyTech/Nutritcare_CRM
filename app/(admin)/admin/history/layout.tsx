import { requireAdminPageAccess } from "@/lib/auth/guard-admin-page";

export default async function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPageAccess("history");
  return <>{children}</>;
}
