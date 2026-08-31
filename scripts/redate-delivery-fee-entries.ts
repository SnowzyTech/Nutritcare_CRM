/**
 * scripts/redate-delivery-fee-entries.ts
 * Re-dates existing DELIVERY_FEE ("Agent Funding") ledger entries from the order's
 * original date to the ACTUAL delivery date (from the order's "Delivered" audit
 * log), matching the code fix that now dates new funding entries on delivery day.
 * Only touches entries whose date differs from the delivery date. No other fields.
 *
 *   node --env-file=.env --import tsx scripts/redate-delivery-fee-entries.ts            # dry-run
 *   REDATE_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/redate-delivery-fee-entries.ts --commit
 */
import dns from "node:dns";
{
  const resolver = new dns.Resolver();
  resolver.setServers(["8.8.8.8", "8.8.4.4"]);
  const orig = dns.lookup.bind(dns);
  // @ts-expect-error override overloaded lookup
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

const COMMIT = process.argv.includes("--commit") && process.env.REDATE_ACK === "I_UNDERSTAND";

async function main() {
  console.log(COMMIT ? "\n*** COMMIT MODE — writing ***\n" : "\n--- DRY RUN (no writes) ---\n");

  const entries = await prisma.agentLedgerEntry.findMany({
    where: { referenceType: "DELIVERY_FEE" },
    select: { id: true, referenceId: true, date: true },
    orderBy: { referenceId: "asc" },
  });
  console.log(`DELIVERY_FEE ledger entries: ${entries.length}\n`);

  let changed = 0;
  for (const e of entries) {
    // referenceId is the order number. Find its actual delivery timestamp.
    const order = await prisma.order.findFirst({
      where: { orderNumber: e.referenceId },
      select: { id: true, updatedAt: true },
    });
    if (!order) { console.log(`  ${e.referenceId}: order not found — skip`); continue; }

    const log = await prisma.auditLog.findFirst({
      where: { entityType: "Order", entityId: order.id, action: "Delivered" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const deliveredTime = log?.createdAt ?? order.updatedAt;
    const src = log ? "audit-log" : "order.updatedAt(fallback)";

    const oldD = e.date.toISOString().slice(0, 10);
    const newD = deliveredTime.toISOString().slice(0, 10);
    if (oldD === newD) { console.log(`  ${e.referenceId}: already ${oldD} — no change`); continue; }

    console.log(`  ${e.referenceId}: ${oldD} -> ${newD}  [${src}]`);
    changed++;
    if (COMMIT) {
      await withoutCameraAudit(() =>
        prisma.agentLedgerEntry.update({ where: { id: e.id }, data: { date: deliveredTime } }),
      );
    }
  }

  console.log(COMMIT ? `\n*** DONE — updated ${changed} entr(y/ies) ***` : `\n--- dry run: ${changed} would change; re-run with --commit + REDATE_ACK ---`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
