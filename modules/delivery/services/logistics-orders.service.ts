import { prisma } from "@/lib/db/prisma";
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
};

export async function getLogisticsDeliveries(): Promise<LogisticsDeliveryRow[]> {
  const deliveries = await prisma.delivery.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customer: { select: { deliveryAddress: true } },
        },
      },
      agent: { select: { companyName: true } },
      driver: { select: { name: true } },
    },
  });

  return deliveries.map((d) => ({
    id: d.id,
    orderNumber: d.order.orderNumber,
    orderId: d.order.id,
    agent: d.agent?.companyName ?? "—",
    driver: d.driver?.name ?? "—",
    time: d.scheduledTime
      ? d.scheduledTime.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: false })
      : "—",
    address: d.order.customer.deliveryAddress,
    status: d.status,
  }));
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
