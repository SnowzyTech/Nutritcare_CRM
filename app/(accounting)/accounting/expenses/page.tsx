import { Suspense } from "react";
import { ExpensesClient } from "../_components/ExpensesClient";
import {
  listExpenses,
  listExpenseCategories,
  listPaymentAccounts,
  nextExpenseReference,
} from "@/modules/finance/services/expenses.service";
import { listSuppliers } from "@/modules/finance/services/suppliers.service";
import { EXPENSE_CLASSES } from "@/modules/finance/data/chart-of-accounts";

export default async function ExpensesPage() {
  const [expenses, categories, accounts, suppliers, nextRef] = await Promise.all([
    listExpenses(),
    listExpenseCategories(),
    listPaymentAccounts(),
    listSuppliers(),
    nextExpenseReference(),
  ]);

  const fmt = (n: number) =>
    `₦${Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

  const initialHistory = expenses.map(e => ({
    id: e.id,
    category: e.expenseCategory.name,
    expenseName: e.expenseName?.name ?? "",
    ref: e.referenceNumber,
    account: e.paidFromAccount.name,
    accountType: e.paidFromAccount.name.toLowerCase().includes("monie") ? "moniepoint" : "gtbank",
    amount: fmt(Number(e.amount)),
    tax: fmt(Number(e.tax)),
    val1: fmt(Number(e.amount)),
    val2: fmt(Number(e.tax)),
    date: e.date.toISOString().slice(0, 10),
    supplier: e.supplier?.name ?? "",
    lineItems: e.lineItems.map(l => ({
      product: l.product ?? "",
      description: l.description ?? "",
      quantity: l.quantity,
      amount: fmt(Number(l.amount)),
      tax: fmt(Number(l.tax)),
    })),
    notes: e.notes ?? "",
    attachmentUrl: e.attachmentUrl ?? null,
    attachmentUrls: e.attachmentUrls ?? [],
    createdBy: e.createdBy?.name ?? "",
  }));

  const initialSuppliers = suppliers.map(s => ({
    id: s.id,
    name: s.name,
    contact: s.phone1,
    balance: "₦0",
  }));

  // Expense Entry only deals with expense-type accounts (Cost of Sales,
  // Operating Expenses, Finance Costs, Tax). Categories without a class (custom
  // ones added in-app) are kept so they remain usable.
  const expenseClasses = EXPENSE_CLASSES as readonly number[];
  const expenseCategories = categories.filter(
    c => c.accountClass == null || expenseClasses.includes(c.accountClass),
  );

  return (
    <ExpensesClient
      initialHistory={initialHistory}
      initialCategories={expenseCategories.map(c => ({
        id: c.id,
        name: c.name,
        financialStatement: c.financialStatement,
        accountClass: c.accountClass,
        expenseNames: c.expenseNames.map(n => ({ id: n.id, name: n.name, code: n.code ?? undefined })),
      }))}
      initialAccounts={accounts.map(a => ({ id: a.id, name: a.name, logoUrl: a.logoUrl ?? undefined }))}
      initialSuppliers={initialSuppliers}
      nextRef={nextRef}
    />
  );
}
