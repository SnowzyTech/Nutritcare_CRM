-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "lastFeedback" TEXT,
ADD COLUMN     "lastFeedbackAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "order_feedback" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_feedback_orderId_createdAt_idx" ON "order_feedback"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "order_feedback_authorId_idx" ON "order_feedback"("authorId");

-- CreateIndex
CREATE INDEX "orders_salesRepId_lastFeedback_idx" ON "orders"("salesRepId", "lastFeedback");

-- AddForeignKey
ALTER TABLE "order_feedback" ADD CONSTRAINT "order_feedback_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_feedback" ADD CONSTRAINT "order_feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

