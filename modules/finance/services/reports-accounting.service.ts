import { prisma } from "@/lib/db/prisma";

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
// Profit & Loss
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfitAndLossReport {
  revenue: NamedAmount[];
  costOfSales: NamedAmount[];
  operatingExpenses: NamedAmount[];
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
      product: { select: { id: true, name: true, costPrice: true } },
    },
  });

  const byProduct = new Map<string, { name: string; revenue: number; cost: number }>();
  for (const it of items) {
    const key = it.product.id;
    const entry = byProduct.get(key) ?? { name: it.product.name, revenue: 0, cost: 0 };
    entry.revenue += DEC(it.lineTotal);
    entry.cost += it.quantity * DEC(it.product.costPrice);
    byProduct.set(key, entry);
  }
  return byProduct;
}

async function getOpexByCategory(period: Period) {
  const rows = await prisma.expense.groupBy({
    by: ["expenseCategoryId"],
    where: { date: { gte: period.from, lte: period.to } },
    _sum: { amount: true },
  });
  const ids = rows.map(r => r.expenseCategoryId);
  const cats = ids.length
    ? await prisma.expenseCategory.findMany({ where: { id: { in: ids } } })
    : [];
  const nameOf = new Map(cats.map(c => [c.id, c.name]));
  const result = new Map<string, number>();
  for (const r of rows) {
    const name = nameOf.get(r.expenseCategoryId) ?? "Uncategorized";
    result.set(name, (result.get(name) ?? 0) + DEC(r._sum.amount));
  }
  return result;
}

export async function getProfitAndLoss(periods: ComparePeriods): Promise<ProfitAndLossReport> {
  const [curProd, priProd, curOpex, priOpex] = await Promise.all([
    getProductPnL(periods.current),
    getProductPnL(periods.prior),
    getOpexByCategory(periods.current),
    getOpexByCategory(periods.prior),
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

  const opexNames = new Set<string>([...curOpex.keys(), ...priOpex.keys()]);
  const operatingExpenses: NamedAmount[] = [...opexNames]
    .map(name => ({ name, current: curOpex.get(name) ?? 0, prior: priOpex.get(name) ?? 0 }))
    .sort((a, b) => b.current - a.current);

  const sum = (arr: NamedAmount[], k: "current" | "prior") => arr.reduce((s, r) => s + r[k], 0);
  const totRev = { current: sum(revenue, "current"), prior: sum(revenue, "prior") };
  const totCos = { current: sum(costOfSales, "current"), prior: sum(costOfSales, "prior") };
  const grossProfit = { current: totRev.current - totCos.current, prior: totRev.prior - totCos.prior };
  const totOpex = { current: sum(operatingExpenses, "current"), prior: sum(operatingExpenses, "prior") };
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
// Balance Sheet — partial (cash, AR, inventory, AP proxy; PP&E/loans = 0)
// ─────────────────────────────────────────────────────────────────────────────

export interface BalanceSheetReport {
  currentAssets: NamedAmount[];
  nonCurrentAssets: NamedAmount[];
  currentLiabilities: NamedAmount[];
  nonCurrentLiabilities: NamedAmount[];
  equity: NamedAmount[];
}

async function computeCashAndBank(asOf: Date) {
  // Sum of journal entry debits-credits for accounts whose name matches a payment account.
  // Falls back to 0 if no journals exist.
  const accounts = await prisma.paymentAccount.findMany({ where: { isActive: true } });
  if (accounts.length === 0) return 0;
  const names = accounts.map(a => a.name);
  const db = prisma as any;
  const rows = await db.journalEntryRow.findMany({
    where: {
      account: { in: names },
      journalEntry: { date: { lte: asOf } },
    },
    select: { debits: true, credits: true },
  });
  return rows.reduce((s: number, r: any) => s + DEC(r.debits) - DEC(r.credits), 0);
}

async function computeReceivables(asOf: Date) {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["SENT", "OVERDUE"] },
      invoiceDate: { lte: asOf },
    },
    select: { invoiceTotal: true },
  });
  return invoices.reduce((s, i) => s + DEC(i.invoiceTotal), 0);
}

async function computeInventoryValue(asOf: Date) {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      costPrice: true,
      stockMovementItems: {
        where: { stockMovement: { date: { lte: asOf } } },
        select: {
          quantity: true,
          stockMovement: { select: { type: true } },
        },
      },
    },
  });
  let total = 0;
  for (const p of products) {
    let qty = 0;
    for (const item of p.stockMovementItems) {
      const t = item.stockMovement.type;
      qty += item.quantity * (t === "INCOMING" ? 1 : t === "OUTGOING" ? -1 : 1);
    }
    total += Math.max(0, qty) * DEC(p.costPrice);
  }
  return total;
}

async function computePayables(asOf: Date) {
  // Proxy: total of expenses recorded in the period (no AP tracking yet).
  // Returning 0 until we have a real AP workflow.
  return 0;
}

export async function getBalanceSheet(periods: { currentAsOf: Date; priorAsOf: Date }): Promise<BalanceSheetReport> {
  const [cashC, cashP, arC, arP, invC, invP, apC, apP] = await Promise.all([
    computeCashAndBank(periods.currentAsOf),
    computeCashAndBank(periods.priorAsOf),
    computeReceivables(periods.currentAsOf),
    computeReceivables(periods.priorAsOf),
    computeInventoryValue(periods.currentAsOf),
    computeInventoryValue(periods.priorAsOf),
    computePayables(periods.currentAsOf),
    computePayables(periods.priorAsOf),
  ]);

  // Net profit for equity — sum revenue − cogs − opex over a long window ending at asOf
  // (treat the period as YTD ending at currentAsOf vs priorAsOf for simplicity)
  const epoch = new Date(0);
  const pnlCur = await getProfitAndLoss({
    current: { from: epoch, to: periods.currentAsOf },
    prior: { from: epoch, to: periods.priorAsOf },
  });
  const netProfit = pnlCur.totals.operatingProfit;

  return {
    currentAssets: [
      { name: "Cash & Bank Balances", current: cashC, prior: cashP },
      { name: "Accounts Receivable (Trade Debtors)", current: arC, prior: arP },
      { name: "Inventory — Finished Goods", current: invC, prior: invP },
      { name: "Prepaid Expenses", current: 0, prior: 0 },
      { name: "Other Current Assets", current: 0, prior: 0 },
    ],
    nonCurrentAssets: [
      { name: "Property, Plant & Equipment (Cost)", current: 0, prior: 0 },
      { name: "Less: Accumulated Depreciation", current: 0, prior: 0 },
      { name: "Intangible Assets (Branding / IP)", current: 0, prior: 0 },
      { name: "Long-term Deposits", current: 0, prior: 0 },
    ],
    currentLiabilities: [
      { name: "Accounts Payable (Trade Creditors)", current: apC, prior: apP },
      { name: "Accrued Expenses", current: 0, prior: 0 },
      { name: "Deferred Revenue", current: 0, prior: 0 },
      { name: "VAT / Tax Payable", current: 0, prior: 0 },
      { name: "Short-term Loans", current: 0, prior: 0 },
    ],
    nonCurrentLiabilities: [
      { name: "Long-term Loans / Borrowings", current: 0, prior: 0 },
      { name: "Deferred Tax Liability", current: 0, prior: 0 },
    ],
    equity: [
      { name: "Share Capital", current: 0, prior: 0 },
      { name: "Retained Earnings (Opening)", current: 0, prior: 0 },
      { name: "Net Profit / (Loss) for Period", current: netProfit.current, prior: netProfit.prior },
      { name: "Other Comprehensive Income", current: 0, prior: 0 },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cash Flow — indirect, partial
// ─────────────────────────────────────────────────────────────────────────────

export interface CashFlowReport {
  operating: NamedAmount[];
  investing: NamedAmount[];
  financing: NamedAmount[];
  openingCash: { current: number; prior: number };
  closingCash: { current: number; prior: number };
}

export async function getCashFlow(periods: ComparePeriods): Promise<CashFlowReport> {
  const pnl = await getProfitAndLoss(periods);

  const openingCurr = await computeCashAndBank(periods.current.from);
  const closingCurr = await computeCashAndBank(periods.current.to);
  const openingPrior = await computeCashAndBank(periods.prior.from);
  const closingPrior = await computeCashAndBank(periods.prior.to);

  // Inventory change (negative = cash outflow when inventory grows)
  const invOpenCurr = await computeInventoryValue(periods.current.from);
  const invCloseCurr = await computeInventoryValue(periods.current.to);
  const invOpenPrior = await computeInventoryValue(periods.prior.from);
  const invClosePrior = await computeInventoryValue(periods.prior.to);

  // Receivables change
  const arOpenCurr = await computeReceivables(periods.current.from);
  const arCloseCurr = await computeReceivables(periods.current.to);
  const arOpenPrior = await computeReceivables(periods.prior.from);
  const arClosePrior = await computeReceivables(periods.prior.to);

  const operating: NamedAmount[] = [
    {
      name: "Net Profit / (Loss) Before Tax",
      current: pnl.totals.operatingProfit.current,
      prior: pnl.totals.operatingProfit.prior,
    },
    { name: "Add: Depreciation & Amortisation", current: 0, prior: 0 },
    {
      name: "(Increase) / Decrease in Inventory",
      current: -(invCloseCurr - invOpenCurr),
      prior: -(invClosePrior - invOpenPrior),
    },
    {
      name: "(Increase) / Decrease in Receivables",
      current: -(arCloseCurr - arOpenCurr),
      prior: -(arClosePrior - arOpenPrior),
    },
    { name: "Increase / (Decrease) in Payables", current: 0, prior: 0 },
    { name: "Increase / (Decrease) in Accruals", current: 0, prior: 0 },
    { name: "Tax Paid", current: 0, prior: 0 },
  ];

  return {
    operating,
    investing: [
      { name: "Purchase of Equipment / Machinery", current: 0, prior: 0 },
      { name: "Proceeds from Asset Disposal", current: 0, prior: 0 },
      { name: "Investment in R&D", current: 0, prior: 0 },
    ],
    financing: [
      { name: "Proceeds from Loans / Borrowings", current: 0, prior: 0 },
      { name: "Repayment of Loans", current: 0, prior: 0 },
      { name: "Capital Injection by Owners", current: 0, prior: 0 },
      { name: "Dividends Paid", current: 0, prior: 0 },
    ],
    openingCash: { current: openingCurr, prior: openingPrior },
    closingCash: { current: closingCurr, prior: closingPrior },
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
      acc.productCost += it.quantity * DEC(it.product.costPrice);
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

  const waybillTotal = await prisma.expense.aggregate({
    where: {
      date: { gte: period.from, lte: period.to },
      expenseCategory: { name: { contains: "Waybill", mode: "insensitive" } },
    },
    _sum: { amount: true },
  });
  const waybillSum = DEC(waybillTotal._sum.amount);

  const totalRevenue = [...byProduct.values()].reduce((s, p) => s + p.revenue, 0) || 1;

  return [...byProduct.values()]
    .map(p => ({
      name: p.name,
      orders: p.orderIds.size,
      qty: p.qty,
      revenue: p.revenue,
      productCost: p.productCost,
      deliveryCost: p.deliveryCost,
      waybill: waybillSum * (p.revenue / totalRevenue),
      adsSpend: adsSum * (p.revenue / totalRevenue),
    }))
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
      unit: "Units",
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

  return [...byAgent.values()]
    .map((a, i) => {
      const topProduct = [...a.productCounts.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? "—";
      return {
        id: i + 1,
        agentName: a.agentName,
        stateRegion: a.stateRegion,
        productDelivered: topProduct,
        orders: a.orderIds.size,
        qtyDelivered: a.qty,
        deliveryCost: a.deliveryFee,
        waybill: 0,
        miscellaneous: 0,
        totalLogisticsCost: a.deliveryFee,
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
