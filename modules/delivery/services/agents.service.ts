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

/**
 * True if an agent has enough AVAILABLE stock for `items`, where
 * available = on-hand − committed, and committed = quantities already promised
 * to that agent's CONFIRMED (not yet delivered/failed/cancelled) orders.
 * `excludeOrderId` drops one order from the committed tally (used when the order
 * being checked is itself already committed to this agent).
 *
 * Call INSIDE a transaction that has taken `lockAgent(tx, agentId)` so the read
 * is serialised against concurrent confirmations for the same agent.
 */
export async function agentHasAvailableStock(
  tx: Tx,
  agentId: string,
  items: { productId: string; quantity: number }[],
  opts?: { excludeOrderId?: string },
): Promise<boolean> {
  const productIds = [...new Set(items.map((i) => i.productId))];

  const [stockRows, committedItems] = await Promise.all([
    tx.stockLevel.findMany({
      where: { locationKind: "AGENT", locationId: agentId, productId: { in: productIds } },
      select: { productId: true, quantity: true },
    }),
    tx.orderItem.findMany({
      where: {
        productId: { in: productIds },
        order: {
          agentId,
          status: "CONFIRMED",
          deletedAt: null,
          ...(opts?.excludeOrderId ? { id: { not: opts.excludeOrderId } } : {}),
        },
      },
      select: { productId: true, quantity: true },
    }),
  ]);

  const stock: Record<string, number> = {};
  for (const r of stockRows) stock[r.productId] = Math.max(0, r.quantity);

  const committed: Record<string, number> = {};
  for (const it of committedItems) {
    committed[it.productId] = (committed[it.productId] ?? 0) + it.quantity;
  }

  // Aggregate the request per product (handles duplicate product lines).
  const requested: Record<string, number> = {};
  for (const it of items) requested[it.productId] = (requested[it.productId] ?? 0) + it.quantity;

  return Object.entries(requested).every(
    ([pid, qty]) => (stock[pid] ?? 0) - (committed[pid] ?? 0) >= qty,
  );
}

/**
 * Outcome of picking a delivery agent for an order.
 *
 * A bare `string | null` couldn't tell the failure modes apart, so every caller
 * showed one catch-all message ("no agent available in this area with the
 * required stock") for two very different problems with two very different
 * fixes. The reasons below let `formatAgentUnavailableMessage()` say which one
 * actually happened.
 */
export type AgentSelectionResult =
  | { ok: true; agentId: string }
  | { ok: false; reason: "no_agent_in_state" }
  | {
      ok: false;
      reason: "insufficient_stock";
      shortfalls: { productName: string; needed: number; bestAvailable: number }[];
    }
  | { ok: false; reason: "no_single_agent_covers_all_items" };

/** An order line as the confirm paths select it (product name is used for messaging only). */
type OrderLine = {
  productId: string;
  quantity: number;
  product?: { name: string } | null;
};

/**
 * Finds the best available delivery agent for an order using:
 *  1. State match (agent.state or statesCovered must include customerState)
 *  2. Agent must hold sufficient AVAILABLE stock (on-hand − committed) for every item
 *  3. Tie-break: fewest active CONFIRMED orders (load balancing)
 *
 * One agent must cover the WHOLE order - orders are never split across agents.
 */
export async function findEligibleAgentForOrder(
  customerState: string,
  orderItems: OrderLine[],
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

  const stockRows = await prisma.stockLevel.findMany({
    where: { locationKind: "AGENT", locationId: { in: agentIds }, productId: { in: productIds } },
    select: { locationId: true, productId: true, quantity: true },
  });

  // agentId -> productId -> qty
  const stockMap: Record<string, Record<string, number>> = {};
  for (const row of stockRows) {
    stockMap[row.locationId] ??= {};
    stockMap[row.locationId][row.productId] = Math.max(0, row.quantity);
  }

  // Stock already promised to each agent's CONFIRMED (undelivered) orders, so we
  // pick on AVAILABLE (on-hand − committed) and never overbook an agent.
  const committedItems = await prisma.orderItem.findMany({
    where: {
      productId: { in: productIds },
      order: { agentId: { in: agentIds }, status: "CONFIRMED", deletedAt: null },
    },
    select: { productId: true, quantity: true, order: { select: { agentId: true } } },
  });
  const committedMap: Record<string, Record<string, number>> = {};
  for (const it of committedItems) {
    const aId = it.order.agentId;
    if (!aId) continue;
    committedMap[aId] ??= {};
    committedMap[aId][it.productId] = (committedMap[aId][it.productId] ?? 0) + it.quantity;
  }

  const availableFor = (agentId: string, productId: string) =>
    (stockMap[agentId]?.[productId] ?? 0) - (committedMap[agentId]?.[productId] ?? 0);

  // Aggregate the request per product (handles duplicate product lines) so this
  // check matches the authoritative one in `agentHasAvailableStock`, which also
  // aggregates - otherwise a split line could pass here and then be rejected
  // under the lock with a misleading "agent just reached capacity" message.
  const needed: Record<string, number> = {};
  for (const it of orderItems) needed[it.productId] = (needed[it.productId] ?? 0) + it.quantity;

  const stockEligible = agentIds.filter((agentId) =>
    Object.entries(needed).every(([pid, qty]) => availableFor(agentId, pid) >= qty),
  );

  if (stockEligible.length === 0) {
    const nameOf: Record<string, string> = {};
    for (const it of orderItems) {
      if (it.product?.name) nameOf[it.productId] = it.product.name;
    }

    const shortfalls = Object.entries(needed)
      .map(([productId, qty]) => ({
        productName: nameOf[productId] ?? "this product",
        needed: qty,
        bestAvailable: Math.max(0, ...agentIds.map((id) => availableFor(id, productId))),
      }))
      .filter((s) => s.bestAvailable < s.needed);

    // Every line is individually available somewhere, but no single agent holds
    // them all together - reporting a per-product shortfall here would be a lie.
    if (shortfalls.length === 0) {
      return { ok: false, reason: "no_single_agent_covers_all_items" };
    }
    return { ok: false, reason: "insufficient_stock", shortfalls };
  }

  const orderCounts = await prisma.order.groupBy({
    by: ["agentId"],
    where: { agentId: { in: stockEligible }, status: "CONFIRMED", deletedAt: null },
    _count: { id: true },
  });

  const countMap: Record<string, number> = {};
  for (const row of orderCounts) {
    if (row.agentId) countMap[row.agentId] = row._count.id;
  }

  const agentId = stockEligible.sort((a, b) => (countMap[a] ?? 0) - (countMap[b] ?? 0))[0];
  return { ok: true, agentId };
}

/**
 * The message shown when no agent could be assigned. Shared by every confirm
 * path so rep and admin see the same diagnosis for the same underlying state.
 *
 * Deliberately does NOT say "try again later" for a stock shortage: retrying
 * cannot fix it, because the stock is held by other confirmed orders until
 * someone dispatches, fails or cancels them.
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
        .map((s) => `${s.productName} (need ${s.needed}, best agent has ${s.bestAvailable} available)`)
        .join("; ");
      return `No delivery agent in ${state} has enough stock for this order: ${detail}. Retrying won’t help — please contact your manager to restock or free up reserved stock.`;
    }

    case "no_single_agent_covers_all_items":
      return `No single delivery agent in ${state} has every item on this order in stock at once. Please contact your manager to restock, or place the items as separate orders.`;
  }
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
