-- Even daily order distribution: remember which rep the form-intake rotation
-- originally gave each order to (never changed by reassignment).
-- See modules/orders/services/rep-assignment.service.ts.
--
-- Additive and idempotent (safe to re-run). Apply with:
--   npx prisma db execute --file prisma/migrations/20260927120000_order_auto_assignment/migration.sql --schema prisma/schema.prisma
-- Never `prisma db push` against the shared DB (see CLAUDE.md schema-drift note).

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "autoAssignedToId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_autoAssignedToId_createdAt_idx" ON "orders"("autoAssignedToId", "createdAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_autoAssignedToId_fkey" FOREIGN KEY ("autoAssignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill: every existing form order was auto-assigned at intake, so seed the
-- rotation from real history (manual / analyst-keyed orders have formId NULL).
-- Orders reassigned since intake map to their current rep — an approximation
-- that only affects who is "least recently served" on the first day.
-- Plain SQL on purpose: it leaves "updatedAt" (the status time) untouched.
UPDATE "orders"
SET "autoAssignedToId" = "salesRepId"
WHERE "formId" IS NOT NULL AND "autoAssignedToId" IS NULL;
