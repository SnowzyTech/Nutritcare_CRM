import { prisma } from "@/lib/db/prisma";
import type { Prisma, StockAdjustmentStatus } from "@prisma/client";
import { getAgentCommittedQuantities as committedQuantitiesFor } from "@/modules/delivery/services/agents.service";

/**
 * Agent stock correction (reconciliation) service.
 *
 * Agent stock lives in `StockLevel` (locationKind "AGENT", locationId = agentId).
 * These helpers back the maker–checker correction flow: read the agent's current
 * per-product stock + what's already committed to their confirmed orders, apply a
 * corrected absolute quantity, and list corrections for the review screens.
 *
 * Pricing/settlement are untouched — this only reconciles stock counts.
 */

type Tx = Prisma.TransactionClient;

/**
 * Units already promised to an agent's CONFIRMED (not-yet-delivered) orders, per
 * product. A correction below this figure is allowed but flagged: an agent can
 * legitimately be over-booked (assignment no longer blocks on free stock), and
 * the real zero floor is enforced at delivery by `deliverOrder`.
 *
 * A thin wrapper over the one shared definition in delivery/agents.service, so
 * the correction tool and the confirm/delivery paths can never disagree about
 * what "committed" means.
 */
export async function getAgentCommittedQuantities(
  agentId: string,
  productIds: string[],
): Promise<Record<string, number>> {
  return committedQuantitiesFor(prisma, agentId, productIds);
}

/**
 * Set each product's agent StockLevel to the corrected ABSOLUTE quantity.
 * Runs inside the caller's transaction. Upserts on the (product, kind, location)
 * composite unique so a product with no existing row is created at the target.
 */
export async function applyAgentStockCorrection(
  tx: Tx,
  agentId: string,
  items: { productId: string; quantityAfter: number }[],
): Promise<void> {
  for (const it of items) {
    const qty = Math.max(0, Math.floor(it.quantityAfter));
    await tx.stockLevel.upsert({
      where: {
        productId_locationKind_locationId: {
          productId: it.productId,
          locationKind: "AGENT",
          locationId: agentId,
        },
      },
      create: {
        productId: it.productId,
        locationKind: "AGENT",
        locationId: agentId,
        quantity: qty,
      },
      update: { quantity: qty },
    });
  }
}

export type AgentStockAdjustmentItemRow = {
  productId: string;
  productName: string;
  quantityBefore: number;
  quantityAfter: number;
  delta: number;
  /** Units currently promised to this agent's confirmed orders (the safe floor). */
  committed: number;
};

export type AgentStockAdjustmentRow = {
  id: string;
  referenceNumber: string;
  agentId: string;
  agentName: string;
  reason: string;
  notes: string | null;
  status: StockAdjustmentStatus;
  date: string;
  createdByName: string;
  approvedByName: string | null;
  createdAt: string;
  items: AgentStockAdjustmentItemRow[];
};

/**
 * List corrections (newest first), enriched with agent / product / user names.
 * The new models carry scalar FK ids only (self-contained), so names are batch-
 * loaded here rather than via Prisma relations.
 */
export async function listAgentStockAdjustments(filter?: {
  createdById?: string;
  status?: StockAdjustmentStatus;
}): Promise<AgentStockAdjustmentRow[]> {
  const rows = await prisma.agentStockAdjustment.findMany({
    where: {
      ...(filter?.createdById ? { createdById: filter.createdById } : {}),
      ...(filter?.status ? { status: filter.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  if (rows.length === 0) return [];

  const agentIds = [...new Set(rows.map((r) => r.agentId))];
  const userIds = [
    ...new Set(
      rows.flatMap((r) => [r.createdById, r.approvedById].filter((v): v is string => !!v)),
    ),
  ];
  const productIds = [...new Set(rows.flatMap((r) => r.items.map((i) => i.productId)))];

  const [agents, users, products, committedRows] = await Promise.all([
    prisma.agent.findMany({ where: { id: { in: agentIds } }, select: { id: true, companyName: true } }),
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }),
    // Units committed to each agent's CONFIRMED orders, per (agent, product) — the
    // safe floor shown on the review card.
    prisma.orderItem.findMany({
      where: {
        productId: { in: productIds },
        order: { agentId: { in: agentIds }, status: "CONFIRMED", deletedAt: null },
      },
      select: { productId: true, quantity: true, order: { select: { agentId: true } } },
    }),
  ]);
  const agentMap = new Map(agents.map((a) => [a.id, a.companyName]));
  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const productMap = new Map(products.map((p) => [p.id, p.name]));
  const committedMap = new Map<string, number>();
  for (const r of committedRows) {
    const key = `${r.order.agentId}:${r.productId}`;
    committedMap.set(key, (committedMap.get(key) ?? 0) + r.quantity);
  }

  return rows.map((r) => ({
    id: r.id,
    referenceNumber: r.referenceNumber,
    agentId: r.agentId,
    agentName: agentMap.get(r.agentId) ?? "Unknown agent",
    reason: r.reason,
    notes: r.notes,
    status: r.status,
    date: r.date.toISOString(),
    createdByName: userMap.get(r.createdById) ?? "Unknown",
    approvedByName: r.approvedById ? userMap.get(r.approvedById) ?? "Unknown" : null,
    createdAt: r.createdAt.toISOString(),
    items: r.items.map((i) => ({
      productId: i.productId,
      productName: productMap.get(i.productId) ?? i.productId,
      quantityBefore: i.quantityBefore,
      quantityAfter: i.quantityAfter,
      delta: i.quantityAfter - i.quantityBefore,
      committed: committedMap.get(`${r.agentId}:${i.productId}`) ?? 0,
    })),
  }));
}
