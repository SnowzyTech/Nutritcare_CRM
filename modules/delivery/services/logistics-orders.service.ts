import { prisma } from "@/lib/db/prisma";
import { formatDate } from "@/lib/utils";
import type { DeliveryStatus, OrderStatus } from "@prisma/client";

export type LogisticsDeliveryRow = {
  id: string;
  orderNumber: string;
  orderId: string;
  agent: string;
  driver: string;
  time: string;
  address: string;
  status: DeliveryStatus;
  sourceType: "stockOut" | "stockTransfer";
};

function mapMovementStatus(status: string): DeliveryStatus {
  switch (status) {
    case "RECEIVED":
    case "SHELVED":
      return "DELIVERED";
    case "NOT_RECEIVED":
      return "FAILED";
    case "QC_CHECK":
      return "IN_TRANSIT";
    default:
      return "PENDING_DISPATCH";
  }
}

function mapTransferStatus(status: string): DeliveryStatus {
  switch (status) {
    case "COMPLETED": return "DELIVERED";
    case "IN_TRANSIT": return "IN_TRANSIT";
    case "FAILED": return "FAILED";
    default: return "PENDING_DISPATCH";
  }
}

export async function getLogisticsDeliveries(): Promise<LogisticsDeliveryRow[]> {
  // 1. Stock out vouchers (OUTGOING movements), excluding DRAFT, REVERSED, and Agent-to-Agent
  const outgoing = await prisma.stockMovement.findMany({
    where: {
      type: "OUTGOING",
      status: { notIn: ["DRAFT", "REVERSED"] },
      isAgentToAgentTransfer: { not: true },
    },
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      createdAt: true,
      scheduledTime: true,
      warehouse: { select: { name: true } },
      toAgent: { select: { address: true } },
      agent: { select: { address: true } },
      driver: { select: { name: true } },
      driverAgent: { select: { companyName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Stock transfers, excluding DRAFT, REVERSED, and Agent-to-Agent
  const transfers = await prisma.stockTransfer.findMany({
    where: {
      status: { notIn: ["DRAFT", "REVERSED"] },
      NOT: [{ sourceType: "AGENT", targetType: "AGENT" }],
    },
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      createdAt: true,
      scheduledTime: true,
      sourceType: true,
      sourceId: true,
      targetType: true,
      targetId: true,
      driver: { select: { name: true } },
      driverAgent: { select: { companyName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Resolve warehouse/agent names and addresses for transfers
  const warehouseIds = [
    ...new Set([
      ...transfers.filter((t) => t.targetType === "WAREHOUSE").map((t) => t.targetId),
      ...transfers.filter((t) => t.sourceType === "WAREHOUSE").map((t) => t.sourceId),
    ]),
  ];
  const agentIds = [
    ...new Set([
      ...transfers.filter((t) => t.targetType === "AGENT").map((t) => t.targetId),
      ...transfers.filter((t) => t.sourceType === "AGENT").map((t) => t.sourceId),
    ]),
  ];

  const [warehouses, transferAgents] = await Promise.all([
    warehouseIds.length > 0
      ? prisma.warehouse.findMany({
          where: { id: { in: warehouseIds } },
          select: { id: true, name: true, address: true },
        })
      : [],
    agentIds.length > 0
      ? prisma.agent.findMany({
          where: { id: { in: agentIds } },
          select: { id: true, companyName: true, address: true },
        })
      : [],
  ]);

  const whMap = new Map(warehouses.map((w) => [w.id, w]));
  const agentMap = new Map(transferAgents.map((a) => [a.id, a]));

  function resolveName(type: string, id: string): string {
    if (type === "WAREHOUSE") return whMap.get(id)?.name ?? "—";
    return agentMap.get(id)?.companyName ?? "—";
  }

  function resolveAddress(type: string, id: string): string {
    if (type === "WAREHOUSE") return whMap.get(id)?.address ?? "—";
    return agentMap.get(id)?.address ?? "—";
  }

  // Build typed rows with _createdAt for sorting, then strip it
  type RowWithDate = LogisticsDeliveryRow & { _createdAt: Date };

  const outgoingRows: RowWithDate[] = outgoing.map((m) => ({
    id: m.id,
    orderNumber: m.referenceNumber,
    orderId: m.id,
    agent: m.warehouse?.name ?? "—",
    driver: m.driver?.name ?? m.driverAgent?.companyName ?? "—",
    time: m.scheduledTime ? formatDate(m.scheduledTime) : "—",
    address: m.toAgent?.address ?? m.agent?.address ?? "—",
    status: mapMovementStatus(m.status),
    sourceType: "stockOut",
    _createdAt: m.createdAt,
  }));

  const transferRows: RowWithDate[] = transfers.map((t) => ({
    id: t.id,
    orderNumber: t.referenceNumber,
    orderId: t.id,
    agent: resolveName(t.sourceType, t.sourceId),
    driver: t.driver?.name ?? t.driverAgent?.companyName ?? "—",
    time: t.scheduledTime ? formatDate(t.scheduledTime) : "—",
    address: resolveAddress(t.targetType, t.targetId),
    status: mapTransferStatus(t.status),
    sourceType: "stockTransfer",
    _createdAt: t.createdAt,
  }));

  const combined: RowWithDate[] = [...outgoingRows, ...transferRows];
  combined.sort((a, b) => b._createdAt.getTime() - a._createdAt.getTime());

  return combined.map(({ _createdAt, ...row }) => row);
}

export async function getLogisticsOrders(status?: OrderStatus) {
  return prisma.order.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, email: true } },
      agent: { select: { companyName: true, state: true } },
      items: {
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getLogisticsOrderStatusCounts() {
  const counts = await prisma.order.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: { _all: true },
  });

  const map: Partial<Record<OrderStatus, number>> = {};
  for (const row of counts) {
    map[row.status] = row._count._all;
  }
  return map;
}
