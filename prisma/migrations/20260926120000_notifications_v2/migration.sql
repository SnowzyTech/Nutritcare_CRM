-- Notification system v2: priority / dedupe / structured data on notifications,
-- Web Push subscriptions, and per-channel delivery attempts.
--
-- Additive and idempotent (safe to re-run). Apply with:
--   npx prisma db execute --file prisma/migrations/20260926120000_notifications_v2/migration.sql --schema prisma/schema.prisma
-- Never `prisma db push` against the shared DB (see CLAUDE.md schema-drift note).

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "data" JSONB;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "notification_deliveries" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX IF NOT EXISTS "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");
CREATE INDEX IF NOT EXISTS "notification_deliveries_recipientId_channel_createdAt_idx" ON "notification_deliveries"("recipientId", "channel", "createdAt");
CREATE INDEX IF NOT EXISTS "notification_deliveries_notificationId_idx" ON "notification_deliveries"("notificationId");

-- The composite index serves both the unread count and the list query, so it
-- replaces the two single-column indexes (created first, then the old ones go).
CREATE INDEX IF NOT EXISTS "notifications_recipientId_isRead_createdAt_idx" ON "notifications"("recipientId", "isRead", "createdAt" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_recipientId_dedupeKey_key" ON "notifications"("recipientId", "dedupeKey");
DROP INDEX IF EXISTS "notifications_recipientId_idx";
DROP INDEX IF EXISTS "notifications_isRead_idx";

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
