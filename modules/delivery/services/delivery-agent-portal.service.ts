import { prisma } from "@/lib/db/prisma";
import type { OrderStatus } from "@prisma/client";

export async function getAgentIdByUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { agentId: true },
  });
  return user?.agentId ?? null;
}

export async function getAgentOrders(agentId: string) {
  const orders = await prisma.order.findMany({
    where: { agentId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      customer: { select: { name: true, email: true, phone: true } },
      items: {
        select: {
          quantity: true,
          product: { select: { name: true } },
        },
      },
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { scheduledTime: true, deliveredTime: true },
      },
    },
  });

  // Surface a single "delivery date" per order: the actual delivered date for
  // completed orders, otherwise the scheduled delivery date.
  return orders.map(({ deliveries, ...order }) => {
    const latest = deliveries[0];
    const deliveryDate =
      order.status === "DELIVERED"
        ? latest?.deliveredTime ?? null
        : latest?.scheduledTime ?? null;
    return { ...order, deliveryDate };
  });
}

export async function getAgentOrderStatusCounts(agentId: string) {
  const counts = await prisma.order.groupBy({
    by: ["status"],
    where: { agentId, deletedAt: null },
    _count: { _all: true },
  });
  const map: Partial<Record<OrderStatus, number>> = {};
  for (const row of counts) {
    map[row.status] = row._count._all;
  }
  return map;
}

export async function getAgentOrderById(orderId: string, agentId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, agentId, deletedAt: null },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      deliveryFee: true,
      netAmount: true,
      notes: true,
      customer: {
        select: {
          name: true,
          phone: true,
          email: true,
          deliveryAddress: true,
          landmark: true,
        },
      },
      salesRep: { select: { name: true, phone: true } },
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          product: { select: { name: true } },
        },
      },
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          failureReason: true,
          deliveryCode: true,
          scheduledTime: true,
          deliveredTime: true,
        },
      },
    },
  });
}

export async function getAgentInventory(agentId: string) {
  // Read the materialized StockLevel balance — maintained transactionally by
  // every stock movement, transfer, return, AND delivery completion.  This
  // replaces the old 5-query movement aggregation which (a) was O(all history),
  // (b) ignored delivered orders, and (c) diverged from what the delivery
  // completion code actually decrements.
  const [stockLevels, pendingOrders] = await Promise.all([
    prisma.stockLevel.findMany({
      where: {
        locationKind: "AGENT",
        locationId: agentId,
        quantity: { gt: 0 },
      },
      select: {
        productId: true,
        quantity: true,
        product: { select: { name: true } },
      },
    }),
    // Scheduled = quantities committed to confirmed-but-undelivered orders
    prisma.order.findMany({
      where: { agentId, status: { in: ["PENDING", "CONFIRMED"] }, deletedAt: null },
      select: {
        items: { select: { quantity: true, product: { select: { id: true, name: true } } } },
      },
    }),
  ]);

  const scheduledMap: Record<string, number> = {};
  for (const order of pendingOrders) {
    for (const item of order.items) {
      scheduledMap[item.product.id] = (scheduledMap[item.product.id] ?? 0) + item.quantity;
    }
  }

  // Merge: include products that appear in pending orders even if StockLevel
  // shows 0 (e.g. stock not yet received but order already confirmed)
  const allProductIds = new Set([
    ...stockLevels.map((s) => s.productId),
    ...Object.keys(scheduledMap),
  ]);

  // Build a name lookup from whatever we already have
  const nameMap: Record<string, string> = {};
  for (const sl of stockLevels) nameMap[sl.productId] = sl.product.name;
  for (const order of pendingOrders) {
    for (const item of order.items) {
      nameMap[item.product.id] ??= item.product.name;
    }
  }

  const stockQty: Record<string, number> = {};
  for (const sl of stockLevels) stockQty[sl.productId] = Math.max(0, sl.quantity);

  return Array.from(allProductIds)
    .map((productId) => ({
      productId,
      productName: nameMap[productId] ?? "Unknown",
      totalStock: stockQty[productId] ?? 0,
      scheduled: scheduledMap[productId] ?? 0,
    }))
    .filter((item) => item.totalStock > 0 || item.scheduled > 0);
}

export async function getAgentProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      whatsappNumber: true,
      createdAt: true,
      agent: {
        select: {
          companyName: true,
          state: true,
          address: true,
          phone1: true,
          phone2: true,
          status: true,
        },
      },
    },
  });
}

export async function getAgentAccountData(agentId: string) {
  const raw = await prisma.order.findMany({
    where: { agentId, status: "DELIVERED", deletedAt: null },
    orderBy: { date: "desc" },
    select: {
      id: true,
      orderNumber: true,
      date: true,
      deliveryFee: true,
      netAmount: true,
      customer: { select: { name: true } },
      items: {
        select: {
          quantity: true,
          lineTotal: true,
          product: { select: { name: true } },
        },
      },
    },
  });

  // Serialize Decimals so the result is plain JSON-safe
  return raw.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.date,
    deliveryFee: Number(order.deliveryFee),
    netAmount: Number(order.netAmount),
    customerName: order.customer.name,
    items: order.items.map((i) => ({
      productName: i.product.name,
      quantity: i.quantity,
      lineTotal: Number(i.lineTotal),
    })),
  }));
}

export type AgentRemittanceEntry = {
  id: string;
  referenceId: string;
  date: string; // YYYY-MM-DD
  expected: number; // total sales value the agent was expected to remit
  deliveryFees: number;
  remitted: number; // what the agent actually paid
  bank: string | null; // MONIEPOINT | ZENITH | null
  orderCount: number;
  underpayment: number; // > 0 → agent still owes the company for this batch
  overpayment: number; // > 0 → company owes the agent (agent overpaid)
};

/**
 * Read-only remittance documentation for the agent's own portal: every
 * remittance an accountant recorded against this agent, plus the current net
 * balance. Ledger convention (see settlements.action.ts): a positive running
 * balance means the agent owes the company; negative means the company owes the
 * agent. All data is scoped to the agent's own `agentId`.
 */
export async function getAgentRemittances(agentId: string): Promise<{
  netBalance: number;
  totalRemitted: number;
  entries: AgentRemittanceEntry[];
}> {
  const [settlements, latest] = await Promise.all([
    prisma.agentSettlement.findMany({
      where: { agentId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        totalSalesValue: true,
        deliveryFeesEarned: true,
        totalRemitted: true,
        overpayment: true,
        underpayment: true,
        bank: true,
        ordersJson: true,
        ledgerEntries: {
          where: { referenceType: "REMITTANCE" },
          select: { referenceId: true },
          take: 1,
        },
      },
    }),
    prisma.agentLedgerEntry.findFirst({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      select: { runningBalance: true },
    }),
  ]);

  const entries: AgentRemittanceEntry[] = settlements.map((s) => {
    const orderIds = Array.isArray(s.ordersJson) ? (s.ordersJson as string[]) : [];
    return {
      id: s.id,
      referenceId: s.ledgerEntries[0]?.referenceId ?? "—",
      date: s.date.toISOString().slice(0, 10),
      expected: Number(s.totalSalesValue),
      deliveryFees: Number(s.deliveryFeesEarned),
      remitted: Number(s.totalRemitted),
      bank: s.bank,
      orderCount: orderIds.length,
      underpayment: Number(s.underpayment),
      overpayment: Number(s.overpayment),
    };
  });

  return {
    netBalance: Number(latest?.runningBalance ?? 0),
    totalRemitted: entries.reduce((sum, e) => sum + e.remitted, 0),
    entries,
  };
}
