/**
 * One-off backfill: populate actorName / actorRole on existing audit_logs rows
 * from their related user. Safe to re-run (only fills rows missing actorRole).
 *
 *   npx tsx prisma/backfill-audit-actor.ts
 */
import { PrismaClient } from "@prisma/client";

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

async function main() {
  const logs = await prisma.auditLog.findMany({
    where: { actorRole: null },
    select: { id: true, userId: true },
  });

  if (logs.length === 0) {
    console.log("No audit logs need backfilling.");
    return;
  }

  // Cache users to avoid repeat lookups.
  const userIds = [...new Set(logs.map((l) => l.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, role: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  let updated = 0;
  for (const log of logs) {
    const u = userMap.get(log.userId);
    if (!u) continue;
    await prisma.auditLog.update({
      where: { id: log.id },
      data: { actorName: u.name, actorRole: u.role },
    });
    updated++;
  }

  console.log(`Backfilled ${updated} of ${logs.length} audit log(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
