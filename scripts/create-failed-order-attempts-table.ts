/**
 * scripts/create-failed-order-attempts-table.ts
 *
 * Creates the `failed_order_attempts` table via raw SQL. We add tables this way
 * (not `prisma db push`) because the live DB has the `supplierInvoiceUrls` drift,
 * so `db push` would try to "fix" it and refuse / risk data loss. This script is
 * additive and idempotent (safe to re-run) — it only CREATEs new objects, never
 * alters existing tables.
 *
 * Run:
 *   node --import tsx scripts/create-failed-order-attempts-table.ts
 */
import { readFileSync } from "node:fs";

// Load .env ourselves and strip surrounding quotes/whitespace. Node's built-in
// --env-file leaves literal quotes when a value has a leading space before the
// opening quote (as this project's .env does), which breaks the Neon URL.
function loadEnv() {
  const raw = readFileSync(".env", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue; // skips blank + `#`-commented lines
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

const statements = [
  `CREATE TABLE IF NOT EXISTS "failed_order_attempts" (
     "id" TEXT NOT NULL,
     "formId" TEXT,
     "customerName" TEXT,
     "customerPhone" TEXT,
     "customerWhatsapp" TEXT,
     "productId" TEXT,
     "productName" TEXT,
     "packageName" TEXT,
     "state" TEXT,
     "deliveryAddress" TEXT,
     "reason" TEXT NOT NULL,
     "httpStatus" INTEGER,
     "errorMessage" TEXT,
     "userAgent" TEXT,
     "recoveredAt" TIMESTAMP(3),
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "failed_order_attempts_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE INDEX IF NOT EXISTS "failed_order_attempts_createdAt_idx" ON "failed_order_attempts"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "failed_order_attempts_formId_idx" ON "failed_order_attempts"("formId")`,
  `CREATE INDEX IF NOT EXISTS "failed_order_attempts_recoveredAt_idx" ON "failed_order_attempts"("recoveredAt")`,
];

async function main() {
  loadEnv();
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/]+)/)?.[1] ?? "unknown";
  console.log(`Target DB host: ${host}`);

  // Import AFTER env is loaded — the Prisma client reads DATABASE_URL at construction.
  const { prisma } = await import("@/lib/db/prisma");
  try {
    for (const sql of statements) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log("✓ failed_order_attempts ready");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
