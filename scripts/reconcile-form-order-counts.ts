/**
 * scripts/reconcile-form-order-counts.ts
 * Reset each Form.orders stored counter to its real live order count
 * (Order rows with that formId and deletedAt = null). The counter is a
 * denormalised +1-on-submit tally that isn't decremented when orders are
 * deleted, so it drifts after a cleanup. Dry-run by default; writes only with
 * --confirm + CLEANUP_ACK=I_UNDERSTAND.
 *   node --env-file=.env --import tsx scripts/reconcile-form-order-counts.ts            # check
 *   CLEANUP_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/reconcile-form-order-counts.ts --confirm
 */
import { prisma } from "@/lib/db/prisma";
import { withoutCameraAudit } from "@/lib/audit/context";

const CONFIRM = process.argv.includes("--confirm");
const ACK = process.env.CLEANUP_ACK === "I_UNDERSTAND";

async function main() {
  const forms = await prisma.form.findMany({ select: { id: true, name: true, orders: true } });
  const grouped = await prisma.order.groupBy({
    by: ["formId"],
    where: { deletedAt: null, formId: { not: null } },
    _count: { _all: true },
  });
  const liveByForm = new Map(grouped.map((g) => [g.formId as string, g._count._all]));

  const toFix = forms
    .map((f) => ({ id: f.id, name: f.name, stored: f.orders, live: liveByForm.get(f.id) ?? 0 }))
    .filter((f) => f.stored !== f.live);

  console.log(`Forms with a stale orders counter: ${toFix.length}`);
  for (const f of toFix) console.log(`  ${f.name.padEnd(34)} ${f.stored} → ${f.live}`);

  if (!(CONFIRM && ACK)) {
    console.log("\nDRY RUN — no changes were made.");
    return;
  }

  console.log("\nEXECUTING…");
  await withoutCameraAudit(async () => {
    for (const f of toFix) {
      await prisma.form.update({ where: { id: f.id }, data: { orders: f.live } });
    }
  });
  console.log(`Updated ${toFix.length} form(s).`);
}

main().catch((e) => { console.error("Failed:", e); process.exit(1); }).finally(() => prisma.$disconnect());
