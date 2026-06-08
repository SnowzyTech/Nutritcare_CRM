import { prisma } from "@/lib/db/prisma";
import { OrderStatus, InvoiceStatus, PurchaseOrderStatus } from "@prisma/client";
import { getChartOfAccounts } from "@/modules/finance/services/ledger.service";
import {
  accumulatedDepreciationAsOf,
  type DepreciationMethod,
} from "@/modules/finance/lib/depreciation";

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

export interface Period {
  from: Date;
  to: Date;
}

export interface ComparePeriods {
  current: Period;
  prior: Period;
}

export interface NamedAmount {
  name: string;
  current: number;
  prior: number;
}

// Treat these order statuses as "earned revenue" for accounting purposes.
const REVENUE_STATUSES = ["DELIVERED", "CONFIRMED"] as const;

const DEC = (v: any) => Number(v ?? 0);

// ─────────────────────────────────────────────────────────────────────────────
// Expense grouping by financial statement
// ─────────────────────────────────────────────────────────────────────────────

export interface CategoryExpenseGroup {
  categoryName: string;
  items: NamedAmount[];
  total: { current: number; prior: number };
}

async function fetchExpensesForPeriod(
  categoryIds: string[],
  period: Period
): Promise<Map<string, Map<string, number>>> {
  const expenses = await prisma.expense.findMany({
    where: {
      expenseCategoryId: { in: categoryIds },
      date: { gte: period.from, lte: period.to },
    },
    select: {
      amount: true,
      expenseCategoryId: true,
      expenseName: { select: { name: true } },
    },
  });
  const grouped = new Map<string, Map<string, number>>();
  for (const e of expenses) {
    const catId = e.expenseCategoryId;
    const label = e.expenseName?.name ?? "General";
    if (!grouped.has(catId)) grouped.set(catId, new Map());
    const m = grouped.get(catId)!;
    m.set(label, (m.get(label) ?? 0) + DEC(e.amount));
  }
  return grouped;
}

export async function getExpensesGroupedByCategoryForStatement(
  financialStatement: string,
  periods: ComparePeriods
): Promise<CategoryExpenseGroup[]> {
  const categories = await prisma.expenseCategory.findMany({
    where: { financialStatement },
    select: { id: true, name: true },
  });
  if (categories.length === 0) return [];

  const categoryIds = categories.map(c => c.id);
  const catNameOf = new Map(categories.map(c => [c.id, c.name]));

  const [curGrouped, priGrouped] = await Promise.all([
    fetchExpensesForPeriod(categoryIds, periods.current),
    fetchExpensesForPeriod(categoryIds, periods.prior),
  ]);

  const activeCatIds = new Set([...curGrouped.keys(), ...priGrouped.keys()]);
  const result: CategoryExpenseGroup[] = [];

  for (const catId of activeCatIds) {
    const catName = catNameOf.get(catId) ?? "Uncategorized";
    const curItems = curGrouped.get(catId) ?? new Map();
    const priItems = priGrouped.get(catId) ?? new Map();
    const allNames = new Set([...curItems.keys(), ...priItems.keys()]);

    const items: NamedAmount[] = [...allNames].map(name => ({
      name,
      current: curItems.get(name) ?? 0,
      prior: priItems.get(name) ?? 0,
    }));

    const total = items.reduce(
      (acc, i) => ({ current: acc.current + i.current, prior: acc.prior + i.prior }),
      { current: 0, prior: 0 }
    );

    result.push({ categoryName: catName, items, total });
  }

  return result.sort((a, b) => b.total.current - a.total.current);
}

// ─────────────────────────────────────────────────────────────────────────────
// Profit & Loss
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfitAndLossReport {
  revenue: NamedAmount[];
  costOfSales: NamedAmount[];
  operatingExpenses: CategoryExpenseGroup[];
  totals: {
    revenue: { current: number; prior: number };
    cos: { current: number; prior: number };
    grossProfit: { current: number; prior: number };
    opex: { current: number; prior: number };
    operatingProfit: { current: number; prior: number };
  };
}

async function getProductPnL(period: Period) {
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        status: { in: REVENUE_STATUSES as any },
        deletedAt: null,
        date: { gte: period.from, lte: period.to },
      },
    },
    select: {
      quantity: true,
      lineTotal: true,
      costPriceAtSale: true,
      product: { select: { id: true, name: true } },
    },
  });

  const byProduct = new Map<string, { name: string; revenue: number; cost: number }>();
  for (const it of items) {
    const key = it.product.id;
    const entry = byProduct.get(key) ?? { name: it.product.name, revenue: 0, cost: 0 };
    entry.revenue += DEC(it.lineTotal);
    entry.cost += it.quantity * DEC(it.costPriceAtSale);
    byProduct.set(key, entry);
  }
  return byProduct;
}

export async function getProfitAndLoss(periods: ComparePeriods): Promise<ProfitAndLossReport> {
  const [curProd, priProd, operatingExpenses] = await Promise.all([
    getProductPnL(periods.current),
    getProductPnL(periods.prior),
    getExpensesGroupedByCategoryForStatement("Profit & Loss Statement", periods),
  ]);

  const productNames = new Set<string>();
  curProd.forEach(v => productNames.add(v.name));
  priProd.forEach(v => productNames.add(v.name));

  const revenue: NamedAmount[] = [];
  const costOfSales: NamedAmount[] = [];
  for (const name of productNames) {
    const cur = [...curProd.values()].find(p => p.name === name);
    const pri = [...priProd.values()].find(p => p.name === name);
    revenue.push({ name, current: cur?.revenue ?? 0, prior: pri?.revenue ?? 0 });
    costOfSales.push({ name, current: cur?.cost ?? 0, prior: pri?.cost ?? 0 });
  }
  revenue.sort((a, b) => b.current - a.current);
  costOfSales.sort((a, b) => b.current - a.current);

  const sum = (arr: NamedAmount[], k: "current" | "prior") => arr.reduce((s, r) => s + r[k], 0);
  const totRev = { current: sum(revenue, "current"), prior: sum(revenue, "prior") };
  const totCos = { current: sum(costOfSales, "current"), prior: sum(costOfSales, "prior") };
  const grossProfit = { current: totRev.current - totCos.current, prior: totRev.prior - totCos.prior };

  const totOpex = operatingExpenses.reduce(
    (acc, g) => ({ current: acc.current + g.total.current, prior: acc.prior + g.total.prior }),
    { current: 0, prior: 0 }
  );
  const operatingProfit = {
    current: grossProfit.current - totOpex.current,
    prior: grossProfit.prior - totOpex.prior,
  };

  return {
    revenue,
    costOfSales,
    operatingExpenses,
    totals: { revenue: totRev, cos: totCos, grossProfit, opex: totOpex, operatingProfit },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Trial Balance — derived from JournalEntryRow
// ─────────────────────────────────────────────────────────────────────────────

export interface TrialBalanceRow {
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  debit: number;
  credit: number;
}

function inferAccountType(name: string): TrialBalanceRow["type"] {
  const lower = name.toLowerCase();
  if (/cash|bank|receivable|inventory|prepaid|asset|equipment|vat input/.test(lower)) return "Asset";
  if (/payable|loan|accrued|deferred|tax payable|liability/.test(lower)) return "Liability";
  if (/capital|equity|retained|share/.test(lower)) return "Equity";
  if (/sales|revenue|income/.test(lower)) return "Revenue";
  return "Expense";
}

export async function getTrialBalance(period: Period): Promise<TrialBalanceRow[]> {
  const db = prisma as any;
  const rows = await db.journalEntryRow.findMany({
    where: { journalEntry: { date: { gte: period.from, lte: period.to } } },
    select: { account: true, debits: true, credits: true },
  });

  const map = new Map<string, { debit: number; credit: number }>();
  for (const r of rows) {
    const acc = (r.account as string) || "Unspecified";
    const entry = map.get(acc) ?? { debit: 0, credit: 0 };
    entry.debit += DEC(r.debits);
    entry.credit += DEC(r.credits);
    map.set(acc, entry);
  }

  return [...map.entries()]
    .map(([name, v], idx) => ({
      code: String(1000 + idx),
      name,
      type: inferAccountType(name),
      debit: v.debit,
      credit: v.credit,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ─────────────────────────────────────────────────────────────────────────────
// Subledger-derived financial position
//
// These statements are assembled from the operational subledgers (orders,
// invoices, inventory movements, the fixed-asset register, expenses, salaries,
// purchase orders and payment accounts) rather than from a fully-posted general
// ledger. Each figure is documented with its source. Where the system has no
// authoritative data (e.g. a stored cash balance), a clearly-labelled derived /
// balancing line is used instead of silently mismatching.
// ─────────────────────────────────────────────────────────────────────────────

// Cash collected: in this COD business an order's cash is realised on delivery.
const COLLECTED_ORDER_STATUSES: OrderStatus[] = ["DELIVERED"];
// Revenue earned (accrual) — used for retained earnings.
const EARNED_ORDER_STATUSES: OrderStatus[] = ["DELIVERED", "CONFIRMED"];

/** Σ cash & bank, derived: opening balances + collections − payments ≤ asOf. */
async function cashAsOf(asOf: Date): Promise<number> {
  const [accounts, collected, expenses, salaries, assets] = await Promise.all([
    prisma.paymentAccount.findMany({
      select: { openingBalance: true, openingBalanceAsOf: true },
    }),
    prisma.order.aggregate({
      _sum: { netAmount: true },
      where: {
        status: { in: COLLECTED_ORDER_STATUSES },
        deletedAt: null,
        date: { lte: asOf },
      },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true, tax: true },
      where: { date: { lte: asOf } },
    }),
    prisma.salaryRecord.findMany({
      where: { date: { lte: asOf } },
      select: { netPay: true, amount: true },
    }),
    prisma.fixedAsset.aggregate({
      _sum: { purchasePrice: true },
      where: { deletedAt: null, purchaseDate: { lte: asOf } },
    }),
  ]);

  const opening = accounts.reduce(
    (s, a) =>
      a.openingBalanceAsOf == null || a.openingBalanceAsOf <= asOf
        ? s + DEC(a.openingBalance)
        : s,
    0,
  );
  const collections = DEC(collected._sum.netAmount);
  const paidExpenses = DEC(expenses._sum.amount) + DEC(expenses._sum.tax);
  const paidSalaries = salaries.reduce(
    (s, r) => s + (DEC(r.netPay) > 0 ? DEC(r.netPay) : DEC(r.amount)),
    0,
  );
  const assetSpend = DEC(assets._sum.purchasePrice);

  return opening + collections - paidExpenses - paidSalaries - assetSpend;
}

/** Accounts receivable: unpaid (SENT/OVERDUE) invoices dated ≤ asOf. */
async function receivablesAsOf(asOf: Date): Promise<number> {
  const r = await prisma.invoice.aggregate({
    _sum: { invoiceTotal: true },
    where: { status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] }, invoiceDate: { lte: asOf } },
  });
  return DEC(r._sum.invoiceTotal);
}

/** Inventory at cost: signed stock movements ≤ asOf × product cost. */
async function inventoryValueAsOf(asOf: Date): Promise<number> {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: {
      costPrice: true,
      stockMovementItems: {
        select: { quantity: true, stockMovement: { select: { type: true, date: true } } },
      },
    },
  });

  let total = 0;
  for (const p of products) {
    let qty = 0;
    for (const item of p.stockMovementItems) {
      if (item.stockMovement.date > asOf) continue;
      qty += item.stockMovement.type === "OUTGOING" ? -item.quantity : item.quantity;
    }
    total += Math.max(0, qty) * DEC(p.costPrice);
  }
  return total;
}

/** Net book value of the fixed-asset register at asOf. */
async function fixedAssetsNetAsOf(asOf: Date): Promise<{ net: number; accumulated: number }> {
  const assets = await prisma.fixedAsset.findMany({
    where: {
      deletedAt: null,
      purchaseDate: { lte: asOf },
      OR: [{ disposedAt: null }, { disposedAt: { gt: asOf } }],
    },
  });

  let net = 0;
  let accumulated = 0;
  for (const a of assets) {
    const cost = DEC(a.purchasePrice);
    let acc = 0;
    if (
      !a.nonDepreciable &&
      a.depreciationStartDate &&
      a.usefulLifeYears &&
      a.depreciationMethod
    ) {
      acc = accumulatedDepreciationAsOf(
        {
          purchasePrice: cost,
          salvageValue: DEC(a.salvageValue),
          usefulLifeYears: a.usefulLifeYears,
          depreciationStartDate: a.depreciationStartDate,
          method: a.depreciationMethod as DepreciationMethod,
        },
        asOf,
      );
    }
    accumulated += acc;
    net += Math.max(DEC(a.salvageValue), cost - acc);
  }
  return { net, accumulated };
}

/** Accounts payable proxy: open (non-cancelled) purchase orders dated ≤ asOf. */
async function payablesAsOf(asOf: Date): Promise<number> {
  const pos = await prisma.purchaseOrder.findMany({
    where: { status: { not: PurchaseOrderStatus.CANCELLED }, date: { lte: asOf } },
    select: { items: { select: { quantity: true, unitCost: true } } },
  });
  return pos.reduce(
    (s, po) => s + po.items.reduce((t, i) => t + i.quantity * DEC(i.unitCost), 0),
    0,
  );
}

/** Net journal balances by account class ≤ asOf (best-effort, by account name). */
async function journalClassBalancesAsOf(asOf: Date): Promise<Record<number, number>> {
  const [chart, rows] = await Promise.all([
    getChartOfAccounts(),
    prisma.journalEntryRow.findMany({
      where: { journalEntry: { date: { lte: asOf } } },
      select: { name: true, account: true, debits: true, credits: true },
    }),
  ]);

  const classByName = new Map<string, number>();
  for (const c of chart) {
    if (c.accountClass) {
      classByName.set(c.accountName.toLowerCase(), c.accountClass);
      classByName.set(c.categoryName.toLowerCase(), c.accountClass);
    }
  }

  const byClass: Record<number, number> = {};
  for (const r of rows) {
    const key = ((r.name as string) || (r.account as string) || "").toLowerCase();
    const cls = classByName.get(key);
    if (!cls) continue;
    // Liabilities/Equity/Revenue carry credit-normal balances.
    byClass[cls] = (byClass[cls] ?? 0) + (DEC(r.credits) - DEC(r.debits));
  }
  return byClass;
}

/** Operating profit earned in a period (revenue − COGS − P&L opex). Excludes depreciation. */
async function operatingProfitForPeriod(period: Period): Promise<number> {
  const [items, opexCats] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        order: {
          status: { in: EARNED_ORDER_STATUSES },
          deletedAt: null,
          date: { gte: period.from, lte: period.to },
        },
      },
      select: { quantity: true, lineTotal: true, costPriceAtSale: true },
    }),
    prisma.expenseCategory.findMany({
      where: { financialStatement: "Profit & Loss Statement" },
      select: { id: true },
    }),
  ]);

  let revenue = 0;
  let cogs = 0;
  for (const it of items) {
    revenue += DEC(it.lineTotal);
    cogs += it.quantity * DEC(it.costPriceAtSale);
  }

  const opexAgg = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: {
      expenseCategoryId: { in: opexCats.map((c) => c.id) },
      date: { gte: period.from, lte: period.to },
    },
  });

  return revenue - cogs - DEC(opexAgg._sum.amount);
}

// ── Balance Sheet ──────────────────────────────────────────────────────────────

export interface BalanceSheetLine {
  label: string;
  current: number;
  prior: number;
  /** Marks heuristic/derived lines so the UI can footnote them. */
  derived?: boolean;
}

export interface BalanceSheetReport {
  currentAsOf: string;
  priorAsOf: string;
  assets: BalanceSheetLine[];
  liabilities: BalanceSheetLine[];
  equity: BalanceSheetLine[];
  totals: {
    assets: { current: number; prior: number };
    liabilities: { current: number; prior: number };
    equity: { current: number; prior: number };
  };
}

interface PositionColumn {
  cash: number;
  receivables: number;
  inventory: number;
  ppeNet: number;
  payables: number;
  liabilitiesOther: number;
  capital: number;
  retainedEarnings: number;
}

async function positionAsOf(asOf: Date): Promise<PositionColumn> {
  const epoch = new Date(0);
  const [cash, receivables, inventory, ppe, payables, jcls, profit] = await Promise.all([
    cashAsOf(asOf),
    receivablesAsOf(asOf),
    inventoryValueAsOf(asOf),
    fixedAssetsNetAsOf(asOf),
    payablesAsOf(asOf),
    journalClassBalancesAsOf(asOf),
    operatingProfitForPeriod({ from: epoch, to: asOf }),
  ]);

  // Retained earnings = cumulative operating profit less accumulated depreciation
  // (a non-cash charge already reflected in the net PP&E figure).
  const retainedEarnings = profit - ppe.accumulated;

  return {
    cash,
    receivables,
    inventory,
    ppeNet: ppe.net,
    payables,
    liabilitiesOther: jcls[2] ?? 0,
    capital: jcls[3] ?? 0,
    retainedEarnings,
  };
}

export async function getBalanceSheet(periods: ComparePeriods): Promise<BalanceSheetReport> {
  const curAsOf = periods.current.to;
  const priAsOf = periods.prior.to;
  const [cur, pri] = await Promise.all([positionAsOf(curAsOf), positionAsOf(priAsOf)]);

  const assets: BalanceSheetLine[] = [
    { label: "Cash & bank (derived)", current: cur.cash, prior: pri.cash, derived: true },
    { label: "Accounts receivable", current: cur.receivables, prior: pri.receivables },
    { label: "Inventory", current: cur.inventory, prior: pri.inventory },
    { label: "Property, plant & equipment (net)", current: cur.ppeNet, prior: pri.ppeNet },
  ];

  const liabilities: BalanceSheetLine[] = [
    { label: "Accounts payable (open POs)", current: cur.payables, prior: pri.payables, derived: true },
    { label: "Other liabilities (per journals)", current: cur.liabilitiesOther, prior: pri.liabilitiesOther },
  ];

  const totalAssets = {
    current: assets.reduce((s, l) => s + l.current, 0),
    prior: assets.reduce((s, l) => s + l.prior, 0),
  };
  const totalLiabilities = {
    current: liabilities.reduce((s, l) => s + l.current, 0),
    prior: liabilities.reduce((s, l) => s + l.prior, 0),
  };

  // Equity is presented so the statement balances; the difference between net
  // assets and the computed capital + retained earnings is shown explicitly.
  const netAssets = {
    current: totalAssets.current - totalLiabilities.current,
    prior: totalAssets.prior - totalLiabilities.prior,
  };
  const balancing = {
    current: netAssets.current - cur.capital - cur.retainedEarnings,
    prior: netAssets.prior - pri.capital - pri.retainedEarnings,
  };

  const equity: BalanceSheetLine[] = [
    { label: "Capital (per journals)", current: cur.capital, prior: pri.capital },
    { label: "Retained earnings (derived)", current: cur.retainedEarnings, prior: pri.retainedEarnings, derived: true },
    { label: "Balancing adjustment", current: balancing.current, prior: balancing.prior, derived: true },
  ];

  return {
    currentAsOf: curAsOf.toISOString(),
    priorAsOf: priAsOf.toISOString(),
    assets,
    liabilities,
    equity,
    totals: { assets: totalAssets, liabilities: totalLiabilities, equity: netAssets },
  };
}

// ── Cash Flow (indirect, period movement) ───────────────────────────────────────

export interface CashFlowLine {
  label: string;
  current: number;
  prior: number;
  derived?: boolean;
}

export interface CashFlowSection {
  title: string;
  lines: CashFlowLine[];
  subtotal: { current: number; prior: number };
}

export interface CashFlowReport {
  sections: CashFlowSection[];
  netChange: { current: number; prior: number };
  openingCash: { current: number; prior: number };
  closingCash: { current: number; prior: number };
  unexplained: { current: number; prior: number };
}

interface CashFlowColumn {
  operating: { netProfit: number; depreciation: number; dAR: number; dInv: number; dAP: number; subtotal: number };
  investing: { assetPurchases: number; subtotal: number };
  financing: { movement: number; subtotal: number };
  netChange: number;
  openingCash: number;
  closingCash: number;
  unexplained: number;
}

async function cashFlowForPeriod(period: Period): Promise<CashFlowColumn> {
  const opening = new Date(period.from.getTime() - 1); // just before the period
  const closing = period.to;

  const [
    profitBeforeDep,
    posOpen,
    posClose,
    ppeOpen,
    ppeClose,
    jOpen,
    jClose,
    assetBuys,
  ] = await Promise.all([
    operatingProfitForPeriod(period),
    Promise.all([receivablesAsOf(opening), inventoryValueAsOf(opening), payablesAsOf(opening), cashAsOf(opening)]),
    Promise.all([receivablesAsOf(closing), inventoryValueAsOf(closing), payablesAsOf(closing), cashAsOf(closing)]),
    fixedAssetsNetAsOf(opening),
    fixedAssetsNetAsOf(closing),
    journalClassBalancesAsOf(opening),
    journalClassBalancesAsOf(closing),
    prisma.fixedAsset.aggregate({
      _sum: { purchasePrice: true },
      where: { deletedAt: null, purchaseDate: { gte: period.from, lte: period.to } },
    }),
  ]);

  const [arOpen, invOpen, apOpen, cashOpen] = posOpen;
  const [arClose, invClose, apClose, cashClose] = posClose;

  const depreciation = ppeClose.accumulated - ppeOpen.accumulated;
  const netProfit = profitBeforeDep - depreciation; // profit after the non-cash charge
  const dAR = arClose - arOpen;
  const dInv = invClose - invOpen;
  const dAP = apClose - apOpen;
  const operatingSubtotal = netProfit + depreciation - dAR - dInv + dAP;

  const assetPurchases = DEC(assetBuys._sum.purchasePrice);
  const investingSubtotal = -assetPurchases;

  // Financing = change in journalled liabilities (class 2) + equity (class 3).
  const finOpen = (jOpen[2] ?? 0) + (jOpen[3] ?? 0);
  const finClose = (jClose[2] ?? 0) + (jClose[3] ?? 0);
  const financingMovement = finClose - finOpen;

  const netChange = operatingSubtotal + investingSubtotal + financingMovement;
  const cashMovement = cashClose - cashOpen;

  return {
    operating: { netProfit, depreciation, dAR, dInv, dAP, subtotal: operatingSubtotal },
    investing: { assetPurchases, subtotal: investingSubtotal },
    financing: { movement: financingMovement, subtotal: financingMovement },
    netChange,
    openingCash: cashOpen,
    closingCash: cashClose,
    unexplained: cashMovement - netChange,
  };
}

export async function getCashFlow(periods: ComparePeriods): Promise<CashFlowReport> {
  const [cur, pri] = await Promise.all([
    cashFlowForPeriod(periods.current),
    cashFlowForPeriod(periods.prior),
  ]);

  const sections: CashFlowSection[] = [
    {
      title: "Cash flow from operating activities",
      lines: [
        { label: "Net profit for the period", current: cur.operating.netProfit, prior: pri.operating.netProfit },
        { label: "Add: Depreciation", current: cur.operating.depreciation, prior: pri.operating.depreciation },
        { label: "(Increase)/decrease in receivables", current: -cur.operating.dAR, prior: -pri.operating.dAR },
        { label: "(Increase)/decrease in inventory", current: -cur.operating.dInv, prior: -pri.operating.dInv },
        { label: "Increase/(decrease) in payables", current: cur.operating.dAP, prior: pri.operating.dAP },
      ],
      subtotal: { current: cur.operating.subtotal, prior: pri.operating.subtotal },
    },
    {
      title: "Cash flow from investing activities",
      lines: [
        { label: "Purchase of fixed assets", current: cur.investing.subtotal, prior: pri.investing.subtotal },
      ],
      subtotal: { current: cur.investing.subtotal, prior: pri.investing.subtotal },
    },
    {
      title: "Cash flow from financing activities",
      lines: [
        { label: "Loans & capital movements (per journals)", current: cur.financing.subtotal, prior: pri.financing.subtotal },
      ],
      subtotal: { current: cur.financing.subtotal, prior: pri.financing.subtotal },
    },
  ];

  return {
    sections,
    netChange: { current: cur.netChange, prior: pri.netChange },
    openingCash: { current: cur.openingCash, prior: pri.openingCash },
    closingCash: { current: cur.closingCash, prior: pri.closingCash },
    unexplained: { current: cur.unexplained, prior: pri.unexplained },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Revenue By Product
// ─────────────────────────────────────────────────────────────────────────────

export interface RevenueByProductRow {
  name: string;
  orders: number;
  qty: number;
  revenue: number;
  productCost: number;
  deliveryCost: number;
  waybill: number;
  adsSpend: number;
}

export async function getRevenueByProduct(period: Period): Promise<RevenueByProductRow[]> {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: REVENUE_STATUSES as any },
      deletedAt: null,
      date: { gte: period.from, lte: period.to },
    },
    select: {
      id: true,
      deliveryFee: true,
      items: {
        select: {
          quantity: true,
          lineTotal: true,
          costPriceAtSale: true,
          product: { select: { id: true, name: true, costPrice: true } },
        },
      },
    },
  });

  type Acc = {
    name: string;
    orderIds: Set<string>;
    qty: number;
    revenue: number;
    productCost: number;
    deliveryCost: number;
  };
  const byProduct = new Map<string, Acc>();
  for (const o of orders) {
    // Distribute order's delivery fee proportionally to each line's revenue
    const orderRevenue = o.items.reduce((s, it) => s + DEC(it.lineTotal), 0) || 1;
    for (const it of o.items) {
      const key = it.product.id;
      const acc = byProduct.get(key) ?? {
        name: it.product.name,
        orderIds: new Set<string>(),
        qty: 0,
        revenue: 0,
        productCost: 0,
        deliveryCost: 0,
      };
      acc.orderIds.add(o.id);
      acc.qty += it.quantity;
      acc.revenue += DEC(it.lineTotal);
      // Prefer the cost snapshotted at sale time; fall back to the product's
      // current cost price when no snapshot was recorded (older orders default
      // costPriceAtSale to 0, which made Product Cost always show 0).
      const unitCost = DEC(it.costPriceAtSale) > 0 ? DEC(it.costPriceAtSale) : DEC(it.product.costPrice);
      acc.productCost += it.quantity * unitCost;
      acc.deliveryCost += DEC(o.deliveryFee) * (DEC(it.lineTotal) / orderRevenue);
      byProduct.set(key, acc);
    }
  }

  // Ads spend: pull from Expense rows in marketing-like categories, allocate by revenue share.
  const adsTotal = await prisma.expense.aggregate({
    where: {
      date: { gte: period.from, lte: period.to },
      expenseCategory: { name: { contains: "Marketing", mode: "insensitive" } },
    },
    _sum: { amount: true },
  });
  const adsSum = DEC(adsTotal._sum.amount);

  // Logistics costs come from PAYMENT settlement adjustments — the same source
  // as the Delivery Tracker — so this report stays in sync with it. The per-agent
  // adjustment totals are pooled for the period and allocated to products by
  // revenue share (same allocation used for ads spend).
  //   • Delivery Cost = per-order delivery fees + (Delivery-fee + Miscellaneous) adjustments
  //   • Waybill       = Waybill adjustments
  const adjustments = await prisma.settlementAdjustment.groupBy({
    by: ["paymentType"],
    where: {
      adjustmentType: "PAYMENT",
      paymentType: { in: ["Waybill", "Miscellaneous", "Delivery fee"] },
      date: { gte: period.from, lte: period.to },
    },
    _sum: { amount: true },
  });
  let waybillAdjSum = 0;
  let miscAdjSum = 0;
  let deliveryFeeAdjSum = 0;
  for (const adj of adjustments) {
    const amt = DEC(adj._sum.amount);
    if (adj.paymentType === "Waybill") waybillAdjSum = amt;
    else if (adj.paymentType === "Miscellaneous") miscAdjSum = amt;
    else if (adj.paymentType === "Delivery fee") deliveryFeeAdjSum = amt;
  }
  const deliveryAdjPool = deliveryFeeAdjSum + miscAdjSum;

  const totalRevenue = [...byProduct.values()].reduce((s, p) => s + p.revenue, 0) || 1;

  return [...byProduct.values()]
    .map(p => {
      const revenueShare = p.revenue / totalRevenue;
      return {
        name: p.name,
        orders: p.orderIds.size,
        qty: p.qty,
        revenue: p.revenue,
        productCost: p.productCost,
        deliveryCost: p.deliveryCost + deliveryAdjPool * revenueShare,
        waybill: waybillAdjSum * revenueShare,
        adsSpend: adsSum * revenueShare,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory Valuation
// ─────────────────────────────────────────────────────────────────────────────

export interface InventoryValuationRow {
  name: string;
  unit: string;
  openingStock: number;
  purchased: number;
  sold: number;
  unitCost: number;
}

export async function getInventoryValuation(period: Period): Promise<InventoryValuationRow[]> {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      unit: true,
      costPrice: true,
      stockMovementItems: {
        select: {
          quantity: true,
          stockMovement: { select: { type: true, date: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return products.map(p => {
    let opening = 0;
    let purchased = 0;
    let sold = 0;
    for (const item of p.stockMovementItems) {
      const t = item.stockMovement.type;
      const d = item.stockMovement.date;
      const sign = t === "OUTGOING" ? -1 : 1;
      if (d < period.from) {
        opening += item.quantity * sign;
      } else if (d <= period.to) {
        if (t === "INCOMING" || t === "RETURN") purchased += item.quantity;
        else if (t === "OUTGOING") sold += item.quantity;
      }
    }
    return {
      name: p.name,
      unit: p.unit ?? "Units",
      openingStock: Math.max(0, opening),
      purchased,
      sold,
      unitCost: DEC(p.costPrice),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Expense Ledger
// ─────────────────────────────────────────────────────────────────────────────

export interface ExpenseLedgerRow {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMode: string;
  referenceNo: string;
  approvedBy: string;
}

export async function getExpenseLedgerReport(period: Period): Promise<ExpenseLedgerRow[]> {
  const expenses = await prisma.expense.findMany({
    where: { date: { gte: period.from, lte: period.to } },
    include: {
      expenseCategory: true,
      paidFromAccount: true,
      createdBy: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });

  return expenses.map((e, idx) => ({
    id: idx + 1,
    date: e.date.toISOString().slice(0, 10),
    category: e.expenseCategory.name,
    description: e.notes ?? "—",
    amount: DEC(e.amount),
    paymentMode: e.paidFromAccount.type || e.paidFromAccount.name,
    referenceNo: e.referenceNumber,
    approvedBy: e.createdBy?.name ?? "—",
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Delivery Tracker
// ─────────────────────────────────────────────────────────────────────────────

export interface DeliveryTrackerRow {
  id: number;
  agentName: string;
  stateRegion: string;
  productDelivered: string;
  orders: number;
  qtyDelivered: number;
  deliveryCost: number;
  waybill: number;
  miscellaneous: number;
  totalLogisticsCost: number;
  revenueAttributed: number;
}

export async function getDeliveryTrackerReport(period: Period): Promise<DeliveryTrackerRow[]> {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: REVENUE_STATUSES as any },
      deletedAt: null,
      agentId: { not: null },
      date: { gte: period.from, lte: period.to },
    },
    select: {
      agentId: true,
      netAmount: true,
      deliveryFee: true,
      items: {
        select: {
          quantity: true,
          product: { select: { name: true } },
        },
      },
      agent: { select: { id: true, companyName: true, state: true } },
    },
  });

  type Acc = {
    agentId: string;
    agentName: string;
    stateRegion: string;
    orderIds: Set<string>;
    qty: number;
    revenue: number;
    deliveryFee: number;
    productCounts: Map<string, number>;
  };
  const byAgent = new Map<string, Acc>();

  let idx = 0;
  for (const o of orders) {
    if (!o.agent) continue;
    const key = o.agent.id;
    const acc = byAgent.get(key) ?? {
      agentId: o.agent.id,
      agentName: o.agent.companyName,
      stateRegion: o.agent.state ?? "—",
      orderIds: new Set<string>(),
      qty: 0,
      revenue: 0,
      deliveryFee: 0,
      productCounts: new Map<string, number>(),
    };
    acc.orderIds.add(String(idx++));
    for (const it of o.items) {
      acc.qty += it.quantity;
      const pn = it.product.name;
      acc.productCounts.set(pn, (acc.productCounts.get(pn) ?? 0) + it.quantity);
    }
    acc.revenue += DEC(o.netAmount);
    acc.deliveryFee += DEC(o.deliveryFee);
    byAgent.set(key, acc);
  }

  // Waybill, miscellaneous AND manual delivery-fee logistics costs are recorded
  // as PAYMENT settlement adjustments against the agent. Compound them per agent
  // for the period. (OVERPAYMENT/refund rows are excluded — they aren't logistics
  // costs even when their paymentType field happens to read "Waybill".)
  // Manual "Delivery fee" payments are added on top of the per-order delivery
  // fees (Order.deliveryFee) in the Delivery Cost column, so a delivery fee
  // entered via Settlement Adjustment shows up here just like waybill/misc.
  const adjustments = await prisma.settlementAdjustment.groupBy({
    by: ["agentId", "paymentType"],
    where: {
      adjustmentType: "PAYMENT",
      paymentType: { in: ["Waybill", "Miscellaneous", "Delivery fee"] },
      date: { gte: period.from, lte: period.to },
    },
    _sum: { amount: true },
  });
  const waybillByAgent = new Map<string, number>();
  const miscByAgent = new Map<string, number>();
  const deliveryFeeAdjByAgent = new Map<string, number>();
  for (const adj of adjustments) {
    const amt = DEC(adj._sum.amount);
    if (adj.paymentType === "Waybill") waybillByAgent.set(adj.agentId, amt);
    else if (adj.paymentType === "Miscellaneous") miscByAgent.set(adj.agentId, amt);
    else if (adj.paymentType === "Delivery fee") deliveryFeeAdjByAgent.set(adj.agentId, amt);
  }

  return [...byAgent.values()]
    .map((a, i) => {
      const topProduct = [...a.productCounts.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? "—";
      const waybill = waybillByAgent.get(a.agentId) ?? 0;
      const miscellaneous = miscByAgent.get(a.agentId) ?? 0;
      // Delivery Cost = per-order delivery fees + manual delivery-fee adjustments.
      const deliveryCost = a.deliveryFee + (deliveryFeeAdjByAgent.get(a.agentId) ?? 0);
      return {
        id: i + 1,
        agentName: a.agentName,
        stateRegion: a.stateRegion,
        productDelivered: topProduct,
        orders: a.orderIds.size,
        qtyDelivered: a.qty,
        deliveryCost,
        waybill,
        miscellaneous,
        totalLogisticsCost: deliveryCost + waybill + miscellaneous,
        revenueAttributed: a.revenue,
      };
    })
    .sort((a, b) => b.revenueAttributed - a.revenueAttributed);
}

// ─────────────────────────────────────────────────────────────────────────────
// Period helpers
// ─────────────────────────────────────────────────────────────────────────────

export function monthRange(date: Date): Period {
  const from = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { from, to };
}

export function previousMonthRange(date: Date): Period {
  const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return monthRange(prev);
}
