-- CreateEnum
CREATE TYPE "RapsApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "ConversationType" ADD VALUE 'DIRECT';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "actorName" TEXT,
ADD COLUMN     "actorRole" TEXT;

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "directKey" TEXT;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "upsellAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "upsellQuantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "isRescheduled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "rapsApprovalStatus" "RapsApprovalStatus",
ADD COLUMN     "rapsAssignments" JSONB,
ADD COLUMN     "rapsRejectionReason" TEXT,
ADD COLUMN     "supplierInvoiceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accountingPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "revokedAdminPages" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "order_counters" (
    "prefix" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_counters_pkey" PRIMARY KEY ("prefix")
);

-- CreateIndex
CREATE INDEX "audit_logs_actorRole_idx" ON "audit_logs"("actorRole");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_directKey_key" ON "conversations"("directKey");

-- CreateIndex
CREATE INDEX "stock_movements_date_idx" ON "stock_movements"("date");

-- CreateIndex
CREATE INDEX "stock_movements_type_date_idx" ON "stock_movements"("type", "date");

