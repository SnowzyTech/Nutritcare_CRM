import type { PrismaClient } from "@prisma/client";
import { getCurrentActor } from "./actor";
import { isCameraSuppressed } from "./context";
import { runAfterResponse } from "./schedule";

/**
 * The audit "camera": a Prisma client extension that auto-records every
 * create/update/delete into `audit_logs`, so all current and future actions are
 * captured with no per-action code.
 *
 * Safety properties (see docs/audit-hybrid.md):
 *  - Recursion-safe: writes rows via the injected `base` client (not the
 *    extended one) and skips `model === "AuditLog"`.
 *  - Out-of-band: the row is written via `after()` (post-response), never inside
 *    the caller's transaction — so it can't add latency or cause a Neon timeout.
 *  - Never throws into business logic: the scheduled write is try/caught.
 *  - Log-on-success: only reached after `await query(args)` resolves.
 *  - Suppressible: rich manual flows wrap their writes in `withoutCameraAudit`.
 */

/**
 * Internal / derived / child / system tables the camera should NOT log — they
 * are implementation detail, not business actions a CEO audits, and would flood
 * the trail (e.g. a single order confirm writes Delivery + StockLevel +
 * Notification). Top-level business entities (Order, Product, User, Supplier,
 * Agent, Warehouse, Invoice, Expense, StockMovement/Adjustment/Transfer, Form,
 * Team, …) are captured automatically. Tune this list during shadow rollout.
 */
const IGNORED_MODELS = new Set<string>([
  "AuditLog",
  // Derived stock balances / shelves
  "StockLevel",
  "ShelfProductStock",
  "WarehouseLocation",
  // Child rows of a parent create (the parent is already logged)
  "OrderItem",
  "StockMovementItem",
  "StockAdjustmentItem",
  "StockTransferItem",
  "ProductPackage",
  "ProductOffer",
  "ProductCombo",
  "ProductGift",
  // High-churn / system bookkeeping
  "Notification",
  "Delivery",
  "AgentLedgerEntry",
  "PickPack",
  "Customer",
  "SalaryRecord",
  // Chat (deferred) and NextAuth internals
  "Message",
  "Conversation",
  "ConversationMember",
  "MessageMention",
  "MessageOrderRef",
  "Session",
  "Account",
  "VerificationToken",
]);

const WRITE_OPS: Record<string, "Created" | "Updated" | "Deleted"> = {
  create: "Created",
  createMany: "Created",
  createManyAndReturn: "Created",
  upsert: "Created",
  update: "Updated",
  updateMany: "Updated",
  updateManyAndReturn: "Updated",
  delete: "Deleted",
  deleteMany: "Deleted",
};

function cameraEnabled(): boolean {
  // "off" disables entirely; "shadow" | "on" | unset => enabled.
  return process.env.AUDIT_CAMERA !== "off";
}

function extractId(operation: string, args: unknown, result: unknown): string {
  if (operation === "create" || operation === "upsert") {
    const id = (result as { id?: unknown })?.id;
    if (id != null) return String(id);
  }
  const whereId = (args as { where?: { id?: unknown } })?.where?.id;
  if (typeof whereId === "string") return whereId;
  return "";
}

type OperationArgs = {
  model?: string;
  operation: string;
  args: unknown;
  query: (args: unknown) => Promise<unknown>;
};

export function createAuditCamera(base: PrismaClient) {
  return {
    name: "audit-camera",
    query: {
      async $allOperations({ model, operation, args, query }: OperationArgs) {
        const result = await query(args);

        const action = WRITE_OPS[operation];
        if (
          !action ||
          !model ||
          IGNORED_MODELS.has(model) ||
          !cameraEnabled() ||
          isCameraSuppressed()
        ) {
          return result;
        }

        // Memoized per request — auth() runs at most once regardless of write count.
        const actor = await getCurrentActor().catch(() => null);
        if (!actor?.id) return result; // no authenticated user -> skip (keeps FK valid)

        const entityId = extractId(operation, args, result);
        const count =
          operation.endsWith("Many") &&
          typeof (result as { count?: number })?.count === "number"
            ? (result as { count: number }).count
            : undefined;

        runAfterResponse(async () => {
          try {
            await base.auditLog.create({
              data: {
                userId: actor.id,
                actorName: actor.name ?? null,
                actorRole: actor.role ?? null,
                action,
                entityType: model,
                entityId,
                details: {
                  description:
                    count !== undefined
                      ? `${action} ${count} ${model} record(s)`
                      : `${action} ${model}`,
                  auto: true,
                },
              },
            });
          } catch (err) {
            console.error("[audit-camera] failed to record:", err);
          }
        });

        return result;
      },
    },
  };
}
