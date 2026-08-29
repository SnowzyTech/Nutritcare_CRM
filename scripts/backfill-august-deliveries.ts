/**
 * scripts/backfill-august-deliveries.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Follow-up to scripts/import-august-orders.ts. Makes the delivery-agent overview
 * and agent stock reflect the imported orders:
 *   1. Create a Delivery record for every imported order that has an agent and is
 *      DELIVERED (→ status DELIVERED, deliveredTime = order date) or CONFIRMED
 *      (→ status PENDING_DISPATCH, scheduledTime = order date).
 *   2. Recalculate stock levels (rebuildStockLevels) so DELIVERED orders deduct
 *      their units from the assigned agent's balance. Full recompute → no double-count.
 *
 * Does NOT create agent remittance/ledger entries (that stays a separate step).
 * Idempotent: orders that already have a Delivery are skipped. Writes wrapped in
 * withoutCameraAudit(). Only acts on orders tagged "[imp:aug2026:...]".
 *
 * SAFE BY DEFAULT — dry-run unless BOTH:  --commit  AND  BACKFILL_ACK=I_UNDERSTAND
 *   node --env-file=.env --import tsx scripts/backfill-august-deliveries.ts            # dry-run
 *   BACKFILL_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/backfill-august-deliveries.ts --commit
 */

import dns from "node:dns";
{
  const resolver = new dns.Resolver();
  resolver.setServers(["8.8.8.8", "8.8.4.4"]);
  const orig = dns.lookup.bind(dns);
  // @ts-expect-error override the overloaded lookup
  dns.lookup = (hostname: string, options: unknown, cb?: unknown) => {
    let opts = options as { all?: boolean } | ((...a: unknown[]) => void);
    let callback = cb as ((...a: unknown[]) => void) | undefined;
    if (typeof options === "function") { callback = options as (...a: unknown[]) => void; opts = {}; }
    const all = !!(opts as { all?: boolean }).all;
    resolver.resolve4(hostname, (err, addrs) => {
      if (!err && addrs && addrs.length) {
        if (all) return callback!(null, addrs.map((a) => ({ address: a, family: 4 })));
        return callback!(null, addrs[0], 4);
      }
      return (orig as (...a: unknown[]) => void)(hostname, opts, callback);
    });
  };
}

import { prisma } from "@/lib/db/prisma";
import { withoutCameraAudit } from "@/lib/audit/context";
import { rebuildStockLevels } from "@/modules/inventory/services/stock-level.service";

const IMPORT_TAG = "imp:aug2026";
const COMMIT = process.argv.includes("--commit");
const ACK = process.env.BACKFILL_ACK === "I_UNDERSTAND";

async function agentUnits(): Promise<number> {
  const a = await prisma.stockLevel.aggregate({ _sum: { quantity: true }, where: { locationKind: "AGENT" } });
  return Number(a._sum.quantity ?? 0);
}

async function main() {
  const bar = "═".repeat(78);
  console.log(bar);
  console.log("  Backfill August delivery records + stock recalculation");
  console.log(`  Mode: ${COMMIT && ACK ? "LIVE (writing)" : "DRY-RUN (no writes)"}`);
  console.log(bar);

  // Imported orders that need a Delivery: has an agent, DELIVERED/CONFIRMED, no delivery yet.
  const orders = await prisma.order.findMany({
    where: {
      notes: { contains: `[${IMPORT_TAG}:` },
      agentId: { not: null },
      status: { in: ["DELIVERED", "CONFIRMED"] },
      deliveries: { none: {} },
    },
    select: { id: true, agentId: true, status: true, date: true },
  });

  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const confirmed = orders.filter((o) => o.status === "CONFIRMED");
  console.log(`Orders needing a delivery record: ${orders.length}`);
  console.log(`   DELIVERED (→ DELIVERED, deliveredTime=order date): ${delivered.length}`);
  console.log(`   CONFIRMED (→ PENDING_DISPATCH, scheduledTime=order date): ${confirmed.length}`);
  const beforeUnits = await agentUnits();
  console.log(`Agent stock now: ${beforeUnits} units. After recalc, delivered units get deducted.`);

  if (!(COMMIT && ACK)) {
    console.log("─".repeat(78));
    console.log("DRY RUN — nothing written.");
    console.log("  To run: BACKFILL_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/backfill-august-deliveries.ts --commit");
    return;
  }

  console.log("─".repeat(78));
  console.log("WRITING…");
  await withoutCameraAudit(async () => {
    if (orders.length > 0) {
      const res = await prisma.delivery.createMany({
        data: orders.map((o) => ({
          orderId: o.id,
          agentId: o.agentId!,
          status: o.status === "DELIVERED" ? ("DELIVERED" as const) : ("PENDING_DISPATCH" as const),
          deliveredTime: o.status === "DELIVERED" ? o.date : null,
          scheduledTime: o.status === "CONFIRMED" ? o.date : null,
        })),
      });
      console.log(`  delivery records created: ${res.count}`);
    } else {
      console.log("  no delivery records needed (already present).");
    }
    const rebuilt = await rebuildStockLevels();
    console.log(`  stock levels recalculated: ${rebuilt.rows} rows`);
  });

  const afterUnits = await agentUnits();
  const deliveriesTotal = await prisma.delivery.count();
  console.log("─".repeat(78));
  console.log(`Agent stock: ${beforeUnits} → ${afterUnits} units (deducted ${beforeUnits - afterUnits}).`);
  console.log(`Total delivery records in DB: ${deliveriesTotal}`);
  console.log(bar);
  console.log("Done.");
}

main()
  .catch((e) => { console.error("Backfill failed:", e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
