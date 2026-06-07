import { prisma } from "@/lib/db/prisma";

export type DispatchOrder = {
  id: string;
  orderNumber: string;
  agentId: string | null;
  agentName: string;
  address: string;
  state: string;
  deliveryId: string | null;
  sourceType: "order" | "stockOut" | "stockTransfer";
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
  const [confirmedOrders, driverRows, outgoingMovements, pendingTransfers] =
    await Promise.all([
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
      prisma.driver.findMany({
        where: { status: "ACTIVE", deletedAt: null },
        orderBy: { name: "asc" },
        include: {
          deliveries: {
            where: { status: "IN_TRANSIT" },
            select: { id: true },
          },
        },
      }),
      // Stock out vouchers awaiting dispatch
      prisma.stockMovement.findMany({
        where: { type: "OUTGOING", status: "RECORDED" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          referenceNumber: true,
          state: true,
          agent: { select: { id: true, companyName: true, address: true, state: true } },
          toAgent: { select: { id: true, companyName: true, address: true, state: true } },
        },
      }),
      // Stock transfers awaiting dispatch
      prisma.stockTransfer.findMany({
        where: { status: "SUBMITTED" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          referenceNumber: true,
          targetType: true,
          targetId: true,
        },
      }),
    ]);

  // Resolve target warehouse/agent for transfers
  const transferWarehouseIds = [
    ...new Set(
      pendingTransfers
        .filter((t) => t.targetType === "WAREHOUSE")
        .map((t) => t.targetId)
    ),
  ];
  const transferAgentIds = [
    ...new Set(
      pendingTransfers
        .filter((t) => t.targetType === "AGENT")
        .map((t) => t.targetId)
    ),
  ];

  const [transferWarehouses, transferAgents] = await Promise.all([
    transferWarehouseIds.length > 0
      ? prisma.warehouse.findMany({
          where: { id: { in: transferWarehouseIds } },
          select: { id: true, name: true, address: true },
        })
      : [],
    transferAgentIds.length > 0
      ? prisma.agent.findMany({
          where: { id: { in: transferAgentIds } },
          select: { id: true, companyName: true, address: true, state: true },
        })
      : [],
  ]);

  const whMap = new Map(transferWarehouses.map((w) => [w.id, w]));
  const agentMap = new Map(transferAgents.map((a) => [a.id, a]));

  const orders: DispatchOrder[] = [
    ...confirmedOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      agentId: o.agent?.id ?? null,
      agentName: o.agent?.companyName ?? "—",
      address: o.customer.deliveryAddress,
      state: o.customer.state,
      deliveryId: o.deliveries[0]?.id ?? null,
      sourceType: "order" as const,
    })),
    ...outgoingMovements.map((m) => ({
      id: m.id,
      orderNumber: m.referenceNumber,
      // toAgent = destination (always set); agent = source agent for agent-to-agent only
      agentId: m.toAgent?.id ?? m.agent?.id ?? null,
      agentName: m.toAgent?.companyName ?? m.agent?.companyName ?? "—",
      address: m.toAgent?.address ?? m.agent?.address ?? "—",
      // m.state is the destination state recorded on the movement form
      state: m.state ?? m.toAgent?.state ?? m.agent?.state ?? "—",
      deliveryId: null,
      sourceType: "stockOut" as const,
    })),
    ...pendingTransfers.map((t) => {
      const isWarehouse = t.targetType === "WAREHOUSE";
      const wh = isWarehouse ? whMap.get(t.targetId) : null;
      const ag = !isWarehouse ? agentMap.get(t.targetId) : null;
      return {
        id: t.id,
        orderNumber: t.referenceNumber,
        agentId: ag?.id ?? null,
        agentName: wh?.name ?? ag?.companyName ?? "—",
        address: wh?.address ?? ag?.address ?? "—",
        state: ag?.state ?? "—",
        deliveryId: null,
        sourceType: "stockTransfer" as const,
      };
    }),
  ];

  const drivers: DispatchDriver[] = driverRows.map((d) => ({
    id: d.id,
    name: d.name,
    state: d.state ?? "—",
    phone: d.phone1,
    activeDeliveries: d.deliveries.length,
  }));

  return { orders, drivers };
}
