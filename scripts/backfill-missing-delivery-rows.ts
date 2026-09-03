/**
 * scripts/backfill-missing-delivery-rows.ts
 * Creates the missing Delivery record for DELIVERED orders that have none — these
 * were CONFIRMED via the bulk August import (which never created a Delivery row),
 * so when they were later marked delivered there was nothing to stamp. Result:
 * their detail page / delivery-tracker show no delivered date.
 *
 * This ONLY creates the Delivery row (status=DELIVERED, deliveredTime from the
 * order's "Delivered" audit log, falling back to order.updatedAt). It does NOT
 * touch stock (already correctly deducted at delivery) and leaves scheduledTime
 * null (the originally-agreed delivery date is unknown for import-confirmed orders).
 *
 *   node --env-file=.env --import tsx scripts/backfill-missing-delivery-rows.ts            # dry-run
 *   DELIV_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/backfill-missing-delivery-rows.ts --commit
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

const COMMIT = process.argv.includes("--commit") && process.env.DELIV_ACK === "I_UNDERSTAND";

async function main() {
  console.log(COMMIT ? "\n*** COMMIT MODE — writing ***\n" : "\n--- DRY RUN (no writes) ---\n");

  // DELIVERED orders that have no Delivery row at all.
  const orders = await prisma.order.findMany({
    where: { status: "DELIVERED", deletedAt: null, deliveries: { none: {} } },
    select: { id: true, orderNumber: true, agentId: true, updatedAt: true },
    orderBy: { orderNumber: "asc" },
  });

  console.log(`DELIVERED orders with no Delivery row: ${orders.length}\n`);
  let created = 0;
  for (const o of orders) {
    // Prefer the real delivered time from the "Delivered" audit log.
    const log = await prisma.auditLog.findFirst({
      where: { entityType: "Order", entityId: o.id, action: "Delivered" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const deliveredTime = log?.createdAt ?? o.updatedAt;
    const src = log ? "audit-log" : "order.updatedAt(fallback)";

    console.log(
      `  ${o.orderNumber}: create Delivery(status=DELIVERED, agentId=${o.agentId ?? "null"}, ` +
      `deliveredTime=${deliveredTime.toISOString().slice(0, 16)} [${src}])`,
    );

    if (COMMIT) {
      await withoutCameraAudit(() =>
        prisma.delivery.create({
          data: {
            orderId: o.id,
            agentId: o.agentId,
            status: "DELIVERED",
            deliveredTime,
            // scheduledTime intentionally left null — the agreed date is unknown
            // for orders confirmed via the import.
          },
        }),
      );
      created++;
    }
  }

  console.log(
    COMMIT
      ? `\n*** DONE — created ${created} Delivery row(s) ***`
      : `\n--- dry run complete; re-run with --commit + DELIV_ACK to apply ---`,
  );
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
