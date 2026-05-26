/*
  Warnings:

  - A unique constraint covering the columns `[referenceCode]` on the table `warehouses` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "pick_packs" DROP CONSTRAINT "pick_packs_orderId_fkey";

-- AlterTable
ALTER TABLE "agent_settlements" ADD COLUMN     "ordersJson" JSONB;

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "deliveryFee" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "expense_categories" ADD COLUMN     "financialStatement" TEXT;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "expenseNameId" TEXT,
ADD COLUMN     "supplierId" TEXT;

-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN     "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "costPriceAtSale" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payment_accounts" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "pick_packs" ADD COLUMN     "stockMovementId" TEXT,
ADD COLUMN     "stockTransferId" TEXT,
ALTER COLUMN "orderId" DROP NOT NULL,
ALTER COLUMN "locationCode" SET DEFAULT '';

-- AlterTable
ALTER TABLE "product_categories" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "stock_adjustment_items" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "isDamaged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isReserved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shelfAssignments" JSONB,
ADD COLUMN     "shelfLocationId" TEXT,
ADD COLUMN     "shelfQuantity" INTEGER;

-- AlterTable
ALTER TABLE "warehouse_locations" ADD COLUMN     "currentStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxCapacity" INTEGER;

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "referenceCode" TEXT;

-- CreateTable
CREATE TABLE "stock_levels" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locationKind" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_packages" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelf_product_stocks" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shelf_product_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_line_items" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "product" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_names" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expenseCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_levels_productId_idx" ON "stock_levels"("productId");

-- CreateIndex
CREATE INDEX "stock_levels_locationKind_locationId_idx" ON "stock_levels"("locationKind", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_levels_productId_locationKind_locationId_key" ON "stock_levels"("productId", "locationKind", "locationId");

-- CreateIndex
CREATE INDEX "product_packages_productId_idx" ON "product_packages"("productId");

-- CreateIndex
CREATE INDEX "shelf_product_stocks_locationId_idx" ON "shelf_product_stocks"("locationId");

-- CreateIndex
CREATE INDEX "shelf_product_stocks_productId_idx" ON "shelf_product_stocks"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "shelf_product_stocks_locationId_productId_key" ON "shelf_product_stocks"("locationId", "productId");

-- CreateIndex
CREATE INDEX "expense_line_items_expenseId_idx" ON "expense_line_items"("expenseId");

-- CreateIndex
CREATE INDEX "expense_names_expenseCategoryId_idx" ON "expense_names"("expenseCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "expense_names_name_expenseCategoryId_key" ON "expense_names"("name", "expenseCategoryId");

-- CreateIndex
CREATE INDEX "forms_createdById_idx" ON "forms"("createdById");

-- CreateIndex
CREATE INDEX "expenses_expenseNameId_idx" ON "expenses"("expenseNameId");

-- CreateIndex
CREATE INDEX "expenses_supplierId_idx" ON "expenses"("supplierId");

-- CreateIndex
CREATE INDEX "pick_packs_stockMovementId_idx" ON "pick_packs"("stockMovementId");

-- CreateIndex
CREATE INDEX "pick_packs_stockTransferId_idx" ON "pick_packs"("stockTransferId");

-- CreateIndex
CREATE INDEX "stock_adjustment_items_locationId_idx" ON "stock_adjustment_items"("locationId");

-- CreateIndex
CREATE INDEX "stock_movements_shelfLocationId_idx" ON "stock_movements"("shelfLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_referenceCode_key" ON "warehouses"("referenceCode");

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_packages" ADD CONSTRAINT "product_packages_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelf_product_stocks" ADD CONSTRAINT "shelf_product_stocks_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "warehouse_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelf_product_stocks" ADD CONSTRAINT "shelf_product_stocks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_shelfLocationId_fkey" FOREIGN KEY ("shelfLocationId") REFERENCES "warehouse_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_packs" ADD CONSTRAINT "pick_packs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_packs" ADD CONSTRAINT "pick_packs_stockMovementId_fkey" FOREIGN KEY ("stockMovementId") REFERENCES "stock_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_packs" ADD CONSTRAINT "pick_packs_stockTransferId_fkey" FOREIGN KEY ("stockTransferId") REFERENCES "stock_transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_expenseNameId_fkey" FOREIGN KEY ("expenseNameId") REFERENCES "expense_names"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_line_items" ADD CONSTRAINT "expense_line_items_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_names" ADD CONSTRAINT "expense_names_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_items" ADD CONSTRAINT "stock_adjustment_items_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "warehouse_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
