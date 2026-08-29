/**
 * Seeds a reviewable two-month accounting dataset onto STAGING so the accounting
 * module can be walked through with the accountants (chart of accounts → expense
 * entry → journal → reports).
 *
 * Periods: prior = July 2026, current = August 2026.
 *
 * Run:  npm run db:seed:accounting-demo
 * Undo: npm run db:seed:accounting-demo -- --undo
 *
 * Idempotent: a seed run removes any previous demo rows first, so re-running
 * never duplicates.
 *
 * Two kinds of change are made, and --undo treats them differently:
 *
 *   FIXES (kept on undo) — these are blockers, not demo data:
 *     • PaymentAccounts restored + opening balances set (expense entry is
 *       impossible without at least one: `paidFromAccountId` is required).
 *     • accountingPermissions granted to the accountants (positive-grant model:
 *       an empty list means they cannot open /accounting/reports at all).
 *     • Product.costPrice + OrderItem.costPriceAtSale backfilled (all were 0,
 *       so Cost of Sales / margin / inventory value all read zero).
 *
 *   DEMO DATA (removed on undo) — tagged so it can always be identified:
 *     • Expenses            notes starts with  "[DEMO]"
 *     • Journal entries     row description starts with "[DEMO]"
 *     • Fixed assets        description starts with "[DEMO]"
 *     • Salary records      remark starts with "[DEMO]"
 *     • Invoices            invoiceNumber starts with "INV-DEMO-"
 *     • Purchase orders     poNumber starts with "PO-DEMO-"
 *     • Settlements         ordersJson.demo === true
 *     • Ledger entries      referenceId starts with "DEMO-"
 *     • Adjustments         note starts with "[DEMO]"
 *     • The 8 orders in DEMO_ORDERS are flipped to DELIVERED and restored to
 *       their exact original status/date/agent/fee on undo.
 *
 * Note this script uses its own un-extended PrismaClient (same as seed-coa.ts),
 * so the audit camera does not log thousands of seed rows into audit_logs.
 */

import { PrismaClient } from "@prisma/client";

// ── Same Neon-aware client logic as lib/db/prisma.ts / prisma/seed-coa.ts ──────
function createClient() {
  const url = process.env.DATABASE_URL ?? "";
  if (url.includes("neon.tech")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool, neonConfig } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require("@prisma/adapter-neon");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    neonConfig.webSocketConstructor = require("ws");
    const pool = new Pool({ connectionString: url });
    return new PrismaClient({ adapter: new PrismaNeon(pool) } as never);
  }
  return new PrismaClient();
}

const prisma = createClient() as PrismaClient;

const DEMO = "[DEMO]";
const d = (iso: string) => new Date(`${iso}T10:00:00.000Z`);

// ── Payment accounts (names must match prisma/seed-coa.ts) ────────────────────
// Opening balances represent cash accumulated BEFORE the demo window. They are
// deliberately large relative to the two demo months: staging holds only a
// 28-order test sales book (~₦1.4m of delivered revenue) against realistic
// Nigerian expense magnitudes, so without a real opening cash position the cash
// flow statement closes tens of millions negative. There is no UI for these
// fields — cashAsOf() in reports-accounting.service.ts is their only reader.
const PAYMENT_ACCOUNTS = [
  { name: "Zenith Bank — Operations Account", type: "BANK", openingBalance: 40_000_000 },
  { name: "Moniepoint Account — Revenue Account", type: "BANK", openingBalance: 10_000_000 },
  { name: "Petty Cash", type: "CASH", openingBalance: 500_000 },
];
const OPENING_AS_OF = d("2026-06-30");

// ── Placeholder cost prices (~45% of selling price) — STAGING TEST VALUES ─────
const COST_PRICES: Record<string, number> = {
  "Neuro-vive balm": 11_000,
  "After-natal": 13_000,
  "Trim and Tone": 13_000,
  "Klinka {ProsXact}": 16_000,
  "EL-Mana Multipurpose Spice Powder": 8_000,
};

// ── Orders flipped to DELIVERED, with their exact original values for undo ────
const DEMO_ORDERS = [
  { id: "cmsene3c50003shlk9yv3co3k", no: "ELMAN-001", newDate: d("2026-07-08"), origDate: "2026-08-04T12:42:10.661Z" },
  { id: "cmsepd48r00031hf2128t42t4", no: "ELMAN-004", newDate: d("2026-07-11"), origDate: "2026-08-04T13:37:24.411Z" },
  { id: "cmsepdgg00009v57qb9gr7ozd", no: "ELMAN-007", newDate: d("2026-07-18"), origDate: "2026-08-04T13:37:40.225Z" },
  { id: "cmsepea3d0011v57q1mqzojk8", no: "ELMAN-011", newDate: d("2026-07-24"), origDate: "2026-08-04T13:38:18.649Z" },
  { id: "cmserk9zx000nfnrswmrp8o0f", no: "ELMAN-014", newDate: d("2026-08-03"), origDate: "2026-08-04T14:38:57.693Z" },
  { id: "cmserkzpg0017fnrsu7wxij11", no: "ELMAN-016", newDate: d("2026-08-06"), origDate: "2026-08-04T14:39:31.012Z" },
  { id: "cmseskao7001ivgq6e9vcuwuj", no: "AFTER-001", newDate: d("2026-08-11"), origDate: "2026-08-04T15:06:58.183Z" },
  { id: "cmsesm0og0003tgi17oiwvuvm", no: "AFTER-002", newDate: d("2026-08-13"), origDate: "2026-08-04T15:08:18.544Z" },
];
// All eight are currently status PENDING, agentId NULL, deliveryFee 0.
const ORIG_STATUS = "PENDING" as const;
const ORIG_DELIVERY_FEE = 0;

// ── Expenses, keyed by real COA account code ──────────────────────────────────
interface DemoLine { description: string; quantity: number; amount: number; tax?: number }
interface DemoExpense { code: string; date: string; account: number; lines: DemoLine[]; supplier?: boolean }

const DEMO_EXPENSES: DemoExpense[] = [
  // ── July 2026 (prior period) ──
  { code: "6001", date: "2026-07-03", account: 1, lines: [{ description: "Facebook ad spend — week 1", quantity: 1, amount: 450_000 }] },
  { code: "6001", date: "2026-07-17", account: 1, lines: [{ description: "Facebook ad spend — week 3", quantity: 1, amount: 380_000 }] },
  { code: "6010", date: "2026-07-09", account: 0, lines: [{ description: "Courier waybills — July batch 1", quantity: 1, amount: 125_000 }], supplier: true },
  { code: "6020", date: "2026-07-31", account: 0, lines: [{ description: "Sales rep commission — July", quantity: 1, amount: 96_000 }] },
  { code: "6100", date: "2026-07-28", account: 0, lines: [{ description: "July payroll — net pay", quantity: 1, amount: 1_850_000 }] },
  { code: "6110", date: "2026-07-28", account: 0, lines: [{ description: "Employer pension — July", quantity: 1, amount: 148_000 }] },
  { code: "6200", date: "2026-07-01", account: 0, lines: [{ description: "Office rent — July", quantity: 1, amount: 600_000 }] },
  { code: "6240", date: "2026-07-05", account: 2, lines: [{ description: "Office internet — July", quantity: 1, amount: 45_000, tax: 3_375 }] },
  {
    code: "6250", date: "2026-07-12", account: 2, lines: [
      { description: "Diesel — generator", quantity: 3, amount: 18_000 },
      { description: "Fuel — delivery van", quantity: 2, amount: 12_000 },
      { description: "Fuel — field staff", quantity: 1, amount: 10_000 },
    ],
  },
  { code: "6220", date: "2026-07-20", account: 2, lines: [{ description: "Stationery & printing", quantity: 1, amount: 62_500, tax: 4_687.5 }] },
  { code: "7002", date: "2026-07-31", account: 0, lines: [{ description: "Bank charges & COT — July", quantity: 1, amount: 18_400 }] },
  { code: "6402", date: "2026-07-15", account: 0, lines: [{ description: "Consumer survey — new SKU", quantity: 1, amount: 150_000 }], supplier: true },

  // ── August 2026 (current period) ──
  { code: "6001", date: "2026-08-02", account: 1, lines: [{ description: "Facebook ad spend — week 1", quantity: 1, amount: 520_000 }] },
  { code: "6001", date: "2026-08-09", account: 1, lines: [{ description: "Facebook ad spend — week 2", quantity: 1, amount: 610_000 }] },
  { code: "6004", date: "2026-08-06", account: 1, lines: [{ description: "Creative design & ad tooling", quantity: 1, amount: 75_000 }] },
  { code: "6010", date: "2026-08-05", account: 0, lines: [{ description: "Courier waybills — August batch 1", quantity: 1, amount: 143_500 }], supplier: true },
  { code: "6020", date: "2026-08-12", account: 0, lines: [{ description: "Sales rep commission — August (part)", quantity: 1, amount: 112_000 }] },
  { code: "6100", date: "2026-08-12", account: 0, lines: [{ description: "August payroll — net pay", quantity: 1, amount: 1_920_000 }] },
  { code: "6110", date: "2026-08-12", account: 0, lines: [{ description: "Employer pension — August", quantity: 1, amount: 153_600 }] },
  { code: "6120", date: "2026-08-08", account: 0, lines: [{ description: "Sales training workshop", quantity: 1, amount: 85_000 }] },
  { code: "6200", date: "2026-08-01", account: 0, lines: [{ description: "Office rent — August", quantity: 1, amount: 600_000 }] },
  { code: "6210", date: "2026-08-07", account: 2, lines: [{ description: "Office repairs & cleaning", quantity: 1, amount: 54_000 }] },
  {
    code: "6250", date: "2026-08-10", account: 2, lines: [
      { description: "Diesel — generator", quantity: 4, amount: 18_500 },
      { description: "Fuel — delivery van", quantity: 1, amount: 22_500 },
    ],
  },
  { code: "6280", date: "2026-08-13", account: 2, lines: [{ description: "Sundry office expenses", quantity: 1, amount: 37_800, tax: 2_835 }] },
  { code: "6290", date: "2026-08-04", account: 0, lines: [{ description: "NAFDAC renewal & compliance filing", quantity: 1, amount: 210_000 }] },
  { code: "6401", date: "2026-08-11", account: 0, lines: [{ description: "Formulation R&D — batch trials", quantity: 1, amount: 320_000 }], supplier: true },
  { code: "7002", date: "2026-08-13", account: 0, lines: [{ description: "Bank charges & transfer fees — August", quantity: 1, amount: 21_300 }] },

  // ── Balance-sheet classes booked through Expense Entry (classes 1, 2, 3).
  //    This is how expensesByAccountClassAsOf() sources the SoFP — worth showing
  //    the accountants explicitly and asking whether it is acceptable to them.
  { code: "1301", date: "2026-07-01", account: 0, lines: [{ description: "Prepaid rent — 6 months in advance", quantity: 1, amount: 1_200_000 }] },
  { code: "1403", date: "2026-07-04", account: 0, lines: [{ description: "Warehouse security deposit", quantity: 1, amount: 350_000 }] },
  { code: "2303", date: "2026-08-05", account: 0, lines: [{ description: "PAYE remittance payable — July", quantity: 1, amount: 268_000 }] },
  { code: "2304", date: "2026-08-05", account: 0, lines: [{ description: "Pension payable to PFA — July", quantity: 1, amount: 153_600 }] },
  { code: "3001", date: "2026-07-01", account: 0, lines: [{ description: "Additional share capital injected", quantity: 1, amount: 5_000_000 }] },
];

// ── Journal entries. `account` = ExpenseCategory.name, `name` = ExpenseName.name
//    (free-text snapshots — they must match the chart exactly or the account
//    drill-down cannot find them). Resolved from the COA codes below.
interface DemoJournal { date: string; memo: string; rows: { code: string; debit?: number; credit?: number }[] }

const DEMO_JOURNALS: DemoJournal[] = [
  { date: "2026-07-01", memo: "Six months office rent paid in advance", rows: [{ code: "1301", debit: 1_200_000 }, { code: "1002", credit: 1_200_000 }] },
  { date: "2026-07-05", memo: "Purchase of delivery van", rows: [{ code: "1504", debit: 8_500_000 }, { code: "1002", credit: 8_500_000 }] },
  { date: "2026-07-28", memo: "July payroll accrual", rows: [{ code: "6101", debit: 1_850_000 }, { code: "2101", credit: 1_850_000 }] },
  { date: "2026-07-31", memo: "PAYE deducted from July payroll", rows: [{ code: "2101", debit: 268_000 }, { code: "2303", credit: 268_000 }] },
  { date: "2026-08-01", memo: "August share of prepaid rent expensed", rows: [{ code: "6200", debit: 200_000 }, { code: "1301", credit: 200_000 }] },
  { date: "2026-08-05", memo: "Facebook ad spend settled from Moniepoint", rows: [{ code: "6001", debit: 520_000 }, { code: "1003", credit: 520_000 }] },
  { date: "2026-08-12", memo: "Monthly depreciation charge", rows: [{ code: "6300", debit: 143_750 }, { code: "1600", credit: 143_750 }] },
  { date: "2026-08-13", memo: "Bank charges for August", rows: [{ code: "7002", debit: 21_300 }, { code: "1002", credit: 21_300 }] },
  // Deliberately UNBALANCED (debit 75,000 vs credit 50,000). The app does not
  // enforce debits == credits — this row exists so the accountants can see that
  // for themselves rather than take it on trust.
  { date: "2026-08-14", memo: "UNBALANCED ON PURPOSE — petty cash reimbursement", rows: [{ code: "6270", debit: 75_000 }, { code: "1001", credit: 50_000 }] },
];

// ── Fixed assets ──────────────────────────────────────────────────────────────
const DEMO_ASSETS = [
  { assetName: "Toyota Hiace delivery van (LAG-472-KJA)", purchasePrice: 8_500_000, purchaseDate: "2026-07-05", usefulLifeYears: 8, salvageValue: 850_000, assetCode: "1504" },
  { assetName: "Staff laptops (4 units)", purchasePrice: 1_600_000, purchaseDate: "2026-07-15", usefulLifeYears: 4, salvageValue: 100_000, assetCode: "1503" },
  { assetName: "Office furniture & fittings — HQ", purchasePrice: 950_000, purchaseDate: "2026-08-03", usefulLifeYears: 5, salvageValue: 50_000, assetCode: "1502" },
  { assetName: "Powder blending machine", purchasePrice: 3_200_000, purchaseDate: "2026-08-08", usefulLifeYears: 10, salvageValue: 300_000, assetCode: "1501" },
  { assetName: "Warehouse lease deposit (non-depreciable)", purchasePrice: 1_500_000, purchaseDate: "2026-07-02", usefulLifeYears: null, salvageValue: 0, assetCode: "1800", nonDepreciable: true },
];

// ── Payroll ───────────────────────────────────────────────────────────────────
const DEMO_SALARIES = [
  { company: "Nucle", name: "Chinaza Okeke", department: "Sales", designation: "Sales Rep", level: "SR2", basic: 180_000, housing: 60_000, transport: 40_000, wardrobe: 15_000, utility: 20_000, date: "2026-07-28" },
  { company: "Nucle", name: "Ifeanyi Umeh", department: "Sales", designation: "Sales Rep", level: "SR1", basic: 150_000, housing: 50_000, transport: 35_000, wardrobe: 12_000, utility: 18_000, date: "2026-07-28" },
  { company: "Nucle", name: "Amaka Eze", department: "Logistics", designation: "Logistics Officer", level: "L2", basic: 165_000, housing: 55_000, transport: 45_000, wardrobe: 12_000, utility: 18_000, date: "2026-07-28" },
  { company: "Nucle", name: "Tunde Bakare", department: "Warehouse", designation: "Warehouse Supervisor", level: "W3", basic: 200_000, housing: 70_000, transport: 45_000, wardrobe: 15_000, utility: 22_000, date: "2026-07-28" },
  { company: "Nutriticare", name: "Blessing Adeyemi", department: "Accounts", designation: "Accountant", level: "A3", basic: 240_000, housing: 80_000, transport: 50_000, wardrobe: 18_000, utility: 25_000, date: "2026-07-28" },
  { company: "Nucle", name: "Chinaza Okeke", department: "Sales", designation: "Sales Rep", level: "SR2", basic: 180_000, housing: 60_000, transport: 40_000, wardrobe: 15_000, utility: 20_000, date: "2026-08-12" },
  { company: "Nucle", name: "Ifeanyi Umeh", department: "Sales", designation: "Sales Rep", level: "SR1", basic: 150_000, housing: 50_000, transport: 35_000, wardrobe: 12_000, utility: 18_000, date: "2026-08-12" },
  { company: "Nucle", name: "Amaka Eze", department: "Logistics", designation: "Logistics Officer", level: "L2", basic: 165_000, housing: 55_000, transport: 45_000, wardrobe: 12_000, utility: 18_000, date: "2026-08-12" },
  { company: "Nutriticare", name: "Blessing Adeyemi", department: "Accounts", designation: "Accountant", level: "A3", basic: 240_000, housing: 80_000, transport: 50_000, wardrobe: 18_000, utility: 25_000, date: "2026-08-12" },
  { company: "Nutriticare", name: "Segun Falade", department: "Media", designation: "Media Buyer", level: "M2", basic: 220_000, housing: 70_000, transport: 45_000, wardrobe: 15_000, utility: 22_000, date: "2026-08-12" },
];

// ──────────────────────────────────────────────────────────────────────────────

async function undoDemo(): Promise<void> {
  const expenses = await prisma.expense.deleteMany({ where: { notes: { startsWith: DEMO } } });

  const journalIds = (
    await prisma.journalEntry.findMany({
      where: { rows: { some: { description: { startsWith: DEMO } } } },
      select: { id: true },
    })
  ).map((j) => j.id);
  await prisma.journalEntry.deleteMany({ where: { id: { in: journalIds } } });

  const assets = await prisma.fixedAsset.deleteMany({ where: { description: { startsWith: DEMO } } });
  const salaries = await prisma.salaryRecord.deleteMany({ where: { remark: { startsWith: DEMO } } });
  const invoices = await prisma.invoice.deleteMany({ where: { invoiceNumber: { startsWith: "INV-DEMO-" } } });
  const pos = await prisma.purchaseOrder.deleteMany({ where: { poNumber: { startsWith: "PO-DEMO-" } } });
  const adjustments = await prisma.settlementAdjustment.deleteMany({ where: { note: { startsWith: DEMO } } });

  // Ledger entries reference settlements, so they must go first.
  const ledger = await prisma.agentLedgerEntry.deleteMany({ where: { referenceId: { startsWith: "DEMO-" } } });
  const settlements = await prisma.agentSettlement.deleteMany({
    where: { ordersJson: { path: ["demo"], equals: true } },
  });

  for (const o of DEMO_ORDERS) {
    await prisma.order.updateMany({
      where: { id: o.id },
      data: {
        status: ORIG_STATUS,
        date: new Date(o.origDate),
        agentId: null,
        deliveryFee: ORIG_DELIVERY_FEE,
      },
    });
  }

  console.log(
    `  removed: ${expenses.count} expenses, ${journalIds.length} journals, ${assets.count} assets, ` +
      `${salaries.count} salaries, ${invoices.count} invoices, ${pos.count} POs, ` +
      `${settlements.count} settlements, ${ledger.count} ledger entries, ${adjustments.count} adjustments; ` +
      `restored ${DEMO_ORDERS.length} orders to ${ORIG_STATUS}`,
  );
}

async function applyFixes(): Promise<void> {
  // ── 1. Payment accounts (blocker: expense entry requires paidFromAccountId) ──
  for (const acc of PAYMENT_ACCOUNTS) {
    const existing = await prisma.paymentAccount.findFirst({ where: { name: acc.name } });
    if (existing) {
      await prisma.paymentAccount.update({
        where: { id: existing.id },
        data: { isActive: true, openingBalance: acc.openingBalance, openingBalanceAsOf: OPENING_AS_OF },
      });
    } else {
      await prisma.paymentAccount.create({
        data: {
          name: acc.name,
          type: acc.type,
          isActive: true,
          openingBalance: acc.openingBalance,
          openingBalanceAsOf: OPENING_AS_OF,
        },
      });
    }
  }
  console.log(`  payment accounts: ${PAYMENT_ACCOUNTS.length} present with opening balances as of ${OPENING_AS_OF.toDateString()}`);

  // ── 2. Accounting permissions (blocker: positive-grant, empty = no reports) ──
  const perms = ["FINANCIAL_SUMMARY", "INVENTORY_SNAPSHOT", "SALES_ANALYTICS", "SALARY", "REPORTS"];
  const granted = await prisma.user.updateMany({
    where: { role: "ACCOUNTANT" },
    data: { accountingPermissions: perms },
  });
  console.log(`  accounting permissions: granted all ${perms.length} keys to ${granted.count} accountant(s)`);

  // ── 3. Cost prices + costPriceAtSale backfill ───────────────────────────────
  const products = await prisma.product.findMany({ select: { id: true, name: true } });
  let backfilled = 0;
  for (const p of products) {
    const cost = COST_PRICES[p.name];
    if (cost === undefined) {
      console.warn(`  ! no placeholder cost price for product "${p.name}" — left unchanged`);
      continue;
    }
    await prisma.product.update({ where: { id: p.id }, data: { costPrice: cost } });
    const res = await prisma.orderItem.updateMany({
      where: { productId: p.id, costPriceAtSale: 0 },
      data: { costPriceAtSale: cost },
    });
    backfilled += res.count;
  }
  console.log(`  cost prices: ${products.length} products set, ${backfilled} order items backfilled (STAGING TEST VALUES)`);
}

async function main(): Promise<void> {
  const undoOnly = process.argv.includes("--undo");

  console.log(undoOnly ? "Removing accounting demo data…" : "Seeding accounting demo data…");
  await undoDemo();
  if (undoOnly) {
    console.log(
      "\nDone. Payment accounts, accounting permissions and cost prices were KEPT — " +
        "they are blocker fixes, not demo data.",
    );
    return;
  }

  await applyFixes();

  // ── Shared lookups ──────────────────────────────────────────────────────────
  const actor =
    (await prisma.user.findFirst({ where: { role: "ACCOUNTANT" }, select: { id: true, name: true } })) ??
    (await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" }, select: { id: true, name: true } }));
  if (!actor) throw new Error("No ACCOUNTANT or SUPER_ADMIN user to attribute demo rows to.");
  console.log(`  attributing demo rows to: ${actor.name}`);

  const coa = await prisma.expenseName.findMany({
    where: { code: { not: null } },
    select: { id: true, name: true, code: true, expenseCategoryId: true, expenseCategory: { select: { name: true } } },
  });
  const byCode = new Map(coa.map((a) => [a.code as string, a]));
  const account = (code: string) => {
    const a = byCode.get(code);
    if (!a) throw new Error(`COA account ${code} not found — run "npm run db:seed:coa" first.`);
    return a;
  };

  const payAccounts = await prisma.paymentAccount.findMany({ orderBy: { name: "asc" }, select: { id: true } });
  const supplier = await prisma.supplier.findFirst({ where: { deletedAt: null }, select: { id: true } });
  const agents = await prisma.agent.findMany({
    where: { deletedAt: null },
    take: 4,
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const products = await prisma.product.findMany({ select: { id: true, name: true, costPrice: true } });

  // ── Orders → DELIVERED (revenue for both periods, + delivery tracker) ───────
  for (const [i, o] of DEMO_ORDERS.entries()) {
    await prisma.order.update({
      where: { id: o.id },
      data: {
        status: "DELIVERED",
        date: o.newDate,
        agentId: agents.length ? agents[i % agents.length].id : null,
        deliveryFee: 4_000,
      },
    });
  }
  console.log(`  orders: ${DEMO_ORDERS.length} flipped to DELIVERED across Jul–Aug 2026`);

  // ── Expenses ────────────────────────────────────────────────────────────────
  // Keep the "EXP <n>" reference format — nextExpenseReference() strips non-digits
  // off the latest expense and adds 1, so any other format breaks the counter.
  const latest = await prisma.expense.findFirst({ orderBy: { createdAt: "desc" }, select: { referenceNumber: true } });
  let refNo = latest ? parseInt(latest.referenceNumber.replace(/\D/g, ""), 10) + 1 : 1;
  if (!Number.isFinite(refNo)) refNo = 1;

  for (const [i, e] of DEMO_EXPENSES.entries()) {
    const acct = account(e.code);
    const amount = e.lines.reduce((s, l) => s + l.amount * (l.quantity || 1), 0);
    const tax = e.lines.reduce((s, l) => s + (l.tax ?? 0), 0);
    await prisma.expense.create({
      data: {
        referenceNumber: `EXP ${refNo++}`,
        expenseCategoryId: acct.expenseCategoryId,
        expenseNameId: acct.id,
        paidFromAccountId: payAccounts[e.account % payAccounts.length].id,
        supplierId: e.supplier && supplier ? supplier.id : null,
        date: d(e.date),
        amount,
        tax,
        notes: `${DEMO} ${acct.name} — ${e.lines[0].description}`,
        createdById: actor.id,
        lineItems: {
          createMany: {
            data: e.lines.map((l) => ({
              description: l.description,
              quantity: l.quantity,
              amount: l.amount,
              tax: l.tax ?? 0,
            })),
          },
        },
      },
    });
    if (i === DEMO_EXPENSES.length - 1) console.log(`  expenses: ${DEMO_EXPENSES.length} created (refs EXP ${refNo - DEMO_EXPENSES.length}–EXP ${refNo - 1})`);
  }

  // ── Journal entries ─────────────────────────────────────────────────────────
  const lastJournal = await prisma.journalEntry.findFirst({ orderBy: { createdAt: "desc" }, select: { journalNo: true } });
  let journalNo = lastJournal ? parseInt(lastJournal.journalNo, 10) + 1 : 1000;
  if (!Number.isFinite(journalNo)) journalNo = 1000;

  for (const j of DEMO_JOURNALS) {
    const rows = j.rows.map((r) => {
      const acct = account(r.code);
      return {
        account: acct.expenseCategory.name,
        name: acct.name,
        debits: r.debit ?? 0,
        credits: r.credit ?? 0,
        description: `${DEMO} ${j.memo}`,
      };
    });
    await prisma.journalEntry.create({
      data: {
        journalNo: String(journalNo++),
        date: d(j.date),
        totalDebit: rows.reduce((s, r) => s + r.debits, 0),
        totalCredit: rows.reduce((s, r) => s + r.credits, 0),
        createdById: actor.id,
        rows: { create: rows },
      },
    });
  }
  console.log(`  journals: ${DEMO_JOURNALS.length} created (incl. 1 deliberately unbalanced) — journalNo ${journalNo - DEMO_JOURNALS.length}–${journalNo - 1}`);

  // ── Fixed assets ────────────────────────────────────────────────────────────
  const accumDep = account("1600");
  const depExp = account("6300");
  for (const a of DEMO_ASSETS) {
    const acct = account(a.assetCode);
    const nonDep = a.nonDepreciable === true;
    await prisma.fixedAsset.create({
      data: {
        assetName: a.assetName,
        description: `${DEMO} staging demo asset`,
        nonDepreciable: nonDep,
        purchasePrice: a.purchasePrice,
        purchaseDate: d(a.purchaseDate),
        depreciationStartDate: nonDep ? null : d(a.purchaseDate),
        depreciationMethod: nonDep ? null : "Straight Line",
        usefulLifeYears: nonDep ? null : a.usefulLifeYears,
        salvageValue: a.salvageValue,
        assetAccount: acct.name,
        assetAccountCode: acct.code,
        accumDepreciationAccount: nonDep ? null : accumDep.name,
        accumDepreciationCode: nonDep ? null : accumDep.code,
        depExpenseAccount: nonDep ? null : depExp.name,
        depExpenseCode: nonDep ? null : depExp.code,
        status: "Active",
        createdById: actor.id,
      },
    });
  }
  console.log(`  fixed assets: ${DEMO_ASSETS.length} created (4 depreciating, 1 non-depreciable)`);

  // ── Payroll ─────────────────────────────────────────────────────────────────
  for (const s of DEMO_SALARIES) {
    const grossPay = s.basic + s.housing;
    const grossPayTotal = grossPay + s.transport + s.wardrobe + s.utility;
    const paye = Math.round(grossPayTotal * 0.07);
    const pension = Math.round(s.basic * 0.08);
    const hmo = 10_000;
    const netPay = grossPayTotal - paye - pension - hmo;
    await prisma.salaryRecord.create({
      data: {
        company: s.company,
        name: s.name,
        department: s.department,
        designation: s.designation,
        level: s.level,
        amount: grossPayTotal,
        basic: s.basic,
        housingAllowance: s.housing,
        grossPay,
        transportation: s.transport,
        wardrobe: s.wardrobe,
        utilityAllowance: s.utility,
        grossPayTotal,
        paye,
        pension,
        hmo,
        otherDeduction: 0,
        netPay,
        bank: netPay,
        cash: 0,
        remark: `${DEMO} staging demo payroll`,
        date: d(s.date),
        createdById: actor.id,
      },
    });
  }
  console.log(`  salary records: ${DEMO_SALARIES.length} created across Nucle / Nutriticare`);

  // ── Invoices (linked to the delivered orders) ───────────────────────────────
  const deliveredOrders = await prisma.order.findMany({
    where: { id: { in: DEMO_ORDERS.map((o) => o.id) } },
    select: { id: true, customerId: true, date: true, netAmount: true, items: { select: { productId: true, quantity: true, lineTotal: true } } },
  });
  const invoiceStatuses = ["PAID", "SENT", "DRAFT", "PAID", "SENT"] as const;
  const invoiceTypes = ["INVOICE", "INVOICE", "INVOICE", "SALES_RECEIPT", "INVOICE"] as const;
  for (const [i, o] of deliveredOrders.slice(0, 5).entries()) {
    const subtotal = Number(o.netAmount);
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-DEMO-${String(i + 1).padStart(3, "0")}`,
        customerId: o.customerId,
        orderId: o.id,
        invoiceDate: o.date,
        dueDate: new Date(o.date.getTime() + 14 * 24 * 3600 * 1000),
        subtotal,
        invoiceTotal: subtotal,
        status: invoiceStatuses[i],
        type: invoiceTypes[i],
        terms: "Payment on delivery",
        createdById: actor.id,
        items: {
          create: o.items.map((it) => ({
            productId: it.productId,
            description: products.find((p) => p.id === it.productId)?.name ?? "Product",
            quantity: it.quantity,
            rate: it.quantity ? Number(it.lineTotal) / it.quantity : Number(it.lineTotal),
            amount: Number(it.lineTotal),
          })),
        },
      },
    });
  }
  console.log(`  invoices: ${Math.min(5, deliveredOrders.length)} created (DRAFT / SENT / PAID + 1 sales receipt)`);

  // ── Purchase orders (the balance sheet's accounts-payable proxy) ────────────
  if (supplier && products.length) {
    const poSpecs = [
      { date: "2026-07-06", items: [{ p: 0, qty: 200, cost: 8_000 }, { p: 1, qty: 120, cost: 11_000 }] },
      { date: "2026-07-22", items: [{ p: 2, qty: 150, cost: 13_000 }] },
      { date: "2026-08-04", items: [{ p: 3, qty: 100, cost: 16_000 }, { p: 4, qty: 80, cost: 13_000 }] },
      { date: "2026-08-11", items: [{ p: 0, qty: 250, cost: 8_000 }] },
    ];
    for (const [i, po] of poSpecs.entries()) {
      await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-DEMO-${String(i + 1).padStart(3, "0")}`,
          supplierId: supplier.id,
          status: i === poSpecs.length - 1 ? "PENDING" : "IN_TRANSIT",
          date: d(po.date),
          createdById: actor.id,
          items: {
            create: po.items
              .filter((it) => products[it.p])
              .map((it) => ({ productId: products[it.p].id, quantity: it.qty, unitCost: it.cost })),
          },
        },
      });
    }
    console.log(`  purchase orders: ${poSpecs.length} created (open — AP proxy on the balance sheet)`);
  } else {
    console.warn("  ! no supplier or products — purchase orders skipped");
  }

  // ── Agent settlements, ledger entries and adjustments ──────────────────────
  if (agents.length) {
    const settleSpecs = [
      { agent: 0, date: "2026-07-14", sales: 420_000, fees: 16_000, remitted: 404_000, bank: "MONIEPOINT" as const },
      { agent: 1, date: "2026-07-29", sales: 365_000, fees: 12_000, remitted: 353_000, bank: "ZENITH" as const },
      { agent: 2, date: "2026-08-07", sales: 512_000, fees: 20_000, remitted: 480_000, bank: "MONIEPOINT" as const },
      { agent: 3, date: "2026-08-12", sales: 298_000, fees: 12_000, remitted: 298_000, bank: "ZENITH" as const },
    ];
    for (const [i, s] of settleSpecs.entries()) {
      const agentId = agents[s.agent % agents.length].id;
      const balance = s.sales - s.fees - s.remitted;
      const settlement = await prisma.agentSettlement.create({
        data: {
          agentId,
          date: d(s.date),
          totalSalesValue: s.sales,
          deliveryFeesEarned: s.fees,
          totalRemitted: s.remitted,
          balance,
          underpayment: balance > 0 ? balance : 0,
          overpayment: balance < 0 ? -balance : 0,
          bank: s.bank,
          ordersJson: { demo: true },
        },
      });
      await prisma.agentLedgerEntry.create({
        data: {
          agentId,
          settlementId: settlement.id,
          date: d(s.date),
          referenceType: "DELIVERY_FEE",
          referenceId: `DEMO-SALE-${i + 1}`,
          debit: s.sales,
          credit: 0,
          runningBalance: s.sales,
        },
      });
      await prisma.agentLedgerEntry.create({
        data: {
          agentId,
          settlementId: settlement.id,
          date: d(s.date),
          referenceType: "REMITTANCE",
          referenceId: `DEMO-REM-${i + 1}`,
          debit: 0,
          credit: s.remitted,
          runningBalance: s.sales - s.remitted,
        },
      });
    }

    // PAYMENT adjustments — the source of logistics cost on both the Delivery
    // Tracker and Revenue by Product. paymentType must be one of these three.
    const adjSpecs = [
      { agent: 0, date: "2026-07-14", type: "Waybill", amount: 42_000 },
      { agent: 1, date: "2026-07-29", type: "Delivery fee", amount: 28_000 },
      { agent: 2, date: "2026-08-07", type: "Waybill", amount: 51_500 },
      { agent: 2, date: "2026-08-07", type: "Miscellaneous", amount: 14_000 },
      { agent: 3, date: "2026-08-12", type: "Delivery fee", amount: 33_000 },
    ];
    for (const [i, a] of adjSpecs.entries()) {
      await prisma.settlementAdjustment.create({
        data: {
          agentId: agents[a.agent % agents.length].id,
          date: d(a.date),
          adjustmentType: "PAYMENT",
          linkedReferenceId: `DEMO-ADJ-${i + 1}`,
          paymentType: a.type,
          amount: a.amount,
          amountRemitted: a.amount,
          autoRunningBalance: 0,
          note: `${DEMO} staging demo logistics cost`,
          createdById: actor.id,
        },
      });
    }
    console.log(`  settlements: ${settleSpecs.length} (with bank set) + ${settleSpecs.length * 2} ledger entries + ${adjSpecs.length} adjustments`);
  } else {
    console.warn("  ! no agents — settlements, ledger entries and adjustments skipped");
  }

  console.log("\nDone. Review at ?current=2026-08&prior=2026-07");
  console.log("Undo with:  npm run db:seed:accounting-demo -- --undo");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
