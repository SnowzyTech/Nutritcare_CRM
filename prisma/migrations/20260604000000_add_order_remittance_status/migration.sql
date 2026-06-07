-- CreateEnum
CREATE TYPE "RemittanceStatus" AS ENUM ('NOT_REMITTED', 'REMITTED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "remittanceStatus" "RemittanceStatus" NOT NULL DEFAULT 'NOT_REMITTED';

-- CreateIndex
CREATE INDEX "orders_remittanceStatus_idx" ON "orders"("remittanceStatus");

-- Backfill: mark orders already remitted under the old system (tracked inside
-- AgentSettlement.ordersJson) as REMITTED so they don't reappear in the
-- remittance entry and show as Paid in the Sales Record.
UPDATE "orders" o
SET "remittanceStatus" = 'REMITTED'
WHERE EXISTS (
  SELECT 1 FROM "agent_settlements" s
  CROSS JOIN LATERAL jsonb_array_elements_text(s."ordersJson") AS oid
  WHERE jsonb_typeof(s."ordersJson") = 'array' AND oid = o.id
);
