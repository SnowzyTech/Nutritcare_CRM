import { prisma } from "@/lib/db/prisma";

/**
 * Activity types recorded in the user History page. Kept as string literals
 * (not a Prisma enum) so new activities can be added without a migration —
 * `AuditLog.action` is a plain `String` column.
 */
export type ActivityAction =
  | "Log In"
  | "Log Out"
  | "Order Confirmed"
  | "Delivered"
  | "Cancel"
  | "Failed";

/**
 * Records a single activity in the audit log. This is intentionally
 * fire-and-forget: a logging failure must never break the primary action that
 * triggered it (an order confirmation, a sign-in, etc.), so all errors are
 * swallowed and reported to the console only.
 */
export async function logActivity(params: {
  userId: string;
  action: ActivityAction | string;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: { description: params.description },
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] Failed to record activity:", err);
  }
}
