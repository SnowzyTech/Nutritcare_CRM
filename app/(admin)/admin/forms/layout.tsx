import { requireAdminPageAccess } from "@/lib/auth/guard-admin-page";

export default async function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPageAccess("forms");
  return <>{children}</>;
}
