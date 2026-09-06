/**
 * scripts/create-agent-stock-tables.ts
 *
 * Creates the two new agent-stock-correction tables via raw SQL. We add tables
 * this way (not `prisma db push`) because the live DB has the `supplierInvoiceUrls`
 * drift, so `db push` would try to "fix" it and refuse / risk data loss. This
 * script is additive and idempotent (safe to re-run) — it only CREATEs new
 * objects, never alters existing tables.
 *
 * Run (no --env-file needed; it loads .env itself, tolerating the space-before-
 * quote formatting that Node's --env-file mishandles):
 *   node --import tsx scripts/create-agent-stock-tables.ts
 *
 * The `StockAdjustmentStatus` enum type already exists in the DB (reused).
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
  `CREATE TABLE IF NOT EXISTS "agent_stock_adjustments" (
     "id" TEXT NOT NULL,
     "referenceNumber" TEXT NOT NULL,
     "agentId" TEXT NOT NULL,
     "reason" TEXT NOT NULL,
     "notes" TEXT,
     "status" "StockAdjustmentStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
     "date" TIMESTAMP(3) NOT NULL,
     "createdById" TEXT NOT NULL,
     "approvedById" TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "agent_stock_adjustments_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "agent_stock_adjustments_referenceNumber_key" ON "agent_stock_adjustments"("referenceNumber")`,
  `CREATE INDEX IF NOT EXISTS "agent_stock_adjustments_agentId_idx" ON "agent_stock_adjustments"("agentId")`,
  `CREATE INDEX IF NOT EXISTS "agent_stock_adjustments_status_idx" ON "agent_stock_adjustments"("status")`,
  `CREATE INDEX IF NOT EXISTS "agent_stock_adjustments_createdById_idx" ON "agent_stock_adjustments"("createdById")`,
  `CREATE TABLE IF NOT EXISTS "agent_stock_adjustment_items" (
     "id" TEXT NOT NULL,
     "agentStockAdjustmentId" TEXT NOT NULL,
     "productId" TEXT NOT NULL,
     "quantityBefore" INTEGER NOT NULL,
     "quantityAfter" INTEGER NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "agent_stock_adjustment_items_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE INDEX IF NOT EXISTS "agent_stock_adjustment_items_agentStockAdjustmentId_idx" ON "agent_stock_adjustment_items"("agentStockAdjustmentId")`,
  `CREATE INDEX IF NOT EXISTS "agent_stock_adjustment_items_productId_idx" ON "agent_stock_adjustment_items"("productId")`,
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'agent_stock_adjustment_items_agentStockAdjustmentId_fkey'
     ) THEN
       ALTER TABLE "agent_stock_adjustment_items"
         ADD CONSTRAINT "agent_stock_adjustment_items_agentStockAdjustmentId_fkey"
         FOREIGN KEY ("agentStockAdjustmentId") REFERENCES "agent_stock_adjustments"("id")
         ON DELETE CASCADE ON UPDATE CASCADE;
     END IF;
   END $$;`,
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
    console.log("✓ agent_stock_adjustments + agent_stock_adjustment_items ready");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
