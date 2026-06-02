import type { Metadata } from "next";
import { SalaryAddClient } from "../../_components/SalaryAddClient";

export const metadata: Metadata = {
  title: "Add Salary Records",
  description: "Add new employee salary records including allowances, deductions and payment details.",
};

export default async function SalaryAddPage() {
  return <SalaryAddClient />;
}
