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
  // Received stock movements to this agent
  const stockMovements = await prisma.stockMovement.findMany({
    where: {
      toAgentId: agentId,
      status: { in: ["RECEIVED", "QC_CHECK", "SHELVED"] },
    },
    select: {
      items: {
        select: {
          quantity: true,
          product: { select: { id: true, name: true } },
        },
      },
    },
  });

  const receivedMap: Record<string, { name: string; qty: number }> = {};
  for (const movement of stockMovements) {
    for (const item of movement.items) {
      const pid = item.product.id;
      receivedMap[pid] ??= { name: item.product.name, qty: 0 };
      receivedMap[pid].qty += item.quantity;
    }
  }

  // Outgoing movements from agent (returns, transfers out)
  const outgoingMovements = await prisma.stockMovement.findMany({
    where: {
      agentId,
      type: "OUTGOING",
      status: { in: ["RECEIVED", "QC_CHECK", "SHELVED"] },
    },
    select: {
      items: {
        select: {
          quantity: true,
          product: { select: { id: true, name: true } },
        },
      },
    },
  });
  const outgoingMap: Record<string, number> = {};
  for (const movement of outgoingMovements) {
    for (const item of movement.items) {
      outgoingMap[item.product.id] = (outgoingMap[item.product.id] ?? 0) + item.quantity;
    }
  }

  // Pending delivery quantities — items the agent currently holds for delivery
  const pendingOrders = await prisma.order.findMany({
    where: {
      agentId,
      status: { in: ["PENDING", "CONFIRMED"] },
      deletedAt: null,
    },
    select: {
      items: {
        select: {
          quantity: true,
          product: { select: { id: true, name: true } },
        },
      },
    },
  });

  const scheduledMap: Record<string, number> = {};
  const pendingNameMap: Record<string, string> = {};
  for (const order of pendingOrders) {
    for (const item of order.items) {
      scheduledMap[item.product.id] = (scheduledMap[item.product.id] ?? 0) + item.quantity;
      pendingNameMap[item.product.id] = item.product.name;
    }
  }

  const productIds = new Set([
    ...Object.keys(receivedMap),
    ...Object.keys(scheduledMap),
  ]);

  return Array.from(productIds).map((pid) => {
    const fromMovements = Math.max(0, (receivedMap[pid]?.qty ?? 0) - (outgoingMap[pid] ?? 0));
    const scheduled = scheduledMap[pid] ?? 0;
    // If stock movements aren't tracked, use pending orders as the stock count.
    // Always show at least the scheduled quantity as total stock.
    const totalStock = Math.max(fromMovements, scheduled);
    return {
      productId: pid,
      productName: receivedMap[pid]?.name ?? pendingNameMap[pid] ?? "Unknown Product",
      totalStock,
      scheduled,
    };
  }).filter((item) => item.totalStock > 0 || item.scheduled > 0);
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
