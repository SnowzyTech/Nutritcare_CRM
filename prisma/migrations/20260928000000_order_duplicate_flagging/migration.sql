-- Duplicate-order flagging: an exact twin of an earlier still-open order is
-- auto-disabled (kept visible, blocked from confirmation) until a data team-lead
-- / admin / super-admin re-enables it. See
-- modules/orders/services/duplicate-order.service.ts.
--
-- Additive and idempotent (safe to re-run). Apply with:
--   npx prisma db execute --file prisma/migrations/20260928000000_order_duplicate_flagging/migration.sql --schema prisma/schema.prisma
-- Never `prisma db push` against the shared DB (see CLAUDE.md schema-drift note).

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "duplicateOfId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "duplicateDisabledAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "hasDuplicates" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_duplicateOfId_idx" ON "orders"("duplicateOfId");

-- AddForeignKey (self-relation: a duplicate points at the kept original)
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
