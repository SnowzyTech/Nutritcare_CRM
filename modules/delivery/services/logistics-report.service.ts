/**
 * Logistics reporting metrics.
 *
 * Feeds the Logistics Daily Executive Update and the Monthly Logistics Report
 * (see docs/reports/). Everything here is a read over a `{from, to}` window.
 *
 * Known gaps in Phase 1, called out on the report itself rather than faked:
 *   • Shelf life / time-gone — no batch, production or expiry date exists on
 *     Product or StockMovement.
 *   • Damage & recovery tracker — DamageReport carries no product, quantity,
 *     category or agent.
 *   • Failed-delivery reason breakdown — Delivery.failureReason is free text.
 *   • Stock audit opening balance — StockLevel is a running balance with no
 *     history, so opening is replayed from StockMovement and is provisional.
 */

import { prisma } from "@/lib/db/prisma";
import type { ScorecardRow } from "@/modules/reports/types";
import { type DateRange, rate, scorecardRow } from "@/modules/reports/services/period.service";

/**
 * Agent delivery-rate bands. Named constants because these thresholds are
 * business policy that gets argued over — the samples band agents Excellent /
 * Good / Monitor / Review and set an 85% delivery target.
 */
export const AGENT_BANDS = {
  excellent: 90,
  good: 80,
  monitor: 70,
} as const;

export const DELIVERY_RATE_TARGET = 85;

export type AgentBand = "Excellent" | "Good" | "Monitor" | "Review";

export function bandFor(ratePct: number): AgentBand {
  if (ratePct >= AGENT_BANDS.excellent) return "Excellent";
  if (ratePct >= AGENT_BANDS.good) return "Good";
  if (ratePct >= AGENT_BANDS.monitor) return "Monitor";
  return "Review";
}

function toNumber(d: { toString(): string } | null | undefined): number {
  return d ? Number(d.toString()) : 0;
}

// ── Scorecard ───────────────────────────────────────────────────────────────

export type LogisticsTotals = {
  ordersDispatched: number;
  ordersDelivered: number;
  deliverySuccessRate: number;
  failedDeliveries: number;
  unitsDelivered: number;
  totalDeliveryCost: number;
  avgDeliveryCost: number;
  avgDeliveryHours: number | null;
};

async function fetchDeliveries(range: DateRange) {
  return prisma.delivery.findMany({
    where: { createdAt: { gte: range.from, lte: range.to } },
    select: {
      status: true,
      createdAt: true,
      deliveredTime: true,
      agentId: true,
      order: {
        select: {
          deliveryFee: true,
          items: { select: { quantity: true, product: { select: { id: true, name: true } } } },
          customer: { select: { state: true } },
        },
      },
    },
  });
}

type DeliveryRow = Awaited<ReturnType<typeof fetchDeliveries>>[number];

function computeLogisticsTotals(deliveries: DeliveryRow[]): LogisticsTotals {
  const dispatched = deliveries.length;
  const delivered = deliveries.filter((d) => d.status === "DELIVERED");
  const failed = deliveries.filter((d) => d.status === "FAILED").length;

  const unitsDelivered = delivered.reduce(
    (sum, d) => sum + d.order.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );

  const totalDeliveryCost = delivered.reduce((sum, d) => sum + toNumber(d.order.deliveryFee), 0);

  const timed = delivered.filter((d) => d.deliveredTime);
  const avgDeliveryHours =
    timed.length > 0
      ? timed.reduce(
          (sum, d) => sum + (d.deliveredTime!.getTime() - d.createdAt.getTime()) / 3_600_000,
          0,
        ) / timed.length
      : null;

  return {
    ordersDispatched: dispatched,
    ordersDelivered: delivered.length,
    deliverySuccessRate: rate(delivered.length, dispatched),
    failedDeliveries: failed,
    unitsDelivered,
    totalDeliveryCost,
    avgDeliveryCost: delivered.length > 0 ? totalDeliveryCost / delivered.length : 0,
    avgDeliveryHours,
  };
}

export async function getLogisticsTotals(range: DateRange): Promise<LogisticsTotals> {
  return computeLogisticsTotals(await fetchDeliveries(range));
}

export async function getLogisticsScorecard(
  range: DateRange,
  priorRange: DateRange | null,
): Promise<{ rows: ScorecardRow[]; current: LogisticsTotals; prior: LogisticsTotals | null }> {
  const [current, prior] = await Promise.all([
    getLogisticsTotals(range),
    priorRange ? getLogisticsTotals(priorRange) : Promise.resolve(null),
  ]);

  const p = <K extends keyof LogisticsTotals>(key: K): number | null => {
    if (!prior) return null;
    const v = prior[key];
    return typeof v === "number" ? v : null;
  };

  const rows: ScorecardRow[] = [
    scorecardRow("Orders Dispatched", "number", current.ordersDispatched, p("ordersDispatched")),
    scorecardRow("Orders Delivered", "number", current.ordersDelivered, p("ordersDelivered")),
    scorecardRow("Delivery Success Rate", "percent", current.deliverySuccessRate, p("deliverySuccessRate")),
    // More failures is worse — invert the polarity for colouring.
    scorecardRow("Failed Deliveries", "number", current.failedDeliveries, p("failedDeliveries"), false),
    scorecardRow("Units Delivered", "number", current.unitsDelivered, p("unitsDelivered")),
    scorecardRow("Total Delivery Cost", "currency", current.totalDeliveryCost, p("totalDeliveryCost"), false),
    scorecardRow("Avg Cost per Delivery", "currency", current.avgDeliveryCost, p("avgDeliveryCost"), false),
  ];

  if (current.avgDeliveryHours !== null) {
    rows.push(
      scorecardRow("Avg Delivery Time (hrs)", "number", current.avgDeliveryHours, p("avgDeliveryHours"), false),
    );
  }

  return { rows, current, prior };
}

// ── Agent performance ───────────────────────────────────────────────────────

export type AgentPerformanceRow = {
  agent: string;
  state: string;
  assigned: number;
  delivered: number;
  ratePct: number;
  unitsHeld: number;
  band: AgentBand;
  /** Percentage-point change vs the prior period; null when the agent is new. */
  deltaPp: number | null;
};

/**
 * Assigned / delivered / rate / units held per agent, banded, with the
 * period-over-period delta the monthly report currently computes by hand
 * ("Pope Anambra 53.8% → 96.0%, +42.2pp").
 */
export async function getAgentPerformance(
  range: DateRange,
  priorRange: DateRange | null = null,
): Promise<AgentPerformanceRow[]> {
  const [deliveries, priorDeliveries, agents, levels] = await Promise.all([
    fetchDeliveries(range),
    priorRange ? fetchDeliveries(priorRange) : Promise.resolve([] as DeliveryRow[]),
    prisma.agent.findMany({
      where: { deletedAt: null },
      select: { id: true, companyName: true, state: true },
    }),
    prisma.stockLevel.findMany({
      where: { locationKind: "AGENT", quantity: { gt: 0 } },
      select: { locationId: true, quantity: true },
    }),
  ]);

  const heldByAgent = new Map<string, number>();
  for (const l of levels) {
    heldByAgent.set(l.locationId, (heldByAgent.get(l.locationId) ?? 0) + l.quantity);
  }

  const tally = (rows: DeliveryRow[]) => {
    const m = new Map<string, { assigned: number; delivered: number }>();
    for (const d of rows) {
      if (!d.agentId) continue;
      const b = m.get(d.agentId) ?? { assigned: 0, delivered: 0 };
      b.assigned += 1;
      if (d.status === "DELIVERED") b.delivered += 1;
      m.set(d.agentId, b);
    }
    return m;
  };

  const currentTally = tally(deliveries);
  const priorTally = tally(priorDeliveries);

  const rows: AgentPerformanceRow[] = [];
  for (const agent of agents) {
    const cur = currentTally.get(agent.id);
    if (!cur || cur.assigned === 0) continue;

    const ratePct = rate(cur.delivered, cur.assigned);
    const prev = priorTally.get(agent.id);
    const deltaPp =
      prev && prev.assigned > 0 ? ratePct - rate(prev.delivered, prev.assigned) : null;

    rows.push({
      agent: agent.companyName,
      state: agent.state ?? "-",
      assigned: cur.assigned,
      delivered: cur.delivered,
      ratePct,
      unitsHeld: heldByAgent.get(agent.id) ?? 0,
      band: bandFor(ratePct),
      deltaPp,
    });
  }

  return rows.sort((a, b) => b.assigned - a.assigned);
}

// ── Delivery by SKU and by state ────────────────────────────────────────────

export type SkuDeliveryRow = {
  product: string;
  unitsDelivered: number;
  sharePct: number;
  priorUnits: number | null;
};

export async function getDeliveryBySku(
  range: DateRange,
  priorRange: DateRange | null = null,
): Promise<SkuDeliveryRow[]> {
  const [deliveries, priorDeliveries] = await Promise.all([
    fetchDeliveries(range),
    priorRange ? fetchDeliveries(priorRange) : Promise.resolve([] as DeliveryRow[]),
  ]);

  const tally = (rows: DeliveryRow[]) => {
    const m = new Map<string, number>();
    for (const d of rows.filter((r) => r.status === "DELIVERED")) {
      for (const item of d.order.items) {
        m.set(item.product.name, (m.get(item.product.name) ?? 0) + item.quantity);
      }
    }
    return m;
  };

  const current = tally(deliveries);
  const prior = tally(priorDeliveries);
  const total = [...current.values()].reduce((s, v) => s + v, 0);

  return [...current.entries()]
    .map(([product, unitsDelivered]) => ({
      product,
      unitsDelivered,
      sharePct: rate(unitsDelivered, total),
      priorUnits: priorRange ? (prior.get(product) ?? 0) : null,
    }))
    .sort((a, b) => b.unitsDelivered - a.unitsDelivered);
}

export type StateDeliveryRow = {
  state: string;
  ordersDelivered: number;
  unitsDelivered: number;
  fieldStock: number;
};

/**
 * Delivery performance by customer state alongside the stock agents are holding
 * in that state — the pairing that surfaced "PH holds 1,008 units, delivered
 * only 260" in the June report.
 */
export async function getStateDeliveryPerformance(range: DateRange): Promise<StateDeliveryRow[]> {
  const [deliveries, fieldStock] = await Promise.all([
    fetchDeliveries(range),
    getFieldStockByState(),
  ]);

  const stockByState = new Map(fieldStock.map((s) => [s.state, s.totalUnits]));
  const m = new Map<string, { orders: number; units: number }>();

  for (const d of deliveries.filter((r) => r.status === "DELIVERED")) {
    const state = d.order.customer?.state ?? "Unknown";
    const b = m.get(state) ?? { orders: 0, units: 0 };
    b.orders += 1;
    b.units += d.order.items.reduce((s, i) => s + i.quantity, 0);
    m.set(state, b);
  }

  return [...m.entries()]
    .map(([state, b]) => ({
      state,
      ordersDelivered: b.orders,
      unitsDelivered: b.units,
      fieldStock: stockByState.get(state) ?? 0,
    }))
    .sort((a, b) => b.unitsDelivered - a.unitsDelivered);
}

// ── Stock positions ─────────────────────────────────────────────────────────

export type FieldStockByStateRow = {
  state: string;
  totalUnits: number;
  byProduct: Record<string, number>;
};

/** Agent-held stock grouped by the agent's state — the sample's state x product matrix. */
export async function getFieldStockByState(): Promise<FieldStockByStateRow[]> {
  const [levels, agents, products] = await Promise.all([
    prisma.stockLevel.findMany({
      where: { locationKind: "AGENT", quantity: { gt: 0 } },
      select: { productId: true, locationId: true, quantity: true },
    }),
    prisma.agent.findMany({ where: { deletedAt: null }, select: { id: true, state: true } }),
    prisma.product.findMany({ select: { id: true, name: true } }),
  ]);

  const stateOf = new Map(agents.map((a) => [a.id, a.state ?? "Unknown"]));
  const nameOf = new Map(products.map((p) => [p.id, p.name]));
  const m = new Map<string, FieldStockByStateRow>();

  for (const l of levels) {
    const state = stateOf.get(l.locationId) ?? "Unknown";
    const product = nameOf.get(l.productId) ?? l.productId;
    const row = m.get(state) ?? { state, totalUnits: 0, byProduct: {} };
    row.totalUnits += l.quantity;
    row.byProduct[product] = (row.byProduct[product] ?? 0) + l.quantity;
    m.set(state, row);
  }

  return [...m.values()].sort((a, b) => b.totalUnits - a.totalUnits);
}

export type WarehouseStockRow = {
  product: string;
  byWarehouse: Record<string, number>;
  total: number;
};

export async function getWarehouseStock(): Promise<{
  rows: WarehouseStockRow[];
  warehouses: string[];
}> {
  const [levels, warehouses, products] = await Promise.all([
    prisma.stockLevel.findMany({
      where: { locationKind: "WAREHOUSE", quantity: { gt: 0 } },
      select: { productId: true, locationId: true, quantity: true },
    }),
    prisma.warehouse.findMany({ select: { id: true, name: true } }),
    prisma.product.findMany({ select: { id: true, name: true } }),
  ]);

  const whName = new Map(warehouses.map((w) => [w.id, w.name]));
  const nameOf = new Map(products.map((p) => [p.id, p.name]));
  const m = new Map<string, WarehouseStockRow>();

  for (const l of levels) {
    const product = nameOf.get(l.productId) ?? l.productId;
    const wh = whName.get(l.locationId) ?? "Unknown";
    const row = m.get(product) ?? { product, byWarehouse: {}, total: 0 };
    row.byWarehouse[wh] = (row.byWarehouse[wh] ?? 0) + l.quantity;
    row.total += l.quantity;
    m.set(product, row);
  }

  return {
    rows: [...m.values()].sort((a, b) => b.total - a.total),
    warehouses: warehouses.map((w) => w.name).sort(),
  };
}

export type DispatchRow = {
  product: string;
  byWarehouse: Record<string, number>;
  total: number;
};

/** Units dispatched out of each warehouse in the window. */
export async function getWarehouseDispatch(
  range: DateRange,
): Promise<{ rows: DispatchRow[]; warehouses: string[] }> {
  const movements = await prisma.stockMovement.findMany({
    where: {
      type: "OUTGOING",
      date: { gte: range.from, lte: range.to },
      warehouseId: { not: null },
    },
    select: {
      warehouse: { select: { name: true } },
      items: { select: { quantity: true, product: { select: { name: true } } } },
    },
  });

  const m = new Map<string, DispatchRow>();
  const warehouses = new Set<string>();

  for (const mv of movements) {
    const wh = mv.warehouse?.name ?? "Unknown";
    warehouses.add(wh);
    for (const item of mv.items) {
      const row = m.get(item.product.name) ?? { product: item.product.name, byWarehouse: {}, total: 0 };
      row.byWarehouse[wh] = (row.byWarehouse[wh] ?? 0) + item.quantity;
      row.total += item.quantity;
      m.set(item.product.name, row);
    }
  }

  return {
    rows: [...m.values()].sort((a, b) => b.total - a.total),
    warehouses: [...warehouses].sort(),
  };
}

// ── Stock audit (provisional) ───────────────────────────────────────────────

export type StockAuditRow = {
  product: string;
  opening: number;
  received: number;
  delivered: number;
  impliedClose: number;
  actualClose: number;
  variance: number;
};

/**
 * Opening / received / delivered / implied close vs actual close.
 *
 * PROVISIONAL. `StockLevel` holds only the current balance with no history, so
 * opening is reconstructed by replaying StockMovement backwards from today.
 * Three call sites write `stockLevel.updateMany` directly without a matching
 * movement row (data-analysis.action.ts:158, delivery-agent-portal.action.ts:120,
 * sales-manager-orders.action.ts:49), so any delta applied through those paths
 * is invisible to the replay and the opening figure will drift. Callers must
 * label this as unverified until a StockSnapshot table exists.
 */
export async function getStockAudit(range: DateRange): Promise<StockAuditRow[]> {
  const [levels, products, movementsSince, deliveries] = await Promise.all([
    prisma.stockLevel.findMany({ select: { productId: true, quantity: true } }),
    prisma.product.findMany({ select: { id: true, name: true } }),
    // Everything that moved from the window start until now, to walk back.
    prisma.stockMovement.findMany({
      where: { date: { gte: range.from } },
      select: {
        type: true,
        date: true,
        items: { select: { productId: true, quantity: true } },
      },
    }),
    fetchDeliveries(range),
  ]);

  const nameOf = new Map(products.map((p) => [p.id, p.name]));

  const closingNow = new Map<string, number>();
  for (const l of levels) {
    closingNow.set(l.productId, (closingNow.get(l.productId) ?? 0) + l.quantity);
  }

  // Net effect on total held stock: INCOMING adds, RETURN adds back, OUTGOING is
  // a transfer between locations we already count, so it nets to zero overall.
  const receivedInWindow = new Map<string, number>();
  const netSinceStart = new Map<string, number>();

  for (const mv of movementsSince) {
    for (const item of mv.items) {
      if (mv.type === "INCOMING") {
        netSinceStart.set(item.productId, (netSinceStart.get(item.productId) ?? 0) + item.quantity);
        if (mv.date <= range.to) {
          receivedInWindow.set(
            item.productId,
            (receivedInWindow.get(item.productId) ?? 0) + item.quantity,
          );
        }
      }
    }
  }

  // Units that left the system entirely (delivered to customers) since the start.
  const deliveredInWindow = new Map<string, number>();
  for (const d of deliveries.filter((r) => r.status === "DELIVERED")) {
    for (const item of d.order.items) {
      deliveredInWindow.set(
        item.product.id,
        (deliveredInWindow.get(item.product.id) ?? 0) + item.quantity,
      );
      netSinceStart.set(item.product.id, (netSinceStart.get(item.product.id) ?? 0) - item.quantity);
    }
  }

  const productIds = new Set<string>([
    ...closingNow.keys(),
    ...receivedInWindow.keys(),
    ...deliveredInWindow.keys(),
  ]);

  const rows: StockAuditRow[] = [];
  for (const productId of productIds) {
    const actualClose = closingNow.get(productId) ?? 0;
    const opening = actualClose - (netSinceStart.get(productId) ?? 0);
    const received = receivedInWindow.get(productId) ?? 0;
    const delivered = deliveredInWindow.get(productId) ?? 0;
    const impliedClose = opening + received - delivered;

    if (opening === 0 && received === 0 && delivered === 0 && actualClose === 0) continue;

    rows.push({
      product: nameOf.get(productId) ?? productId,
      opening,
      received,
      delivered,
      impliedClose,
      actualClose,
      variance: actualClose - impliedClose,
    });
  }

  return rows.sort((a, b) => b.actualClose - a.actualClose);
}

// ── Not-tracked reasons, surfaced on the report ─────────────────────────────

export const NOT_TRACKED = {
  shelfLife:
    "Shelf life cannot be reported yet: no batch number, production date or expiry date is recorded against products or stock movements.",
  damage:
    "The damage and recovery tracker needs product, quantity, category and responsible agent on damage reports. Only a free-text description is captured today.",
  failureReasons:
    "Failed deliveries are recorded with free-text reasons, so they cannot be counted by category. A fixed reason list is required.",
} as const;
