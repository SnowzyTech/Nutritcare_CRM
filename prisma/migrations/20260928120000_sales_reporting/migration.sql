-- Sales reporting rebuilt on docs/CRM_Sales_Reporting_Template_.pdf
-- (see docs/sales-reporting.md): phone key for returning customers, targets,
-- saved reports, management action items, customer feedback, follow-ups.
--
-- Additive and idempotent (safe to re-run). Apply with:
--   npx prisma db execute --file prisma/migrations/20260928120000_sales_reporting/migration.sql --schema prisma/schema.prisma
-- Never `prisma db push` against the shared DB (see CLAUDE.md schema-drift note).

-- AlterTable
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "phoneKey" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "sales_targets" (
    "id" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "setById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sales_reports" (
    "id" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "narrative" JSONB NOT NULL DEFAULT '{}',
    "figures" JSONB,
    "authorId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sales_action_items" (
    "id" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "teamOrLocation" TEXT,
    "impact" TEXT,
    "actionRequired" TEXT,
    "owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "customer_feedback" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "authorId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "action" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "customer_follow_ups" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "completedById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "customer_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sales_targets_periodType_periodStart_idx" ON "sales_targets"("periodType", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sales_targets_periodType_periodStart_teamId_metric_key" ON "sales_targets"("periodType", "periodStart", "teamId", "metric");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sales_reports_periodType_periodStart_key" ON "sales_reports"("periodType", "periodStart");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sales_action_items_status_idx" ON "sales_action_items"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sales_action_items_createdAt_idx" ON "sales_action_items"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customer_feedback_orderId_idx" ON "customer_feedback"("orderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customer_feedback_createdAt_idx" ON "customer_feedback"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customer_feedback_category_idx" ON "customer_feedback"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customer_follow_ups_completedAt_idx" ON "customer_follow_ups"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "customer_follow_ups_orderId_stage_key" ON "customer_follow_ups"("orderId", "stage");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customers_phoneKey_idx" ON "customers"("phoneKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_date_idx" ON "orders"("date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "deliveries_deliveredTime_idx" ON "deliveries"("deliveredTime");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_setById_fkey" FOREIGN KEY ("setById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "sales_reports" ADD CONSTRAINT "sales_reports_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "sales_action_items" ADD CONSTRAINT "sales_action_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "customer_feedback" ADD CONSTRAINT "customer_feedback_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "customer_feedback" ADD CONSTRAINT "customer_feedback_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "customer_feedback" ADD CONSTRAINT "customer_feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "customer_follow_ups" ADD CONSTRAINT "customer_follow_ups_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "customer_follow_ups" ADD CONSTRAINT "customer_follow_ups_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill Customer.phoneKey with the same normalisation as lib/phone.ts
-- toInternationalPhone: digits only; a leading 0 becomes 234. Plain SQL, so
-- "updatedAt" is untouched.
UPDATE "customers" AS c
SET "phoneKey" = CASE
    WHEN x.d LIKE '234%' THEN x.d
    WHEN x.d LIKE '0%' THEN '234' || substring(x.d FROM 2)
    ELSE x.d
  END
FROM (SELECT id, regexp_replace(COALESCE(phone, ''), '\D', '', 'g') AS d FROM "customers") AS x
WHERE x.id = c.id AND c."phoneKey" IS NULL AND x.d <> '';
