/**
 * scripts/count-orders.ts
 *
 * READ-ONLY scale snapshot. Prints the target DB host first, then only SELECTs.
 * Gives order volume + the fast-growing tables that drive DB compute usage.
 *
 *   node --import tsx scripts/count-orders.ts
 */
import { readFileSync } from "node:fs";

function loadEnv() {
  const raw = readFileSync(".env", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[m[1]] = val;
  }
}

type StatusRow = { status: string; n: bigint };
type DayRow = { day: Date; n: bigint };

async function main() {
  loadEnv();
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/]+)/)?.[1] ?? "unknown";
  console.log(`Target DB host: ${host}\n`);

  const { prisma } = await import("@/lib/db/prisma");

  try {
    const [totalOrders, last7, last30, today] = await Promise.all([
      prisma.order.count({ where: { deletedAt: null } }),
      prisma.order.count({
        where: { deletedAt: null, createdAt: { gte: new Date(Date.now() - 7 * 864e5) } },
      }),
      prisma.order.count({
        where: { deletedAt: null, createdAt: { gte: new Date(Date.now() - 30 * 864e5) } },
      }),
      prisma.order.count({
        where: {
          deletedAt: null,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    console.log("── Orders ──");
    console.log(`  Total (not deleted): ${totalOrders}`);
    console.log(`  Last 7 days:         ${last7}`);
    console.log(`  Last 30 days:        ${last30}`);
    console.log(`  Today:               ${today}`);

    const byStatus = await prisma.$queryRaw<StatusRow[]>`
      SELECT status::text AS status, COUNT(*)::bigint AS n
      FROM orders WHERE "deletedAt" IS NULL
      GROUP BY status ORDER BY n DESC`;
    console.log("\n── Orders by status ──");
    for (const r of byStatus) console.log(`  ${r.status.padEnd(10)} ${r.n}`);

    const perDay = await prisma.$queryRaw<DayRow[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS n
      FROM orders
      WHERE "deletedAt" IS NULL AND "createdAt" >= now() - interval '14 days'
      GROUP BY 1 ORDER BY 1 DESC`;
    console.log("\n── Orders per day (last 14 days) ──");
    for (const r of perDay) {
      console.log(`  ${new Date(r.day).toISOString().slice(0, 10)}  ${r.n}`);
    }

    const [orderItems, customers, forms, auditLogs, users] = await Promise.all([
      prisma.orderItem.count(),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.form.count({ where: { deletedAt: null } }),
      prisma.auditLog.count(),
      prisma.user.count(),
    ]);
    console.log("\n── Other volumes (drive DB compute) ──");
    console.log(`  Order items:  ${orderItems}`);
    console.log(`  Customers:    ${customers}`);
    console.log(`  Active forms: ${forms}`);
    console.log(`  Audit logs:   ${auditLogs}`);
    console.log(`  Active users: ${users}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
