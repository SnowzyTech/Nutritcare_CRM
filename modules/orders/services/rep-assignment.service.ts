import type { Prisma } from "@prisma/client";

/**
 * Even daily distribution of form orders across sales reps.
 *
 * Rule: each new order goes to the eligible rep who has gone the LONGEST
 * without an auto-assigned order (a rep who has never had one goes first).
 * That is a strict rotation, so:
 *  - everyone working all day receives the same number of orders that day,
 *    give or take one — the owner's "even per day" requirement;
 *  - it reads `Order.autoAssignedToId` (who the SYSTEM gave the order to), so
 *    a manager reassigning orders never skews anyone's share;
 *  - a rep added / reactivated mid-day joins the turn order (gets the next
 *    order, then rotates) instead of receiving everything until they catch up;
 *  - who gets the odd extra order carries over across days, so it is not
 *    always the same rep. Yesterday's backlog plays no part.
 * Being time-ordered, it needs no midnight reset, scheduler or timezone math.
 *
 * Eligible: active SALES_REP accounts that are APPROVED (can actually sign in).
 */

/** Reps with no auto-assignment in this window count as "never" (go first). */
const LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Picks the rep for a new form order. MUST run inside the transaction that
 * creates the order: the advisory lock serialises concurrent submissions for
 * the pick + insert, so two customers submitting at once can't take the same
 * turn. Returns null when no rep is eligible.
 */
export async function pickRepForNewOrder(tx: Prisma.TransactionClient): Promise<string | null> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('order-rep-assignment'))`;

  const reps = await tx.user.findMany({
    where: { role: "SALES_REP", isActive: true, accountActivationStatus: "APPROVED" },
    select: { id: true, createdAt: true },
  });
  if (reps.length === 0) return null;
  if (reps.length === 1) return reps[0].id;

  // Last auto-assignment per rep — one indexed aggregate in the database.
  const last = await tx.order.groupBy({
    by: ["autoAssignedToId"],
    where: {
      autoAssignedToId: { in: reps.map((r) => r.id) },
      createdAt: { gte: new Date(Date.now() - LOOKBACK_MS) },
    },
    _max: { createdAt: true },
  });
  const lastAt = new Map<string, number>();
  for (const row of last) {
    if (row.autoAssignedToId && row._max.createdAt) {
      lastAt.set(row.autoAssignedToId, row._max.createdAt.getTime());
    }
  }

  // Least recently served first; "never" (-1) before anyone. Stable ties:
  // longest-standing account first, then id.
  const [next] = [...reps].sort(
    (a, b) =>
      (lastAt.get(a.id) ?? -1) - (lastAt.get(b.id) ?? -1) ||
      a.createdAt.getTime() - b.createdAt.getTime() ||
      a.id.localeCompare(b.id),
  );
  return next.id;
}
