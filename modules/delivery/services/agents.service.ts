import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { monthRanges, parseMonthParam, type MonthPeriod } from "@/lib/month-period";
import { dateRanges, type DatePeriod } from "@/lib/date-period";

type Tx = Prisma.TransactionClient;

/**
 * Serialises concurrent stock decisions for a single agent using a per-agent
 * Postgres advisory lock scoped to the current transaction. Two confirmations
 * competing for the SAME agent run one-at-a-time (a few ms each); different
 * agents never block each other. Auto-releases on commit/rollback.
 */
export async function lockAgent(tx: Tx, agentId: string): Promise<void> {
  // $executeRaw (not $queryRaw): pg_advisory_xact_lock returns void, which
  // $queryRaw can't deserialize. $executeRaw runs the statement and returns a
  // row count, so the lock is taken without a deserialization error.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${agentId})::bigint)`;
}

/** An order line. `product.name` is carried for messaging only. */
export type StockLine = {
  productId: string;
  quantity: number;
  product?: { name: string } | null;
};

/** How far short an agent is on one product. */
export type StockShortfall = {
  productId: string;
  productName: string;
  needed: number;
  /** Units available in the checked mode; can be negative in "available" mode. */
  have: number;
};

/**
 * Stock already promised to an agent's CONFIRMED (not yet delivered/failed/
 * cancelled) orders, per product. This is the system's ONLY notion of a
 * "booking" - nothing is materialised, the CONFIRMED order *is* the commitment.
 *
 * It is a REPORTING figure, not a gate. Commit paths deliberately do not block on
 * it (see {@link checkAgentOnHandStock}); it drives agent preference during
 * assignment, the over-booking reports and the stock-correction warnings.
 *
 * Single definition, shared with the agent-stock correction tool - do not
 * re-implement it.
 */
export async function getAgentCommittedQuantities(
  tx: Tx,
  agentId: string,
  productIds: string[],
): Promise<Record<string, number>> {
  if (productIds.length === 0) return {};

  const rows = await tx.orderItem.findMany({
    where: {
      productId: { in: productIds },
      order: { agentId, status: "CONFIRMED", deletedAt: null },
    },
    select: { productId: true, quantity: true },
  });

  const committed: Record<string, number> = {};
  for (const r of rows) committed[r.productId] = (committed[r.productId] ?? 0) + r.quantity;
  return committed;
}

export type StockCheckResult = { ok: true } | { ok: false; shortfalls: StockShortfall[] };

/**
 * Does the agent PHYSICALLY HOLD enough for `items`? Returns the per-product
 * shortfalls rather than a bare boolean so callers can say what is actually short.
 *
 * On-hand, deliberately NOT on-hand-minus-committed. Committing an order to an
 * agent who has already promised these units elsewhere is allowed: the older
 * booking must never make a newer, more urgent order un-confirmable. What must
 * never happen is delivering stock that isn't there, so the zero floor is enforced
 * once, at the point of consumption - `debitAgentForDelivery`, via `deliverOrder`.
 *
 * Call INSIDE a transaction that has taken `lockAgent(tx, agentId)` so the read is
 * serialised against concurrent confirmations/deliveries for the same agent.
 */
export async function checkAgentOnHandStock(
  tx: Tx,
  agentId: string,
  items: StockLine[],
): Promise<StockCheckResult> {
  const productIds = [...new Set(items.map((i) => i.productId))];

  const stockRows = await tx.stockLevel.findMany({
    where: { locationKind: "AGENT", locationId: agentId, productId: { in: productIds } },
    select: { productId: true, quantity: true },
  });

  const stock: Record<string, number> = {};
  for (const r of stockRows) stock[r.productId] = Math.max(0, r.quantity);

  // Aggregate the request per product (handles duplicate product lines).
  const requested: Record<string, number> = {};
  const nameOf: Record<string, string> = {};
  for (const it of items) {
    requested[it.productId] = (requested[it.productId] ?? 0) + it.quantity;
    if (it.product?.name) nameOf[it.productId] = it.product.name;
  }

  const shortfalls: StockShortfall[] = [];
  for (const [productId, needed] of Object.entries(requested)) {
    const have = stock[productId] ?? 0;
    if (have < needed) {
      shortfalls.push({ productId, productName: nameOf[productId] ?? "this product", needed, have });
    }
  }

  return shortfalls.length === 0 ? { ok: true } : { ok: false, shortfalls };
}

/**
 * Outcome of picking a delivery agent for an order.
 *
 * Success carries `overbooked`: the agent physically holds the goods, but part of
 * that stock is already promised to their other CONFIRMED orders. That is allowed
 * on purpose - assignment must never be blocked by an earlier booking - and the
 * shortfall is surfaced to the confirming user as a warning, then enforced for
 * real at delivery time (`deliverOrder`), which is where stock is consumed.
 *
 * A bare `string | null` couldn't tell the failure modes apart, so every caller
 * showed one catch-all message for problems with very different fixes. The reasons
 * below let `formatAgentUnavailableMessage()` say which one actually happened.
 */
export type AgentSelectionResult =
  | { ok: true; agentId: string; overbooked: false }
  | { ok: true; agentId: string; overbooked: true; shortfalls: StockShortfall[] }
  | { ok: false; reason: "no_agent_in_state" }
  | {
      ok: false;
      reason: "insufficient_stock";
      shortfalls: { productName: string; needed: number; bestHeld: number }[];
    }
  | { ok: false; reason: "no_single_agent_covers_all_items" };

/**
 * Finds the best delivery agent for an order:
 *  1. State match (`agent.state` or `statesCovered` must include `customerState`)
 *  2. TIER 1 - an agent whose FREE stock (on-hand minus committed) covers every
 *     line, tie-broken by fewest active CONFIRMED orders (load balancing). This
 *     keeps the tidy old behaviour whenever stock allows it.
 *  3. TIER 2 - if nobody has free stock, any agent who PHYSICALLY HOLDS every line,
 *     picked so the resulting over-book is as small as possible. An order is no
 *     longer blocked just because earlier orders booked the stock; the real guard
 *     now sits at delivery.
 *  4. Blocked only when no single agent in the state is holding the whole order.
 *
 * One agent must cover the WHOLE order - orders are never split across agents.
 */
export async function findEligibleAgentForOrder(
  customerState: string,
  orderItems: StockLine[],
): Promise<AgentSelectionResult> {
  const agents = await prisma.agent.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    select: { id: true, state: true, statesCovered: true },
  });

  const normalised = customerState.trim().toLowerCase();

  const stateMatched = agents.filter((agent) => {
    if (agent.state?.trim().toLowerCase() === normalised) return true;
    if (Array.isArray(agent.statesCovered)) {
      return (agent.statesCovered as string[]).some(
        (s) => typeof s === "string" && s.trim().toLowerCase() === normalised,
      );
    }
    return false;
  });

  if (stateMatched.length === 0) return { ok: false, reason: "no_agent_in_state" };

  const agentIds = stateMatched.map((a) => a.id);
  const productIds = [...new Set(orderItems.map((i) => i.productId))];

  const [stockRows, committedItems, orderCounts] = await Promise.all([
    prisma.stockLevel.findMany({
      where: { locationKind: "AGENT", locationId: { in: agentIds }, productId: { in: productIds } },
      select: { locationId: true, productId: true, quantity: true },
    }),
    // Stock already promised to each agent's CONFIRMED (undelivered) orders. Used
    // to PREFER a less-loaded agent, never to rule one out.
    prisma.orderItem.findMany({
      where: {
        productId: { in: productIds },
        order: { agentId: { in: agentIds }, status: "CONFIRMED", deletedAt: null },
      },
      select: { productId: true, quantity: true, order: { select: { agentId: true } } },
    }),
    prisma.order.groupBy({
      by: ["agentId"],
      where: { agentId: { in: agentIds }, status: "CONFIRMED", deletedAt: null },
      _count: { id: true },
    }),
  ]);

  // agentId -> productId -> qty
  const stockMap: Record<string, Record<string, number>> = {};
  for (const row of stockRows) {
    stockMap[row.locationId] ??= {};
    stockMap[row.locationId][row.productId] = Math.max(0, row.quantity);
  }

  const committedMap: Record<string, Record<string, number>> = {};
  for (const it of committedItems) {
    const aId = it.order.agentId;
    if (!aId) continue;
    committedMap[aId] ??= {};
    committedMap[aId][it.productId] = (committedMap[aId][it.productId] ?? 0) + it.quantity;
  }

  const countMap: Record<string, number> = {};
  for (const row of orderCounts) {
    if (row.agentId) countMap[row.agentId] = row._count.id;
  }

  const heldBy = (agentId: string, productId: string) => stockMap[agentId]?.[productId] ?? 0;
  const freeFor = (agentId: string, productId: string) =>
    heldBy(agentId, productId) - (committedMap[agentId]?.[productId] ?? 0);

  // Aggregate the request per product (handles duplicate product lines) so this
  // matches the authoritative check in `checkAgentStock`, which also aggregates -
  // otherwise a split line could pass here and then be rejected under the lock.
  const needed: Record<string, number> = {};
  const nameOf: Record<string, string> = {};
  for (const it of orderItems) {
    needed[it.productId] = (needed[it.productId] ?? 0) + it.quantity;
    if (it.product?.name) nameOf[it.productId] = it.product.name;
  }
  const neededEntries = Object.entries(needed);

  const byFewestOrders = (a: string, b: string) => (countMap[a] ?? 0) - (countMap[b] ?? 0);

  // Tier 1: agents with free (uncommitted) stock.
  const withFreeStock = agentIds.filter((agentId) =>
    neededEntries.every(([pid, qty]) => freeFor(agentId, pid) >= qty),
  );
  if (withFreeStock.length > 0) {
    return { ok: true, agentId: withFreeStock.sort(byFewestOrders)[0], overbooked: false };
  }

  // Tier 2: agents physically holding the goods - over-booking allowed.
  const holding = agentIds.filter((agentId) =>
    neededEntries.every(([pid, qty]) => heldBy(agentId, pid) >= qty),
  );
  if (holding.length > 0) {
    // Spread the over-book: prefer whoever ends up least short, then least loaded.
    const deficitOf = (agentId: string) =>
      Math.max(0, ...neededEntries.map(([pid, qty]) => qty - freeFor(agentId, pid)));
    const agentId = holding.sort((a, b) => deficitOf(a) - deficitOf(b) || byFewestOrders(a, b))[0];

    const shortfalls: StockShortfall[] = neededEntries
      .map(([productId, qty]) => ({
        productId,
        productName: nameOf[productId] ?? "this product",
        needed: qty,
        have: freeFor(agentId, productId),
      }))
      .filter((s) => s.have < s.needed);

    return { ok: true, agentId, overbooked: true, shortfalls };
  }

  // Blocked: nobody in the state is holding the order.
  const shortfalls = neededEntries
    .map(([productId, qty]) => ({
      productName: nameOf[productId] ?? "this product",
      needed: qty,
      bestHeld: Math.max(0, ...agentIds.map((id) => heldBy(id, productId))),
    }))
    .filter((s) => s.bestHeld < s.needed);

  // Every line is individually held somewhere, but no single agent holds them all
  // together - reporting a per-product shortfall here would be a lie.
  if (shortfalls.length === 0) return { ok: false, reason: "no_single_agent_covers_all_items" };
  return { ok: false, reason: "insufficient_stock", shortfalls };
}

/**
 * The message shown when no agent could be assigned. Shared by every confirm path
 * so rep and admin see the same diagnosis for the same underlying state.
 *
 * Reaching this now means a genuine stock-out in the area - stock held by another
 * confirmed order no longer blocks assignment - so it deliberately does NOT say
 * "try again later".
 */
export function formatAgentUnavailableMessage(
  result: Extract<AgentSelectionResult, { ok: false }>,
  customerState: string,
): string {
  const state = customerState.trim() || "this area";

  switch (result.reason) {
    case "no_agent_in_state":
      return `No delivery agent covers ${state}. Please contact your manager to assign an agent to this area.`;

    case "insufficient_stock": {
      const detail = result.shortfalls
        .map((s) => `${s.productName} (need ${s.needed}, best-stocked agent is holding ${s.bestHeld})`)
        .join("; ");
      return `No delivery agent in ${state} is holding enough stock for this order: ${detail}. Retrying won't help - please contact your manager to restock the agents in this area.`;
    }

    case "no_single_agent_covers_all_items":
      return `No single delivery agent in ${state} is holding every item on this order at once. Please contact your manager to restock, or place the items as separate orders.`;
  }
}

/**
 * Toast text after a confirmation that over-booked the agent. Not an error - the
 * order IS confirmed; this tells the office to restock before the delivery date,
 * because `deliverOrder` will refuse the delivery if the stock isn't there.
 */
export function formatOverbookedWarning(
  shortfalls: StockShortfall[],
  agentName?: string | null,
): string {
  const detail = shortfalls.map((s) => `${s.productName} (short ${s.needed - s.have})`).join("; ");
  const who = agentName ? `${agentName} is` : "the assigned agent is";
  return `Confirmed, but ${who} now over-booked: ${detail}. Restock the agent before the delivery date or this delivery will be refused.`;
}

export type OverbookedRow = {
  agentId: string;
  agentName: string;
  state: string | null;
  productId: string;
  productName: string;
  held: number;
  committed: number;
  short: number;
};

/**
 * Agents whose CONFIRMED orders promise more units of a product than they hold.
 * Over-booking is legal at assignment, so this is the work queue that inventory
 * and logistics clear so it never turns into a refused delivery.
 *
 * Aggregated in SQL rather than findMany + reduce: Prisma `groupBy` can't group by
 * a relation field, and this runs on dashboards.
 */
export async function getOverbookedAgents(): Promise<OverbookedRow[]> {
  return prisma.$queryRaw<OverbookedRow[]>`
    SELECT
      a.id                                                AS "agentId",
      a."companyName"                                     AS "agentName",
      a.state                                             AS "state",
      p.id                                                AS "productId",
      p.name                                              AS "productName",
      COALESCE(sl.quantity, 0)::int                       AS "held",
      SUM(oi.quantity)::int                               AS "committed",
      (SUM(oi.quantity) - COALESCE(sl.quantity, 0))::int  AS "short"
    FROM order_items oi
    JOIN orders   o ON o.id = oi."orderId"
    JOIN agents   a ON a.id = o."agentId"
    JOIN products p ON p.id = oi."productId"
    LEFT JOIN stock_levels sl
      ON sl."productId"    = oi."productId"
     AND sl."locationKind" = 'AGENT'
     AND sl."locationId"   = o."agentId"
    WHERE o.status = 'CONFIRMED'
      AND o."deletedAt" IS NULL
      AND a."deletedAt" IS NULL
    GROUP BY a.id, a."companyName", a.state, p.id, p.name, sl.quantity
    HAVING SUM(oi.quantity) > COALESCE(sl.quantity, 0)
    ORDER BY (SUM(oi.quantity) - COALESCE(sl.quantity, 0)) DESC
  `;
}

function trendLabel(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "—";
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

export async function getDeliveryAgentsList() {
  const agents = await prisma.agent.findMany({
    where: { deletedAt: null, user: { isNot: null } },
    select: {
      id: true,
      companyName: true,
      state: true,
      address: true,
      phone1: true,
      phone2: true,
      phone3: true,
      status: true,
      createdAt: true,
      addedBy: { select: { name: true } },
      user: { select: { id: true } },
    },
    orderBy: { companyName: "asc" },
  });

  const agentIds = agents.map(a => a.id);

  // Pending orders: CONFIRMED or PENDING orders assigned to agent
  const pendingStats = await prisma.order.groupBy({
    by: ["agentId"],
    where: { agentId: { in: agentIds }, status: { in: ["PENDING", "CONFIRMED"] }, deletedAt: null },
    _count: { id: true },
  });
  const pendingMap: Record<string, number> = {};
  for (const s of pendingStats) {
    if (s.agentId) pendingMap[s.agentId] = s._count.id;
  }

  // Delivery stats for performance
  const deliveryStats = await prisma.delivery.groupBy({
    by: ["agentId", "status"],
    where: { agentId: { in: agentIds } },
    _count: { id: true },
  });
  const delivMap: Record<string, Record<string, number>> = {};
  for (const d of deliveryStats) {
    if (!d.agentId) continue;
    delivMap[d.agentId] ??= {};
    delivMap[d.agentId][d.status] = d._count.id;
  }

  return agents.map(agent => {
    const d = delivMap[agent.id] ?? {};
    const delivered = d.DELIVERED ?? 0;
    const failed = d.FAILED ?? 0;
    const dispatched = delivered + failed;
    const performance = dispatched > 0 ? Math.round((delivered / dispatched) * 100) : 0;
    return {
      ...agent,
      pendingOrders: pendingMap[agent.id] ?? 0,
      performance,
    };
  });
}

export type DeliveryAgentOverviewRow = {
  id: string;
  name: string; // company name
  state: string | null;
  phone: string | null;
  avatarUrl: string | null;
  delivered: number; // orders DELIVERED within the window (by deliveredTime)
  failed: number; // deliveries marked FAILED within the window
  pending: number; // current outstanding backlog (as of now, not window-scoped)
  totalProductsDelivered: number; // units in the orders delivered within the window
  bestProduct: string | null;
  trends: {
    delivered: string;
    failed: string;
    totalProductsDelivered: string;
  };
};

/**
 * Department-wide delivery-agent overview for a day/date range.
 *
 * Delivery is tracked on the delivery record: when an agent marks an order
 * delivered we stamp `Delivery.deliveredTime`. So "Orders Delivered" and
 * "Products Delivered" are windowed by the ACTUAL delivered date — i.e. what
 * the agent delivered *today*, not when the order was placed. "Failed" is
 * windowed by `Delivery.updatedAt` (no dedicated failed-time). "Pending" is the
 * current outstanding backlog (orders assigned but not yet delivered) as of now.
 */
export async function getDeliveryAgentOverview(
  period: DatePeriod
): Promise<DeliveryAgentOverviewRow[]> {
  const { currentStart, currentEnd, prevStart, prevEnd } = dateRanges(period);

  const agents = await prisma.agent.findMany({
    where: { deletedAt: null, user: { isNot: null } },
    select: {
      id: true,
      companyName: true,
      state: true,
      phone1: true,
      user: { select: { avatarUrl: true } },
    },
    orderBy: { companyName: "asc" },
  });
  if (agents.length === 0) return [];
  const agentIds = agents.map((a) => a.id);

  // Deliveries that were completed or failed anywhere in the current-or-previous
  // window. Delivered rows are matched on `deliveredTime`, failed on `updatedAt`.
  const deliveries = await prisma.delivery.findMany({
    where: {
      agentId: { in: agentIds },
      OR: [
        { status: "DELIVERED", deliveredTime: { gte: prevStart, lte: currentEnd } },
        { status: "FAILED", updatedAt: { gte: prevStart, lte: currentEnd } },
      ],
    },
    select: {
      agentId: true,
      status: true,
      deliveredTime: true,
      updatedAt: true,
      order: {
        select: { items: { select: { productId: true, quantity: true, product: { select: { name: true } } } } },
      },
    },
  });

  // Current outstanding backlog (as of now) — orders assigned but not delivered.
  const pendingStats = await prisma.order.groupBy({
    by: ["agentId"],
    where: { agentId: { in: agentIds }, status: { in: ["PENDING", "CONFIRMED"] }, deletedAt: null },
    _count: { id: true },
  });
  const pendingMap = new Map<string, number>();
  for (const s of pendingStats) if (s.agentId) pendingMap.set(s.agentId, s._count.id);

  type Metrics = {
    delivered: number;
    failed: number;
    products: number;
    productMap: Record<string, { name: string; qty: number }>;
  };
  const blank = (): Metrics => ({ delivered: 0, failed: 0, products: 0, productMap: {} });
  const cur = new Map<string, Metrics>();
  const prev = new Map<string, Metrics>();
  for (const id of agentIds) {
    cur.set(id, blank());
    prev.set(id, blank());
  }

  const inWindow = (d: Date | null, start: Date, end: Date) => !!d && d >= start && d <= end;

  for (const d of deliveries) {
    if (!d.agentId) continue;
    let bucket: Metrics | null = null;
    if (d.status === "DELIVERED") {
      if (inWindow(d.deliveredTime, currentStart, currentEnd)) bucket = cur.get(d.agentId)!;
      else if (inWindow(d.deliveredTime, prevStart, prevEnd)) bucket = prev.get(d.agentId)!;
      if (bucket) {
        bucket.delivered += 1;
        d.order.items.forEach((item) => {
          bucket!.productMap[item.productId] ??= { name: item.product.name, qty: 0 };
          bucket!.productMap[item.productId].qty += item.quantity;
          bucket!.products += item.quantity;
        });
      }
    } else if (d.status === "FAILED") {
      if (inWindow(d.updatedAt, currentStart, currentEnd)) bucket = cur.get(d.agentId)!;
      else if (inWindow(d.updatedAt, prevStart, prevEnd)) bucket = prev.get(d.agentId)!;
      if (bucket) bucket.failed += 1;
    }
  }

  return agents.map((a) => {
    const c = cur.get(a.id)!;
    const p = prev.get(a.id)!;
    const bestProduct = Object.values(c.productMap).sort((x, y) => y.qty - x.qty)[0] ?? null;
    return {
      id: a.id,
      name: a.companyName,
      state: a.state,
      phone: a.phone1,
      avatarUrl: a.user?.avatarUrl ?? null,
      delivered: c.delivered,
      failed: c.failed,
      pending: pendingMap.get(a.id) ?? 0,
      totalProductsDelivered: c.products,
      bestProduct: bestProduct?.name ?? null,
      trends: {
        delivered: trendLabel(c.delivered, p.delivered),
        failed: trendLabel(c.failed, p.failed),
        totalProductsDelivered: trendLabel(c.products, p.products),
      },
    };
  });
}

export async function getAgentsForReassignment() {
  return prisma.agent.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      companyName: true,
      state: true,
      phone1: true,
      _count: { select: { orders: true, deliveries: true } },
    },
    orderBy: { companyName: "asc" },
  });
}

export async function getDeliveryAgentById(id: string) {
  return prisma.agent.findUnique({
    where: { id },
    select: {
      id: true, companyName: true, state: true, phone1: true, phone2: true,
      phone3: true, status: true, statesCovered: true, createdAt: true,
      addedBy: { select: { name: true } },
      user: { select: { email: true, avatarUrl: true } },
    },
  });
}

export async function getDeliveryAgentOrderSummary(agentId: string) {
  // All orders assigned to this agent
  const orderStats = await prisma.order.groupBy({
    by: ["status"],
    where: { agentId, deletedAt: null },
    _count: { id: true },
  });
  const orderMap = Object.fromEntries(orderStats.map(s => [s.status, s._count.id]));
  const totalOrders = Object.values(orderMap).reduce((a, b) => a + b, 0);

  // Delivery status breakdown
  const delivStats = await prisma.delivery.groupBy({
    by: ["status"],
    where: { agentId },
    _count: { id: true },
  });
  const delivMap = Object.fromEntries(delivStats.map(s => [s.status, s._count.id]));

  const pendingDeliveries = (delivMap.PENDING_DISPATCH ?? 0) + (delivMap.IN_TRANSIT ?? 0);
  const delivered = delivMap.DELIVERED ?? 0;
  const failed = delivMap.FAILED ?? 0;

  // Pending = orders with PENDING/CONFIRMED status (not yet dispatched)
  const pendingOrders = (orderMap.PENDING ?? 0) + (orderMap.CONFIRMED ?? 0);

  return {
    total: totalOrders,
    pending: pendingOrders + pendingDeliveries,
    delivered,
    failed,
  };
}

export async function updateAgentStatus(id: string, status: "ACTIVE" | "INACTIVE") {
  return prisma.agent.update({ where: { id }, data: { status } });
}

/**
 * True if the agent has any business records that must be preserved — orders,
 * deliveries, stock movements/transfers, or accounting settlements/ledger/
 * adjustments. Such an agent cannot be fully deleted. The auto-created login
 * account and group chat are NOT records (they are cleaned up on delete).
 */
export async function agentHasRecords(tx: Tx, agentId: string): Promise<boolean> {
  const [orders, deliveries, movements, transfers, settlements, ledger, adjustments] =
    await Promise.all([
      tx.order.count({ where: { agentId } }),
      tx.delivery.count({ where: { agentId } }),
      tx.stockMovement.count({
        where: { OR: [{ agentId }, { driverAgentId: agentId }, { toAgentId: agentId }] },
      }),
      tx.stockTransfer.count({ where: { driverAgentId: agentId } }),
      tx.agentSettlement.count({ where: { agentId } }),
      tx.agentLedgerEntry.count({ where: { agentId } }),
      tx.settlementAdjustment.count({ where: { agentId } }),
    ]);
  return orders + deliveries + movements + transfers + settlements + ledger + adjustments > 0;
}

/**
 * Hard-removes an agent and everything auto-created with it: the agent's group
 * chat (cascades its members/messages/mentions) and the agent's login account
 * (cascades notifications/memberships/mentions). This frees the globally-unique
 * email + phone1 for reuse. The CALLER must have verified the agent has no
 * business records first (see {@link agentHasRecords}) — this does not re-check.
 */
export async function purgeAgentCompletely(tx: Tx, agentId: string): Promise<void> {
  // Group chat first — its members, messages and mentions cascade away with it.
  await tx.conversation.deleteMany({ where: { agentId } });
  // Detach any stray messages this agent's login sent elsewhere (e.g. DMs) so
  // the RESTRICT FK on Message.sender can't block the user delete (null = system).
  const users = await tx.user.findMany({ where: { agentId }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  if (userIds.length > 0) {
    await tx.message.updateMany({
      where: { senderId: { in: userIds } },
      data: { senderId: null },
    });
    // The agent's own login/logout audit rows (a RESTRICT FK) would otherwise
    // block the user delete. Their lifecycle audit ("Created/Deleted agent …")
    // is logged under the manager who acted, so dropping just this account's
    // entries loses nothing meaningful.
    await tx.auditLog.deleteMany({ where: { userId: { in: userIds } } });
  }
  await tx.user.deleteMany({ where: { agentId } });
  await tx.agent.delete({ where: { id: agentId } });
}

/**
 * Deletes an agent only when they have no business records: a records-free agent
 * is fully removed (freeing their email/phone for reuse), while an agent with
 * history is refused with a message the caller surfaces. Replaces the old
 * soft-delete (which hid the agent but left its unique email/phone claimed).
 */
export async function deleteAgentCompletely(id: string): Promise<{ name: string }> {
  return prisma.$transaction(async (tx) => {
    const agent = await tx.agent.findUnique({ where: { id }, select: { companyName: true } });
    if (!agent) throw new Error("Agent not found.");
    if (await agentHasRecords(tx, id)) {
      throw new Error("This agent has order history and can't be deleted.");
    }
    await purgeAgentCompletely(tx, id);
    return { name: agent.companyName };
  });
}

export async function getDeliveryAgentAnalytics(agentId: string, period?: MonthPeriod | DatePeriod) {
  const { currentStart, currentEnd, prevStart, prevEnd } = !period
    ? monthRanges(parseMonthParam())
    : "from" in period
      ? dateRanges(period)
      : monthRanges(period);

  const allDeliveries = await prisma.delivery.findMany({
    where: { agentId },
    select: { status: true, createdAt: true, order: {
      select: { items: { select: { productId: true, quantity: true, product: { select: { name: true } } } } }
    }},
  });

  function computeAgentMetrics(deliveries: typeof allDeliveries) {
    const delivered = deliveries.filter(d => d.status === "DELIVERED").length;
    const failed = deliveries.filter(d => d.status === "FAILED").length;
    const dispatched = delivered + failed;
    const deliveryRate = dispatched > 0 ? Math.round((delivered / dispatched) * 100) : 0;
    const generalPerformance = deliveryRate;

    const productMap: Record<string, { name: string; qty: number }> = {};
    deliveries.filter(d => d.status === "DELIVERED").forEach(d => {
      d.order.items.forEach(item => {
        productMap[item.productId] ??= { name: item.product.name, qty: 0 };
        productMap[item.productId].qty += item.quantity;
      });
    });
    const totalProductsDelivered = Object.values(productMap).reduce((s, v) => s + v.qty, 0);
    const bestProduct = Object.values(productMap).sort((a, b) => b.qty - a.qty)[0] ?? null;

    return { delivered, failed, dispatched, deliveryRate, generalPerformance, totalProductsDelivered, bestProduct };
  }

  const thisMonth = allDeliveries.filter(d => d.createdAt >= currentStart && d.createdAt <= currentEnd);
  const lastMonth = allDeliveries.filter(d => d.createdAt >= prevStart && d.createdAt <= prevEnd);

  const current = computeAgentMetrics(thisMonth);
  const previous = computeAgentMetrics(lastMonth);

  return {
    current,
    trends: {
      totalProductsDelivered: trendLabel(current.totalProductsDelivered, previous.totalProductsDelivered),
      generalPerformance: trendLabel(current.generalPerformance, previous.generalPerformance),
      deliveryRate: trendLabel(current.deliveryRate, previous.deliveryRate),
    },
  };
}
