import { requireAccountingPermission } from "@/lib/auth/accounting-access";

export default async function SalaryLayout({ children }: { children: React.ReactNode }) {
  await requireAccountingPermission("SALARY");
  return <>{children}</>;
}
