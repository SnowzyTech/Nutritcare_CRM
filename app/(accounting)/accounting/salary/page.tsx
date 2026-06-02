import type { Metadata } from "next";
import { SalaryClient } from "../_components/SalaryClient";

export const metadata: Metadata = {
  title: "Salary",
  description: "View and manage employee salary records, allowances, deductions and net pay.",
};

export default async function SalaryPage() {
  // No backend yet — pass no data; SalaryClient will use its fallback mock rows.
  return <SalaryClient />;
}
