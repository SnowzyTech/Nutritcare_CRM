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
  return prisma.order.findMany({
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
    },
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
        select: { failureReason: true },
      },
    },
  });
}

export async function getAgentInventory(agentId: string) {
  const [
    incomingMovements,
    incomingTransfers,
    outgoingMovements,
    outgoingTransfers,
    returns,
    pendingOrders,
  ] = await Promise.all([
    // Outgoing StockMovements where this agent is the recipient
    prisma.stockMovement.findMany({
      where: {
        toAgentId: agentId,
        type: "OUTGOING",
        status: { notIn: ["DRAFT", "REVERSED"] },
      },
      select: {
        items: { select: { quantity: true, product: { select: { id: true, name: true } } } },
      },
    }),
    // StockTransfers where this agent is the target
    prisma.stockTransfer.findMany({
      where: {
        targetType: "AGENT",
        targetId: agentId,
        status: { in: ["SUBMITTED", "IN_TRANSIT", "COMPLETED"] },
      },
      select: {
        items: { select: { quantity: true, product: { select: { id: true, name: true } } } },
      },
    }),
    // Agent-to-agent outgoing movements (stock going out FROM this agent)
    prisma.stockMovement.findMany({
      where: {
        agentId,
        type: "OUTGOING",
        isAgentToAgentTransfer: true,
        status: { notIn: ["DRAFT", "REVERSED"] },
      },
      select: {
        items: { select: { quantity: true, product: { select: { id: true } } } },
      },
    }),
    // StockTransfers going out FROM this agent
    prisma.stockTransfer.findMany({
      where: {
        sourceType: "AGENT",
        sourceId: agentId,
        status: { in: ["SUBMITTED", "IN_TRANSIT", "COMPLETED"] },
      },
      select: {
        items: { select: { quantity: true, product: { select: { id: true } } } },
      },
    }),
    // Returns from this agent
    prisma.stockMovement.findMany({
      where: {
        agentId,
        type: "RETURN",
        status: { notIn: ["DRAFT", "REVERSED"] },
      },
      select: {
        items: { select: { quantity: true, product: { select: { id: true } } } },
      },
    }),
    // Pending orders — for scheduled count display only
    prisma.order.findMany({
      where: { agentId, status: { in: ["PENDING", "CONFIRMED"] }, deletedAt: null },
      select: {
        items: { select: { quantity: true, product: { select: { id: true, name: true } } } },
      },
    }),
  ]);

  const stockMap: Record<string, { name: string; qty: number }> = {};

  for (const movement of incomingMovements) {
    for (const item of movement.items) {
      const pid = item.product.id;
      stockMap[pid] ??= { name: item.product.name, qty: 0 };
      stockMap[pid].qty += item.quantity;
    }
  }

  for (const transfer of incomingTransfers) {
    for (const item of transfer.items) {
      const pid = item.product.id;
      stockMap[pid] ??= { name: item.product.name, qty: 0 };
      stockMap[pid].qty += item.quantity;
    }
  }

  for (const movement of outgoingMovements) {
    for (const item of movement.items) {
      const pid = item.product.id;
      stockMap[pid] ??= { name: "Unknown", qty: 0 };
      stockMap[pid].qty -= item.quantity;
    }
  }

  for (const transfer of outgoingTransfers) {
    for (const item of transfer.items) {
      const pid = item.product.id;
      stockMap[pid] ??= { name: "Unknown", qty: 0 };
      stockMap[pid].qty -= item.quantity;
    }
  }

  for (const movement of returns) {
    for (const item of movement.items) {
      const pid = item.product.id;
      stockMap[pid] ??= { name: "Unknown", qty: 0 };
      stockMap[pid].qty -= item.quantity;
    }
  }

  const scheduledMap: Record<string, number> = {};
  for (const order of pendingOrders) {
    for (const item of order.items) {
      scheduledMap[item.product.id] = (scheduledMap[item.product.id] ?? 0) + item.quantity;
    }
  }

  return Object.entries(stockMap)
    .map(([productId, { name, qty }]) => ({
      productId,
      productName: name,
      totalStock: Math.max(0, qty),
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
