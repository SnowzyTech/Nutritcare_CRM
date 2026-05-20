import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

// ── Location helpers ─────────────────────────────────────────────────────────
// A StockLevel row keys on (productId, locationKind, locationId):
//   • WAREHOUSE  → locationId = warehouseId
//   • AGENT      → locationId = agentId
//   • UNASSIGNED → locationId = "system" (e.g. returns without a warehouse)
//
// Quantities are signed deltas applied transactionally by the write paths.
// Reads query StockLevel directly instead of aggregating StockMovement history.

export type StockLocationKind = "WAREHOUSE" | "AGENT" | "UNASSIGNED";

export const UNASSIGNED_LOCATION_ID = "system";

function warehouseKey(warehouseId: string) {
  return { locationKind: "WAREHOUSE" as const, locationId: warehouseId };
}
function agentKey(agentId: string) {
  return { locationKind: "AGENT" as const, locationId: agentId };
}
function unassignedKey() {
  return { locationKind: "UNASSIGNED" as const, locationId: UNASSIGNED_LOCATION_ID };
}

// ── Core delta primitive ─────────────────────────────────────────────────────

async function applyDelta(
  tx: Tx,
  productId: string,
  loc: { locationKind: StockLocationKind; locationId: string },
  delta: number,
): Promise<void> {
  if (delta === 0) return;
  await tx.stockLevel.upsert({
    where: {
      productId_locationKind_locationId: {
        productId,
        locationKind: loc.locationKind,
        locationId: loc.locationId,
      },
    },
    create: {
      productId,
      locationKind: loc.locationKind,
      locationId: loc.locationId,
      quantity: Math.max(0, delta),
    },
    update: { quantity: { increment: delta } },
  });
}

// ── Public mutation helpers ──────────────────────────────────────────────────
//
// Each helper covers one logical stock event. Callers pass the same tx they're
// using for the underlying StockMovement / PickPack / etc. update so the
// balance and the source-of-truth row commit atomically.

/** Goods received into a warehouse (INCOMING RECORDED → RECEIVED). */
export async function creditWarehouse(
  tx: Tx,
  warehouseId: string,
  items: Array<{ productId: string; quantity: number }>,
): Promise<void> {
  for (const it of items) {
    await applyDelta(tx, it.productId, warehouseKey(warehouseId), it.quantity);
  }
}

/** Reverse of creditWarehouse — undo a receipt. */
export async function debitWarehouse(
  tx: Tx,
  warehouseId: string,
  items: Array<{ productId: string; quantity: number }>,
): Promise<void> {
  for (const it of items) {
    await applyDelta(tx, it.productId, warehouseKey(warehouseId), -it.quantity);
  }
}

/** Goods leaving a warehouse to an agent (PickPack PACKED for OUTGOING). */
export async function transferWarehouseToAgent(
  tx: Tx,
  warehouseId: string,
  agentId: string,
  items: Array<{ productId: string; quantity: number }>,
): Promise<void> {
  for (const it of items) {
    await applyDelta(tx, it.productId, warehouseKey(warehouseId), -it.quantity);
    await applyDelta(tx, it.productId, agentKey(agentId), it.quantity);
  }
}

/** Reverse a warehouse → agent move (e.g. SHELVED → REVERSED). */
export async function reverseWarehouseToAgent(
  tx: Tx,
  warehouseId: string,
  agentId: string,
  items: Array<{ productId: string; quantity: number }>,
): Promise<void> {
  for (const it of items) {
    await applyDelta(tx, it.productId, warehouseKey(warehouseId), it.quantity);
    await applyDelta(tx, it.productId, agentKey(agentId), -it.quantity);
  }
}

/** Agent → agent ownership move (recorded at create time). */
export async function transferAgentToAgent(
  tx: Tx,
  fromAgentId: string,
  toAgentId: string,
  items: Array<{ productId: string; quantity: number }>,
): Promise<void> {
  for (const it of items) {
    await applyDelta(tx, it.productId, agentKey(fromAgentId), -it.quantity);
    await applyDelta(tx, it.productId, agentKey(toAgentId), it.quantity);
  }
}

/** Warehouse → warehouse move (PickPack PACKED for transfer / COMPLETED). */
export async function transferWarehouseToWarehouse(
  tx: Tx,
  fromWarehouseId: string,
  toWarehouseId: string,
  items: Array<{ productId: string; quantity: number }>,
): Promise<void> {
  for (const it of items) {
    await applyDelta(tx, it.productId, warehouseKey(fromWarehouseId), -it.quantity);
    await applyDelta(tx, it.productId, warehouseKey(toWarehouseId), it.quantity);
  }
}

/** Return from an agent. If a warehouseId is provided the stock is credited
 *  there; otherwise it goes to the UNASSIGNED pool. */
export async function recordReturn(
  tx: Tx,
  fromAgentId: string,
  items: Array<{ productId: string; quantity: number }>,
  warehouseId?: string | null,
): Promise<void> {
  for (const it of items) {
    await applyDelta(tx, it.productId, agentKey(fromAgentId), -it.quantity);
    if (warehouseId) {
      await applyDelta(tx, it.productId, warehouseKey(warehouseId), it.quantity);
    } else {
      await applyDelta(tx, it.productId, unassignedKey(), it.quantity);
    }
  }
}

/** Reverse a return. */
export async function reverseReturn(
  tx: Tx,
  fromAgentId: string,
  items: Array<{ productId: string; quantity: number }>,
  warehouseId?: string | null,
): Promise<void> {
  for (const it of items) {
    await applyDelta(tx, it.productId, agentKey(fromAgentId), it.quantity);
    if (warehouseId) {
      await applyDelta(tx, it.productId, warehouseKey(warehouseId), -it.quantity);
    } else {
      await applyDelta(tx, it.productId, unassignedKey(), -it.quantity);
    }
  }
}

/** Manual adjustment: set warehouse stock from `before` → `after`. */
export async function recordAdjustment(
  tx: Tx,
  warehouseId: string,
  items: Array<{ productId: string; quantityBefore: number; quantityAfter: number }>,
): Promise<void> {
  for (const it of items) {
    const delta = it.quantityAfter - it.quantityBefore;
    if (delta !== 0) {
      await applyDelta(tx, it.productId, warehouseKey(warehouseId), delta);
    }
  }
}

/** Reverse a manual adjustment: invert the delta. */
export async function reverseAdjustment(
  tx: Tx,
  warehouseId: string,
  items: Array<{ productId: string; quantityBefore: number; quantityAfter: number }>,
): Promise<void> {
  for (const it of items) {
    const delta = it.quantityBefore - it.quantityAfter;
    if (delta !== 0) {
      await applyDelta(tx, it.productId, warehouseKey(warehouseId), delta);
    }
  }
}

// ── Read helpers ─────────────────────────────────────────────────────────────

/** Total stock per product across every location. */
export async function getProductTotalsMap(): Promise<Record<string, number>> {
  const rows = await prisma.stockLevel.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
  });
  const map: Record<string, number> = {};
  for (const r of rows) map[r.productId] = Math.max(0, r._sum.quantity ?? 0);
  return map;
}

/** Per-warehouse stock: warehouseId → productId → quantity. */
export async function getWarehouseStockMap(): Promise<Record<string, Record<string, number>>> {
  const rows = await prisma.stockLevel.findMany({
    where: { locationKind: "WAREHOUSE" },
    select: { productId: true, locationId: true, quantity: true },
  });
  const map: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    map[r.locationId] ??= {};
    map[r.locationId][r.productId] = Math.max(0, r.quantity);
  }
  return map;
}

/** Per-agent stock: agentId → productId → quantity. */
export async function getAgentStockMap(): Promise<Record<string, Record<string, number>>> {
  const rows = await prisma.stockLevel.findMany({
    where: { locationKind: "AGENT" },
    select: { productId: true, locationId: true, quantity: true },
  });
  const map: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    map[r.locationId] ??= {};
    map[r.locationId][r.productId] = Math.max(0, r.quantity);
  }
  return map;
}

/** Single-product, single-warehouse balance (used for availability checks). */
export async function getWarehouseProductStock(
  tx: Tx | typeof prisma,
  warehouseId: string,
  productId: string,
): Promise<number> {
  const row = await tx.stockLevel.findUnique({
    where: {
      productId_locationKind_locationId: {
        productId,
        locationKind: "WAREHOUSE",
        locationId: warehouseId,
      },
    },
    select: { quantity: true },
  });
  return Math.max(0, row?.quantity ?? 0);
}

/** Single-product, single-agent balance. */
export async function getAgentProductStock(
  tx: Tx | typeof prisma,
  agentId: string,
  productId: string,
): Promise<number> {
  const row = await tx.stockLevel.findUnique({
    where: {
      productId_locationKind_locationId: {
        productId,
        locationKind: "AGENT",
        locationId: agentId,
      },
    },
    select: { quantity: true },
  });
  return Math.max(0, row?.quantity ?? 0);
}

// ── Rebuild / backfill ───────────────────────────────────────────────────────
// Recomputes every StockLevel row from the existing StockMovement / StockTransfer
// / StockAdjustment history. Use this once to populate balances from legacy data,
// or as a reconciliation tool if the live deltas ever drift.

type Delta = { productId: string; locationKind: StockLocationKind; locationId: string; delta: number };

export async function rebuildStockLevels(): Promise<{ rows: number }> {
  const [movementItems, transferItems, adjustments, packedPicks] = await Promise.all([
    prisma.stockMovementItem.findMany({
      include: {
        stockMovement: {
          select: {
            id: true,
            type: true,
            status: true,
            warehouseId: true,
            agentId: true,
            toAgentId: true,
            isAgentToAgentTransfer: true,
          },
        },
      },
    }),
    prisma.stockTransferItem.findMany({
      include: {
        stockTransfer: {
          select: { status: true, sourceType: true, sourceId: true, targetType: true, targetId: true },
        },
      },
    }),
    prisma.stockAdjustment.findMany({
      where: { status: "RECORDED" },
      select: {
        warehouseId: true,
        items: { select: { productId: true, quantityBefore: true, quantityAfter: true } },
      },
    }),
    prisma.pickPack.findMany({
      where: { stockMovementId: { not: null }, status: { in: ["PACKED", "DISPATCHED"] } },
      select: { stockMovementId: true },
    }),
  ]);

  const packedMovementIds = new Set(packedPicks.map(p => p.stockMovementId!));
  const deltas: Delta[] = [];

  for (const item of movementItems) {
    const m = item.stockMovement;
    if (m.type === "INCOMING" && (m.status === "RECEIVED" || m.status === "SHELVED") && m.warehouseId) {
      deltas.push({ productId: item.productId, locationKind: "WAREHOUSE", locationId: m.warehouseId, delta: item.quantity });
    } else if (m.type === "OUTGOING" && m.status !== "REVERSED") {
      if (m.isAgentToAgentTransfer && m.agentId && m.toAgentId) {
        deltas.push({ productId: item.productId, locationKind: "AGENT", locationId: m.agentId, delta: -item.quantity });
        deltas.push({ productId: item.productId, locationKind: "AGENT", locationId: m.toAgentId, delta: item.quantity });
      } else if (m.warehouseId && m.toAgentId) {
        // Credit on SHELVED (goods left the warehouse) or once a PickPack reaches PACKED.
        const settled = m.status === "SHELVED" || packedMovementIds.has(m.id);
        if (settled) {
          deltas.push({ productId: item.productId, locationKind: "WAREHOUSE", locationId: m.warehouseId, delta: -item.quantity });
          deltas.push({ productId: item.productId, locationKind: "AGENT", locationId: m.toAgentId, delta: item.quantity });
        }
      }
    } else if (m.type === "RETURN" && m.status !== "REVERSED" && m.agentId) {
      deltas.push({ productId: item.productId, locationKind: "AGENT", locationId: m.agentId, delta: -item.quantity });
      if (m.warehouseId) {
        deltas.push({ productId: item.productId, locationKind: "WAREHOUSE", locationId: m.warehouseId, delta: item.quantity });
      } else {
        deltas.push({ productId: item.productId, locationKind: "UNASSIGNED", locationId: UNASSIGNED_LOCATION_ID, delta: item.quantity });
      }
    }
  }

  for (const item of transferItems) {
    const t = item.stockTransfer;
    if (t.status !== "COMPLETED") continue;
    if (t.sourceType === "WAREHOUSE") {
      deltas.push({ productId: item.productId, locationKind: "WAREHOUSE", locationId: t.sourceId, delta: -item.quantity });
    } else {
      deltas.push({ productId: item.productId, locationKind: "AGENT", locationId: t.sourceId, delta: -item.quantity });
    }
    if (t.targetType === "WAREHOUSE") {
      deltas.push({ productId: item.productId, locationKind: "WAREHOUSE", locationId: t.targetId, delta: item.quantity });
    } else {
      deltas.push({ productId: item.productId, locationKind: "AGENT", locationId: t.targetId, delta: item.quantity });
    }
  }

  for (const adj of adjustments) {
    for (const it of adj.items) {
      const d = it.quantityAfter - it.quantityBefore;
      if (d !== 0) {
        deltas.push({ productId: it.productId, locationKind: "WAREHOUSE", locationId: adj.warehouseId, delta: d });
      }
    }
  }

  // Aggregate deltas by (productId, locationKind, locationId).
  const totals = new Map<string, { productId: string; locationKind: StockLocationKind; locationId: string; quantity: number }>();
  for (const d of deltas) {
    const key = `${d.productId}::${d.locationKind}::${d.locationId}`;
    const cur = totals.get(key) ?? { productId: d.productId, locationKind: d.locationKind, locationId: d.locationId, quantity: 0 };
    cur.quantity += d.delta;
    totals.set(key, cur);
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockLevel.deleteMany({});
    for (const v of totals.values()) {
      if (v.quantity === 0) continue;
      await tx.stockLevel.create({
        data: {
          productId: v.productId,
          locationKind: v.locationKind,
          locationId: v.locationId,
          quantity: Math.max(0, v.quantity),
        },
      });
    }
  });

  return { rows: Array.from(totals.values()).filter(v => v.quantity !== 0).length };
}
