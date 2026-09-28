-- Agent-sold orders: an order a delivery agent sold directly to the customer at
-- delivery has NO sales rep, so `orders.salesRepId` becomes nullable. The FK is
-- recreated ON DELETE SET NULL (a deleted rep nulls the link rather than blocking).
-- See modules/orders/services/agent-order.service.ts.
--
-- Additive and idempotent (safe to re-run). Apply with:
--   npx prisma db execute --file prisma/migrations/20260929000000_order_nullable_salesrep/migration.sql --schema prisma/schema.prisma
-- Never `prisma db push` against the shared DB (see CLAUDE.md schema-drift note).

-- AlterTable: drop the NOT NULL constraint on salesRepId
ALTER TABLE "orders" ALTER COLUMN "salesRepId" DROP NOT NULL;

-- Recreate the FK with ON DELETE SET NULL (was the implicit RESTRICT of a required relation)
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_salesRepId_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_salesRepId_fkey"
  FOREIGN KEY ("salesRepId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
