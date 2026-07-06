import type { Metadata } from "next";
import { SalaryClient } from "../_components/SalaryClient";
import { listSalaryRecords, listSalaryMonths, monthKey } from "@/modules/finance/services/salary.service";

export const metadata: Metadata = {
  title: "Salary",
  description: "View and manage employee salary records, allowances, deductions and net pay.",
};

export default async function SalaryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const months = await listSalaryMonths();

  // Default to the most recent payroll month so the page opens on the current
  // payroll rather than every month mixed together. "All" shows everything.
  const selectedMonth = month ?? months[0] ?? monthKey(new Date());
  const records = await listSalaryRecords(
    selectedMonth && selectedMonth !== "All" ? { month: selectedMonth } : {},
  );

  const fmt = (n: unknown) =>
    `₦${Number(n ?? 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

  const initialRows = records.map(r => ({
    id: r.id,
    company: r.company ?? "",
    name: r.name,
    department: r.department ?? "",
    designation: r.designation ?? "",
    level: r.level ?? "",
    amount: fmt(r.amount),
    basic: fmt(r.basic),
    housingAllowance: fmt(r.housingAllowance),
    grossPay: fmt(r.grossPay),
    transportation: fmt(r.transportation),
    wardrobe: fmt(r.wardrobe),
    utilityAllowance: fmt(r.utilityAllowance),
    grossPayTotal: fmt(r.grossPayTotal),
    paye: fmt(r.paye),
    pension: fmt(r.pension),
    hmo: fmt(r.hmo),
    otherDeduction: fmt(r.otherDeduction),
    netPay: fmt(r.netPay),
    bank: fmt(r.bank),
    cash: fmt(r.cash),
    zenithAccountNumber: r.zenithAccountNumber ?? "",
    remark: r.remark || "--------",
  }));

  return (
    <SalaryClient
      initialRows={initialRows}
      months={months}
      selectedMonth={selectedMonth}
    />
  );
}
