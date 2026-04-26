import { prisma } from "@/lib/db/prisma";
import type { OrderStatus } from "@prisma/client";

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
