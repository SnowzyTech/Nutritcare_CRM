import { prisma } from "@/lib/db/prisma";
import type { OrderFeedbackOutcome } from "@/lib/orders/order-feedback";

/**
 * Sales-rep call feedback on an order. See lib/orders/order-feedback.ts.
 *
 * Callers own auth/ownership, `suppressCameraForRequest()`, audit logging and
 * revalidation — this only performs the write.
 */

export type RecordOrderFeedbackInput = {
  orderId: string;
  authorId: string;
  outcome: OrderFeedbackOutcome;
  note: string | null;
};

/**
 * Appends a feedback entry and mirrors it onto `Order.lastFeedback` /
 * `lastFeedbackAt` in one transaction, so the list's denormalized "latest"
 * never disagrees with the history. Never touches `Order.status`.
 *
 * The mirror write is raw SQL on purpose: a Prisma `order.update` would bump
 * `Order.updatedAt` (`@updatedAt`), which the app treats as the STATUS-change
 * time (list "Status Date", cancelled/failed dates, delivered-in-range reports
 * in sales-report.service / agents.service). Feedback is not a status change.
 */
export async function recordOrderFeedback(
  input: RecordOrderFeedbackInput,
): Promise<{ id: string; createdAt: Date }> {
  return prisma.$transaction(async (tx) => {
    const entry = await tx.orderFeedback.create({
      data: {
        orderId: input.orderId,
        authorId: input.authorId,
        outcome: input.outcome,
        note: input.note,
      },
      select: { id: true, createdAt: true },
    });
    // lastFeedbackAt is copied in SQL (not passed as a JS Date) so it is
    // identical to the entry's stored createdAt, with no driver timezone casting.
    await tx.$executeRaw`
      UPDATE "orders" o
      SET "lastFeedback" = f."outcome", "lastFeedbackAt" = f."createdAt"
      FROM "order_feedback" f
      WHERE f."id" = ${entry.id} AND o."id" = f."orderId"`;
    return entry;
  });
}
