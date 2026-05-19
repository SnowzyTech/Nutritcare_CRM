import { prisma } from "@/lib/db/prisma";
import { formatDate } from "@/lib/utils";
import type { DeliveryStatus } from "@prisma/client";

export type DashboardStats = {
  pendingDispatch: number;
  inTransit: number;
  deliveredToday: number;
  failedOrReturns: number;
};

export type DeliveryQueueRow = {
  id: string;
  orderNumber: string;
  sourceType: "stockOut" | "stockTransfer";
  warehouse: string;
  driver: string;
  time: string | null;
  address: string;
  status: DeliveryStatus;
};

export type DriverAssignmentRow = {
  id: string;
  name: string;
  vehicle: string;
  completedStops: number;
  totalStops: number;
  activeDeliveries: number;
};

export type RouteRow = {
  id: string;
  name: string;
  stopsCount: number;
  distanceKm: number;
  zone: string;
};

export type AlertRow = {
  id: string;
  level: "red" | "orange" | "purple";
  message: string;
  createdAt: Date;
};

export type LogisticsDashboardData = {
  stats: DashboardStats;
  deliveryQueue: DeliveryQueueRow[];
  driverAssignments: DriverAssignmentRow[];
  routes: RouteRow[];
  alerts: AlertRow[];
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

export async function getLogisticsDashboardData(): Promise<LogisticsDashboardData> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [outgoing, transfers, returnCount] = await Promise.all([
    prisma.stockMovement.findMany({
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
        updatedAt: true,
        scheduledTime: true,
        warehouse: { select: { name: true } },
        agent: { select: { address: true } },
        driverAgent: { select: { id: true, companyName: true, vehicleNo: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.stockTransfer.findMany({
      where: {
        status: { notIn: ["DRAFT", "REVERSED"] },
        NOT: [{ sourceType: "AGENT", targetType: "AGENT" }],
      },
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        scheduledTime: true,
        sourceType: true,
        sourceId: true,
        targetType: true,
        targetId: true,
        driverAgent: { select: { id: true, companyName: true, vehicleNo: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.stockMovement.count({
      where: {
        type: "RETURN",
        status: { notIn: ["DRAFT", "REVERSED"] },
      },
    }),
  ]);

  // Resolve warehouse/agent names for transfers
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

  const [warehouses, agentEntities] = await Promise.all([
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
  const agentMap = new Map(agentEntities.map((a) => [a.id, a]));

  function resolveName(type: string, id: string): string {
    if (type === "WAREHOUSE") return whMap.get(id)?.name ?? "—";
    return agentMap.get(id)?.companyName ?? "—";
  }
  function resolveAddress(type: string, id: string): string {
    if (type === "WAREHOUSE") return whMap.get(id)?.address ?? "—";
    return agentMap.get(id)?.address ?? "—";
  }

  // Compute stats from mapped statuses
  const pendingDispatch =
    outgoing.filter((m) => ["DRAFT", "RECORDED"].includes(m.status)).length +
    transfers.filter((t) => ["DRAFT", "SUBMITTED"].includes(t.status)).length;

  const inTransit =
    outgoing.filter((m) => m.status === "QC_CHECK").length +
    transfers.filter((t) => t.status === "IN_TRANSIT").length;

  const deliveredToday =
    outgoing.filter(
      (m) =>
        ["RECEIVED", "SHELVED"].includes(m.status) &&
        m.updatedAt >= todayStart &&
        m.updatedAt <= todayEnd
    ).length +
    transfers.filter(
      (t) =>
        t.status === "COMPLETED" &&
        t.updatedAt >= todayStart &&
        t.updatedAt <= todayEnd
    ).length;

  const failedCount =
    outgoing.filter((m) => m.status === "NOT_RECEIVED").length +
    transfers.filter((t) => t.status === "FAILED").length;

  // Build delivery queue — latest 6 from combined
  type RowWithDate = DeliveryQueueRow & { _createdAt: Date };

  const outgoingRows: RowWithDate[] = outgoing.map((m) => ({
    id: m.id,
    orderNumber: m.referenceNumber,
    sourceType: "stockOut" as const,
    warehouse: m.warehouse?.name ?? "—",
    driver: m.driverAgent?.companyName ?? "—",
    time: m.scheduledTime ? formatDate(m.scheduledTime) : null,
    address: m.agent?.address ?? "—",
    status: mapMovementStatus(m.status),
    _createdAt: m.createdAt,
  }));

  const transferRows: RowWithDate[] = transfers.map((t) => ({
    id: t.id,
    orderNumber: t.referenceNumber,
    sourceType: "stockTransfer" as const,
    warehouse: resolveName(t.sourceType, t.sourceId),
    driver: t.driverAgent?.companyName ?? "—",
    time: t.scheduledTime ? formatDate(t.scheduledTime) : null,
    address: resolveAddress(t.targetType, t.targetId),
    status: mapTransferStatus(t.status),
    _createdAt: t.createdAt,
  }));

  const combined = [...outgoingRows, ...transferRows];
  combined.sort((a, b) => b._createdAt.getTime() - a._createdAt.getTime());
  const deliveryQueue = combined.slice(0, 6).map(({ _createdAt, ...row }) => row);

  // Build driver workload from driverAgent (Agent records, not Users)
  type DriverEntry = {
    completedStops: number;
    totalStops: number;
    activeDeliveries: number;
    agent: { id: string; companyName: string; vehicleNo: string | null };
  };

  const driverMap = new Map<string, DriverEntry>();

  for (const m of outgoing) {
    if (!m.driverAgent) continue;
    const { id, companyName, vehicleNo } = m.driverAgent;
    const entry = driverMap.get(id) ?? {
      completedStops: 0,
      totalStops: 0,
      activeDeliveries: 0,
      agent: { id, companyName, vehicleNo },
    };
    entry.totalStops++;
    const mapped = mapMovementStatus(m.status);
    if (mapped === "DELIVERED") entry.completedStops++;
    if (mapped === "IN_TRANSIT") entry.activeDeliveries++;
    driverMap.set(id, entry);
  }

  for (const t of transfers) {
    if (!t.driverAgent) continue;
    const { id, companyName, vehicleNo } = t.driverAgent;
    const entry = driverMap.get(id) ?? {
      completedStops: 0,
      totalStops: 0,
      activeDeliveries: 0,
      agent: { id, companyName, vehicleNo },
    };
    entry.totalStops++;
    const mapped = mapTransferStatus(t.status);
    if (mapped === "DELIVERED") entry.completedStops++;
    if (mapped === "IN_TRANSIT") entry.activeDeliveries++;
    driverMap.set(id, entry);
  }

  const driverAssignments: DriverAssignmentRow[] = Array.from(driverMap.values()).map((e) => ({
    id: e.agent.id,
    name: e.agent.companyName,
    vehicle: e.agent.vehicleNo ?? "—",
    completedStops: e.completedStops,
    totalStops: e.totalStops,
    activeDeliveries: e.activeDeliveries,
  }));

  // Alerts — only for actual failures, empty if none
  const alerts: AlertRow[] = [
    ...outgoing
      .filter((m) => m.status === "NOT_RECEIVED")
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 3)
      .map((m) => ({
        id: m.id,
        level: "red" as const,
        message: `${m.referenceNumber} — delivery not received`,
        createdAt: m.updatedAt,
      })),
    ...transfers
      .filter((t) => t.status === "FAILED")
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 3)
      .map((t) => ({
        id: t.id,
        level: "red" as const,
        message: `Transfer ${t.referenceNumber} failed`,
        createdAt: t.updatedAt,
      })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return {
    stats: {
      pendingDispatch,
      inTransit,
      deliveredToday,
      failedOrReturns: failedCount + returnCount,
    },
    deliveryQueue,
    driverAssignments,
    routes: [],
    alerts,
  };
}
