import { prisma } from "@/lib/db/prisma";

export type DispatchOrder = {
  id: string;
  orderNumber: string;
  agentId: string | null;
  agentName: string;
  address: string;
  state: string;
  deliveryId: string | null;
};

export type DispatchDriver = {
  id: string;
  name: string;
  state: string;
  phone: string;
  activeDeliveries: number;
};

export async function getDispatchPageData(): Promise<{
  orders: DispatchOrder[];
  drivers: DispatchDriver[];
}> {
  const [confirmedOrders, driverAgents] = await Promise.all([
    prisma.order.findMany({
      where: { status: "CONFIRMED", deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { deliveryAddress: true, state: true } },
        agent: { select: { id: true, companyName: true } },
        deliveries: {
          where: { status: "PENDING_DISPATCH" },
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.agent.findMany({
      where: { user: null, status: "ACTIVE", deletedAt: null },
      orderBy: { companyName: "asc" },
      include: {
        deliveries: {
          where: { status: "IN_TRANSIT" },
          select: { id: true },
        },
      },
    }),
  ]);

  const orders: DispatchOrder[] = confirmedOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    agentId: o.agent?.id ?? null,
    agentName: o.agent?.companyName ?? "—",
    address: o.customer.deliveryAddress,
    state: o.customer.state,
    deliveryId: o.deliveries[0]?.id ?? null,
  }));

  const drivers: DispatchDriver[] = driverAgents.map((a) => ({
    id: a.id,
    name: a.companyName,
    state: a.state ?? "—",
    phone: a.phone1,
    activeDeliveries: a.deliveries.length,
  }));

  return { orders, drivers };
}
