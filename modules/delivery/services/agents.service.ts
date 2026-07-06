import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { monthRanges, parseMonthParam, type MonthPeriod } from "@/lib/month-period";

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
 * Finds the best available delivery agent for an order using:
 *  1. State match (agent.state or statesCovered must include customerState)
 *  2. Agent must hold sufficient stock for every order item
 *  3. Tie-break: fewest active CONFIRMED orders (load balancing)
 * Returns the agent ID or null if none qualify.
 */
export async function findEligibleAgentForOrder(
  customerState: string,
  orderItems: { productId: string; quantity: number }[],
): Promise<string | null> {
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

  if (stateMatched.length === 0) return null;

  const agentIds = stateMatched.map((a) => a.id);
  const productIds = orderItems.map((i) => i.productId);

  const stockRows = await prisma.stockLevel.findMany({
    where: { locationKind: "AGENT", locationId: { in: agentIds }, productId: { in: productIds } },
    select: { locationId: true, productId: true, quantity: true },
  });

  // agentId → productId → qty
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

  const stockEligible = agentIds.filter((agentId) => {
    const agentStock = stockMap[agentId] ?? {};
    const agentCommitted = committedMap[agentId] ?? {};
    return orderItems.every(
      (item) =>
        (agentStock[item.productId] ?? 0) - (agentCommitted[item.productId] ?? 0) >= item.quantity,
    );
  });

  if (stockEligible.length === 0) return null;

  const orderCounts = await prisma.order.groupBy({
    by: ["agentId"],
    where: { agentId: { in: stockEligible }, status: "CONFIRMED", deletedAt: null },
    _count: { id: true },
  });

  const countMap: Record<string, number> = {};
  for (const row of orderCounts) {
    if (row.agentId) countMap[row.agentId] = row._count.id;
  }

  return stockEligible.sort((a, b) => (countMap[a] ?? 0) - (countMap[b] ?? 0))[0];
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

export async function softDeleteAgent(id: string) {
  return prisma.agent.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function getDeliveryAgentAnalytics(agentId: string, period?: MonthPeriod) {
  const { currentStart, currentEnd, prevStart, prevEnd } = monthRanges(period ?? parseMonthParam());

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
