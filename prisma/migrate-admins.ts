/**
 * One-off migration: promote every existing ADMIN account to SUPER_ADMIN.
 *
 * Run once after adding SUPER_ADMIN to the UserRole enum:
 *   npx tsx prisma/migrate-admins.ts
 *
 * Safe to re-run — once all admins are SUPER_ADMIN it updates nothing.
 */
import { PrismaClient } from "@prisma/client";

// ── Inline the same Neon-aware client logic used by prisma/seed.ts ─────────────
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
  const result = await prisma.user.updateMany({
    where: { role: "ADMIN" },
    data: { role: "SUPER_ADMIN" },
  });
  console.log(`Promoted ${result.count} ADMIN account(s) to SUPER_ADMIN.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
