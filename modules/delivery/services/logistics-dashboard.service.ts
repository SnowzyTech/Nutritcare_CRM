import { prisma } from "@/lib/db/prisma";

export type DashboardStats = {
  pendingDispatch: number;
  inTransit: number;
  deliveredToday: number;
  failedOrReturns: number;
};

export type DeliveryQueueRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  customer: string;
  driver: string;
  time: string | null;
  status: "PENDING_DISPATCH" | "IN_TRANSIT" | "DELIVERED" | "FAILED";
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

export async function getLogisticsDashboardData(): Promise<LogisticsDashboardData> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    pendingDispatch,
    inTransit,
    deliveredToday,
    failedCount,
    recentDeliveries,
    driverAgents,
    routes,
    failedDeliveries,
    unassignedOrders,
  ] = await Promise.all([
    prisma.delivery.count({ where: { status: "PENDING_DISPATCH" } }),
    prisma.delivery.count({ where: { status: "IN_TRANSIT" } }),
    prisma.delivery.count({
      where: {
        status: "DELIVERED",
        deliveredTime: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.delivery.count({ where: { status: "FAILED" } }),

    // Delivery queue — 10 most recent
    prisma.delivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        scheduledTime: true,
        order: { select: { orderNumber: true, customer: { select: { name: true } } } },
        driver: { select: { name: true } },
        agent: { select: { companyName: true } },
      },
    }),

    // Driver-only agents (no linked User) who are ACTIVE
    prisma.agent.findMany({
      where: { user: null, status: "ACTIVE", deletedAt: null },
      orderBy: { companyName: "asc" },
      select: {
        id: true,
        companyName: true,
        deliveries: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),

    // Routes with zone info
    prisma.route.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        stopsCount: true,
        distanceKm: true,
        zone: { select: { name: true } },
      },
    }),

    // Recent failed deliveries for alerts
    prisma.delivery.findMany({
      where: { status: "FAILED" },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: {
        id: true,
        failureReason: true,
        updatedAt: true,
        order: { select: { orderNumber: true } },
      },
    }),

    // Orders confirmed but no pending delivery record (unassigned)
    prisma.order.count({
      where: {
        status: "CONFIRMED",
        deletedAt: null,
        deliveries: { none: {} },
      },
    }),
  ]);

  const deliveryQueue: DeliveryQueueRow[] = recentDeliveries.map((d) => ({
    id: d.id,
    orderId: d.order.orderNumber,
    orderNumber: d.order.orderNumber,
    customer: d.order.customer.name,
    driver: d.driver?.name ?? d.agent?.companyName ?? "—",
    time: d.scheduledTime
      ? d.scheduledTime.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
      : null,
    status: d.status,
  }));

  const driverAssignments: DriverAssignmentRow[] = driverAgents.map((a) => {
    const completed = a.deliveries.filter((d) => d.status === "DELIVERED").length;
    const total = a.deliveries.length;
    const active = a.deliveries.filter((d) => d.status === "IN_TRANSIT").length;
    return {
      id: a.id,
      name: a.companyName,
      vehicle: "—",
      completedStops: completed,
      totalStops: total,
      activeDeliveries: active,
    };
  });

  const routeRows: RouteRow[] = routes.map((r) => ({
    id: r.id,
    name: r.name,
    stopsCount: r.stopsCount,
    distanceKm: Number(r.distanceKm),
    zone: r.zone.name,
  }));

  const alerts: AlertRow[] = [
    ...failedDeliveries.map((d) => ({
      id: d.id,
      level: "red" as const,
      message: d.failureReason
        ? `${d.order.orderNumber} delivery failed — ${d.failureReason}`
        : `${d.order.orderNumber} delivery failed`,
      createdAt: d.updatedAt,
    })),
    ...(unassignedOrders > 0
      ? [
          {
            id: "unassigned",
            level: "purple" as const,
            message: `${unassignedOrders} order${unassignedOrders > 1 ? "s" : ""} confirmed — no delivery assigned yet`,
            createdAt: new Date(),
          },
        ]
      : []),
  ];

  return {
    stats: {
      pendingDispatch,
      inTransit,
      deliveredToday,
      failedOrReturns: failedCount,
    },
    deliveryQueue,
    driverAssignments,
    routes: routeRows,
    alerts,
  };
}
