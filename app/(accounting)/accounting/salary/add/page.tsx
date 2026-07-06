import type { Metadata } from "next";
import { SalaryAddClient, type SalaryPrefillRow } from "../../_components/SalaryAddClient";
import { listSalaryRecords, listSalaryMonths, monthKey } from "@/modules/finance/services/salary.service";

export const metadata: Metadata = {
  title: "Add Salary Records",
  description: "Add new employee salary records including allowances, deductions and payment details.",
};

// "2026-07" → "2026-08"
function nextMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1)); // m is 1-based → this is the next month
  return monthKey(d);
}

export default async function SalaryAddPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; month?: string }>;
}) {
  const { from, month } = await searchParams;
  const months = await listSalaryMonths();

  // Which month's payroll to copy as the starting point.
  const sourceMonth = from ?? months[0] ?? null;
  const sourceRecords = sourceMonth
    ? await listSalaryRecords({ month: sourceMonth })
    : [];

  // Target month to save into: explicit, else the month after the source,
  // else the current month.
  const suggestedMonth = month ?? (sourceMonth ? nextMonth(sourceMonth) : monthKey(new Date()));

  const num = (n: unknown) => String(Number(n ?? 0) || "");

  const prefillRows: SalaryPrefillRow[] = sourceRecords.map(r => ({
    name: r.name,
    department: r.department ?? "",
    designation: r.designation ?? "",
    level: r.level ?? "",
    amount: num(r.amount),
    basic: num(r.basic),
    housingAllowance: num(r.housingAllowance),
    grossPay: num(r.grossPay),
    transportation: num(r.transportation),
    wardrobe: num(r.wardrobe),
    utilityAllowance: num(r.utilityAllowance),
    grossPayTotal: num(r.grossPayTotal),
    paye: num(r.paye),
    pension: num(r.pension),
    hmo: num(r.hmo),
    otherDeduction: num(r.otherDeduction),
    netPay: num(r.netPay),
    bank: num(r.bank),
    cash: num(r.cash),
    zenithAccountNumber: r.zenithAccountNumber ?? "",
    remark: r.remark ?? "",
    company: r.company ?? "",
  }));

  return (
    <SalaryAddClient
      prefillRows={prefillRows}
      sourceMonth={sourceMonth}
      suggestedMonth={suggestedMonth}
      existingMonths={months}
    />
  );
}
