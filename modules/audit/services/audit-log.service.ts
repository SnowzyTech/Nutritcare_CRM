import { basePrisma } from "@/lib/db/prisma";
import { runAfterResponse } from "@/lib/audit/schedule";

/**
 * Activity verbs recorded in the audit / History pages. Kept as string literals
 * (not a Prisma enum) so new activities can be added without a migration —
 * `AuditLog.action` is a plain `String` column.
 */
export type ActivityAction =
  | "Log In"
  | "Log Out"
  | "Created"
  | "Updated"
  | "Deleted"
  | "Approved"
  | "Rejected"
  | "Suspended"
  | "Activated"
  | "Order Confirmed"
  | "Delivered"
  | "Cancel"
  | "Failed"
  | "Revived"
  | "Discount"
  | "Remittance"
  | "Adjustment"
  | "Reassigned"
  | "Sign Up"
  | "Password Reset";

/** Extra structured context stored alongside the human description in `details`. */
export type AuditDetails = {
  /** Prior value for a sensitive edit (discount, cost price, delivery fee, stock qty). */
  before?: string | number | null;
  /** New value for a sensitive edit. */
  after?: string | number | null;
  /** Which field changed (e.g. "price", "costPrice", "deliveryFee"). */
  field?: string;
  /** A monetary/quantity amount for aggregation (discount value, remittance total). */
  amount?: number;
  /** Department the actor belongs to, if the caller wants to override the derived one. */
  [key: string]: unknown;
};

/**
 * Records a single activity in the audit log. This is intentionally
 * fire-and-forget: a logging failure must never break the primary action that
 * triggered it (an order confirmation, a sign-in, etc.), so all errors are
 * swallowed and reported to the console only.
 *
 * The actor's name + role are denormalized onto the row so the History page can
 * show/filter by them even if the user is later renamed or deleted. If the
 * caller doesn't pass them, they're looked up from the user record.
 */
export async function logActivity(params: {
  userId: string;
  action: ActivityAction | string;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  details?: AuditDetails;
}): Promise<void> {
  // Written via `basePrisma` (never the camera-extended client) and out-of-band
  // via `after()`, so a rich manual log never re-triggers the camera, never adds
  // latency, and never throws into the calling action.
  runAfterResponse(async () => {
    try {
      let actorName = params.actorName ?? null;
      let actorRole = params.actorRole ?? null;

      if (!actorName || !actorRole) {
        const user = await basePrisma.user.findUnique({
          where: { id: params.userId },
          select: { name: true, role: true },
        });
        actorName = actorName ?? user?.name ?? null;
        actorRole = actorRole ?? user?.role ?? null;
      }

      await basePrisma.auditLog.create({
        data: {
          userId: params.userId,
          actorName,
          actorRole,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          details: { description: params.description, ...(params.details ?? {}) },
          ipAddress: params.ipAddress ?? null,
        },
      });
    } catch (err) {
      console.error("[audit] Failed to record activity:", err);
    }
  });
}
