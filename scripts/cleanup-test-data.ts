/**
 * scripts/cleanup-test-data.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE-OFF PRODUCTION CLEANUP — remove build-phase TEST data.
 *
 * Confirmed against the live data (see scripts/inspect-*.ts findings):
 *   • 28 test orders dated BEFORE 24 Aug 2026 (Jul 8 – Aug 13) inflate revenue /
 *     net-profit on the accounting + admin dashboards.
 *   • 5 test agent-remittances inflate cash / receivables: one linked to a test
 *     order, and FOUR flagged `{"demo":true}` totalling ₦1,535,000.
 *   • ALL 61 stock movements are dated 24 Aug 2026 — the REAL go-live inventory.
 *     There is NO pre-cutoff stock to delete. Ghost stock (e.g. the "Charleson"
 *     test agent's 20 unbacked units) is fixed by RECALCULATING stock levels from
 *     the surviving real movements — never by deleting movements.
 *
 * What this script does (owner-approved):
 *   1. Delete the 28 pre-cutoff orders + everything attached (items cascade,
 *      invoices, deliveries, pick-packs, message refs, order notifications).
 *   2. Delete the test agent subledger: every settlement linked to a test order
 *      OR flagged demo, their ledger entries, and any linked adjustments.
 *   3. Recalculate ALL stock levels from surviving (real, 24-Aug) movements —
 *      drops ghost stock, keeps real inventory. (Charleson ends at 16 real units.)
 *
 * Agent / product / customer / user ACCOUNTS are kept. Expenses / salaries /
 * assets / POs are NOT deleted (only reported).
 *
 * SAFE BY DEFAULT: no flags → READ-ONLY dry-run. It writes only when BOTH:
 *     --confirm                 (CLI flag)
 *     CLEANUP_ACK=I_UNDERSTAND  (env var)
 *
 * Usage:
 *   node --env-file=.env --import tsx scripts/cleanup-test-data.ts             # dry-run
 *   CLEANUP_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/cleanup-test-data.ts --confirm
 *   ...add --soft-orders to set deletedAt on orders instead of hard-deleting.
 *
 * ⚠  BACK UP FIRST (Neon branch / pg_dump). The subledger deletes and the stock
 *    recalculation cannot be undone without a restore point taken beforehand.
 */
import { prisma } from "@/lib/db/prisma";
import { withoutCameraAudit } from "@/lib/audit/context";
import { rebuildStockLevels } from "@/modules/inventory/services/stock-level.service";

// 24 Aug 2026 00:00 in Nigeria (WAT, UTC+1, no DST) == 23 Aug 2026 23:00 UTC.
const CUTOFF = new Date("2026-08-23T23:00:00.000Z");

const CONFIRM = process.argv.includes("--confirm");
const SOFT_ORDERS = process.argv.includes("--soft-orders");
const ACK = process.env.CLEANUP_ACK === "I_UNDERSTAND";
const CHUNK = 500;

// ── helpers ──────────────────────────────────────────────────────────────────
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function countOverChunks(ids: string[], fn: (c: string[]) => Promise<number>): Promise<number> {
  let total = 0;
  for (const c of chunk(ids, CHUNK)) total += await fn(c);
  return total;
}

async function deleteOverChunks(ids: string[], fn: (c: string[]) => Promise<{ count: number }>): Promise<number> {
  let total = 0;
  for (const c of chunk(ids, CHUNK)) total += (await fn(c)).count;
  return total;
}

/** Order-identifying tokens (ids OR numbers) from an ordersJson ARRAY. */
function tokensFromOrdersJson(j: unknown): string[] {
  if (!Array.isArray(j)) return [];
  const out: string[] = [];
  for (const el of j) {
    if (typeof el === "string") out.push(el);
    else if (el && typeof el === "object") {
      const o = el as Record<string, unknown>;
      for (const v of [o.id, o.orderId, o.orderNumber]) if (typeof v === "string") out.push(v);
    }
  }
  return out;
}

/** True when ordersJson is the demo marker `{"demo":true}`. */
function isDemoOrdersJson(j: unknown): boolean {
  return !!j && typeof j === "object" && !Array.isArray(j) && (j as Record<string, unknown>).demo === true;
}

function dbHost(): string {
  const raw = process.env.DATABASE_URL ?? "";
  try {
    return new URL(raw).host;
  } catch {
    return raw.replace(/\/\/[^@]*@/, "//***@").slice(0, 60) || "unknown";
  }
}

const iso = (d: Date) => d.toISOString();

type SelectedRow = { id: string; reason: "order" | "demo"; agent: string; remitted: number };
type SubPlan = {
  settlements: SelectedRow[];
  adjustmentIds: string[];
  mixedSettlements: { id: string; agent: string; inSet: number; outSet: number }[];
};

/**
 * Which agent settlements / adjustments are test data. A settlement is selected
 * when it is flagged demo, OR references at least one test order and none outside
 * the set. Settlements that mix test + real orders are flagged, never auto-deleted.
 */
async function planSubledger(orderIds: string[], orderNumbers: string[]): Promise<SubPlan> {
  const idSet = new Set(orderIds);
  const numSet = new Set(orderNumbers);
  const inSet = (t: string) => idSet.has(t) || numSet.has(t);

  const settlements = await prisma.agentSettlement.findMany({
    select: { id: true, ordersJson: true, totalRemitted: true, agent: { select: { companyName: true } } },
  });
  const selected: SelectedRow[] = [];
  const mixedSettlements: SubPlan["mixedSettlements"] = [];
  for (const s of settlements) {
    const agent = s.agent.companyName;
    const remitted = Number(s.totalRemitted);
    if (isDemoOrdersJson(s.ordersJson)) {
      selected.push({ id: s.id, reason: "demo", agent, remitted });
      continue;
    }
    const toks = tokensFromOrdersJson(s.ordersJson);
    const hit = toks.filter(inSet).length;
    const miss = toks.filter((t) => !inSet(t)).length;
    if (hit > 0 && miss === 0) selected.push({ id: s.id, reason: "order", agent, remitted });
    else if (hit > 0 && miss > 0) mixedSettlements.push({ id: s.id, agent, inSet: hit, outSet: miss });
  }

  const adjustments = await prisma.settlementAdjustment.findMany({ select: { id: true, ordersJson: true } });
  const adjustmentIds: string[] = [];
  for (const a of adjustments) {
    if (isDemoOrdersJson(a.ordersJson)) {
      adjustmentIds.push(a.id);
      continue;
    }
    const toks = tokensFromOrdersJson(a.ordersJson);
    if (toks.some(inSet) && !toks.some((t) => !inSet(t))) adjustmentIds.push(a.id);
  }

  return { settlements: selected, adjustmentIds, mixedSettlements };
}

async function main() {
  console.log("═".repeat(78));
  console.log("  NUCLE CRM — build-phase test-data cleanup");
  console.log("═".repeat(78));
  console.log(`  Database host : ${dbHost()}`);
  console.log(`  Cutoff (UTC)  : ${iso(CUTOFF)}  (== 2026-08-24 00:00 WAT)`);
  console.log(`  Order mode    : ${SOFT_ORDERS ? "SOFT delete (set deletedAt)" : "HARD delete"}`);
  console.log(`  Confirm flag  : ${CONFIRM}   Ack env: ${ACK}`);
  console.log("─".repeat(78));

  // ── Test orders (dated before cutoff) ──────────────────────────────────────
  const orders = await prisma.order.findMany({
    where: { date: { lt: CUTOFF } },
    select: { id: true, orderNumber: true, status: true, date: true },
    orderBy: { date: "asc" },
  });
  const orderIds = orders.map((o) => o.id);
  const orderNumbers = orders.map((o) => o.orderNumber);
  const histogram = orders.reduce<Record<string, number>>((a, o) => ((a[o.status] = (a[o.status] ?? 0) + 1), a), {});

  console.log(`ORDERS to remove (date < cutoff): ${orders.length}`);
  for (const [s, n] of Object.entries(histogram)) console.log(`    ${s.padEnd(10)} ${n}`);

  const [orderItems, deliveries, invoices, pickPacks, messageRefs, notifications] = await Promise.all([
    countOverChunks(orderIds, (c) => prisma.orderItem.count({ where: { orderId: { in: c } } })),
    countOverChunks(orderIds, (c) => prisma.delivery.count({ where: { orderId: { in: c } } })),
    countOverChunks(orderIds, (c) => prisma.invoice.count({ where: { orderId: { in: c } } })),
    countOverChunks(orderIds, (c) => prisma.pickPack.count({ where: { orderId: { in: c } } })),
    countOverChunks(orderIds, (c) => prisma.messageOrderRef.count({ where: { orderId: { in: c } } })),
    countOverChunks(orderIds, (c) => prisma.notification.count({ where: { entityType: "Order", entityId: { in: c } } })),
  ]);
  console.log("ATTACHED ORDER RECORDS:");
  console.log(`    OrderItem (cascades)        ${orderItems}`);
  console.log(`    Delivery                    ${deliveries}`);
  console.log(`    Invoice (+items cascade)    ${invoices}`);
  console.log(`    PickPack (by order)         ${pickPacks}`);
  console.log(`    MessageOrderRef             ${messageRefs}`);
  console.log(`    Notification (Order)        ${notifications}`);

  // ── Test subledger (order-linked + demo remittances) ───────────────────────
  const sub = await planSubledger(orderIds, orderNumbers);
  const settlementIds = sub.settlements.map((s) => s.id);
  const ledgerByOrder = await countOverChunks(orderNumbers, (c) =>
    prisma.agentLedgerEntry.count({ where: { referenceId: { in: c } } })
  );
  const ledgerBySettlement = await countOverChunks(settlementIds, (c) =>
    prisma.agentLedgerEntry.count({ where: { settlementId: { in: c } } })
  );
  const demoTotal = sub.settlements.filter((s) => s.reason === "demo").reduce((n, s) => n + s.remitted, 0);
  console.log("AGENT SUBLEDGER to remove:");
  for (const s of sub.settlements)
    console.log(`    settlement [${s.reason}] ${s.agent.padEnd(28)} ₦${s.remitted.toLocaleString()}  ${s.id}`);
  console.log(`    → settlements=${settlementIds.length} (demo total ₦${demoTotal.toLocaleString()})  adjustments=${sub.adjustmentIds.length}`);
  console.log(`    → ledger entries: by order#=${ledgerByOrder}, by settlement=${ledgerBySettlement}`);
  if (sub.mixedSettlements.length) {
    console.log("  ⚠  MIXED settlements (test + real orders) — NOT auto-deleted, review manually:");
    for (const m of sub.mixedSettlements) console.log(`       ${m.id} ${m.agent} in=${m.inSet} out=${m.outSet}`);
  }

  // ── Stock: informational only. Movements are NOT deleted (all real go-live). ─
  const moveCount = await prisma.stockMovement.count();
  const moveDates = await prisma.stockMovement.aggregate({ _min: { date: true }, _max: { date: true } });
  const preCutoffMoves = await prisma.stockMovement.count({ where: { date: { lt: CUTOFF } } });
  console.log("─".repeat(78));
  console.log("STOCK (movements are KEPT — real go-live inventory; levels get recalculated):");
  console.log(`    StockMovements total        ${moveCount}  (dated ${moveDates._min.date ? iso(moveDates._min.date).slice(0, 10) : "-"} … ${moveDates._max.date ? iso(moveDates._max.date).slice(0, 10) : "-"})`);
  console.log(`    …of which BEFORE cutoff     ${preCutoffMoves}  (would be deleted — expected 0)`);
  await reportStock("STOCK LEVELS (before recalculation):");

  const [expenses, salaries, assets, pos] = await Promise.all([
    prisma.expense.count({ where: { date: { lt: CUTOFF } } }).catch(() => -1),
    prisma.salaryRecord.count({ where: { createdAt: { lt: CUTOFF } } }).catch(() => -1),
    prisma.fixedAsset.count({ where: { createdAt: { lt: CUTOFF } } }).catch(() => -1),
    prisma.purchaseOrder.count({ where: { createdAt: { lt: CUTOFF } } }).catch(() => -1),
  ]);
  console.log("NOT DELETED (reported only — handle separately if these were also test):");
  console.log(`    Expense ${expenses}   SalaryRecord ${salaries}   FixedAsset ${assets}   PurchaseOrder ${pos}`);
  console.log("═".repeat(78));

  // ── Gate ───────────────────────────────────────────────────────────────────
  if (!(CONFIRM && ACK)) {
    console.log("DRY RUN — no changes were made.");
    if (CONFIRM && !ACK) console.log("  (--confirm given but CLEANUP_ACK=I_UNDERSTAND is not set.)");
    console.log("  To execute: CLEANUP_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/cleanup-test-data.ts --confirm");
    return;
  }

  console.log("EXECUTING — writing changes…");
  await withoutCameraAudit(async () => {
    // 1. Subledger (ledger before settlements — settlementId FK is Restrict).
    const delLedger =
      (await deleteOverChunks(orderNumbers, (c) => prisma.agentLedgerEntry.deleteMany({ where: { referenceId: { in: c } } }))) +
      (await deleteOverChunks(settlementIds, (c) => prisma.agentLedgerEntry.deleteMany({ where: { settlementId: { in: c } } })));
    const delSettlements = await deleteOverChunks(settlementIds, (c) => prisma.agentSettlement.deleteMany({ where: { id: { in: c } } }));
    const delAdjustments = await deleteOverChunks(sub.adjustmentIds, (c) => prisma.settlementAdjustment.deleteMany({ where: { id: { in: c } } }));
    console.log(`  ledger=${delLedger} settlements=${delSettlements} adjustments=${delAdjustments}`);

    // 2. Order children with Restrict FKs (must precede the order delete).
    const delInvoices = await deleteOverChunks(orderIds, (c) => prisma.invoice.deleteMany({ where: { orderId: { in: c } } })); // items cascade
    const delDeliveries = await deleteOverChunks(orderIds, (c) => prisma.delivery.deleteMany({ where: { orderId: { in: c } } }));
    const delPickPacks = await deleteOverChunks(orderIds, (c) => prisma.pickPack.deleteMany({ where: { orderId: { in: c } } }));
    const delMsgRefs = await deleteOverChunks(orderIds, (c) => prisma.messageOrderRef.deleteMany({ where: { orderId: { in: c } } }));
    const delNotifs = await deleteOverChunks(orderIds, (c) => prisma.notification.deleteMany({ where: { entityType: "Order", entityId: { in: c } } }));
    console.log(`  invoices=${delInvoices} deliveries=${delDeliveries} pickpacks=${delPickPacks} messageRefs=${delMsgRefs} notifications=${delNotifs}`);

    // 3. Orders (OrderItem cascades on hard delete).
    if (SOFT_ORDERS) {
      const soft = await deleteOverChunks(orderIds, (c) => prisma.order.updateMany({ where: { id: { in: c } }, data: { deletedAt: new Date() } }));
      console.log(`  orders soft-deleted=${soft}`);
    } else {
      const hard = await deleteOverChunks(orderIds, (c) => prisma.order.deleteMany({ where: { id: { in: c } } }));
      console.log(`  orders hard-deleted=${hard}`);
    }

    // 4. Recalculate stock from surviving (real) movements — removes ghost stock.
    const rebuilt = await rebuildStockLevels();
    console.log(`  stock levels recalculated: ${rebuilt.rows} rows`);
  });

  // ── Verify ─────────────────────────────────────────────────────────────────
  console.log("─".repeat(78));
  console.log("VERIFICATION:");
  await verify(orderIds, orderNumbers, settlementIds);
  await reportStock("STOCK LEVELS (after recalculation):");
  console.log("═".repeat(78));
  console.log("Done.");
}

/** Print warehouse/agent stock totals + the Charleson test agent's balance. */
async function reportStock(title: string) {
  const byKind = await prisma.stockLevel.groupBy({ by: ["locationKind"], _sum: { quantity: true } });
  console.log(title);
  for (const g of byKind) console.log(`    ${String(g.locationKind).padEnd(12)} ${g._sum.quantity ?? 0} units`);
  try {
    const charlesons = await prisma.agent.findMany({
      where: { companyName: { contains: "charleson", mode: "insensitive" } },
      select: { id: true, companyName: true },
    });
    for (const a of charlesons) {
      const agg = await prisma.stockLevel.aggregate({ _sum: { quantity: true }, where: { locationKind: "AGENT", locationId: a.id } });
      console.log(`    [Charleson] ${a.companyName}: ${agg._sum.quantity ?? 0} units`);
    }
    if (charlesons.length === 0) console.log("    [Charleson] no agent matched 'charleson'");
  } catch {
    console.log("    [Charleson] lookup skipped");
  }
}

async function verify(orderIds: string[], orderNumbers: string[], settlementIds: string[]) {
  const pass = (label: string, ok: boolean, detail: string) => console.log(`    ${ok ? "PASS" : "FAIL"}  ${label} — ${detail}`);

  const revenue = await prisma.order.aggregate({
    _sum: { netAmount: true },
    where: { status: "DELIVERED", deletedAt: null, date: { lt: CUTOFF } },
  });
  pass("pre-cutoff delivered revenue is 0", Number(revenue._sum.netAmount ?? 0) === 0, `₦${Number(revenue._sum.netAmount ?? 0)}`);

  const remainingOrders = SOFT_ORDERS
    ? await prisma.order.count({ where: { date: { lt: CUTOFF }, deletedAt: null } })
    : await prisma.order.count({ where: { date: { lt: CUTOFF } } });
  pass("no active pre-cutoff orders remain", remainingOrders === 0, `${remainingOrders} left`);

  const attached =
    (await countOverChunks(orderIds, (c) => prisma.delivery.count({ where: { orderId: { in: c } } }))) +
    (await countOverChunks(orderIds, (c) => prisma.invoice.count({ where: { orderId: { in: c } } }))) +
    (await countOverChunks(orderNumbers, (c) => prisma.agentLedgerEntry.count({ where: { referenceId: { in: c } } })));
  pass("attached order rows removed", attached === 0, `${attached} left`);

  const settlementsLeft = await countOverChunks(settlementIds, (c) => prisma.agentSettlement.count({ where: { id: { in: c } } }));
  pass("test settlements removed", settlementsLeft === 0, `${settlementsLeft} left`);
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
