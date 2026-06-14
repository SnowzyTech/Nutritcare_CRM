import { prisma } from "@/lib/db/prisma";

/** Members of a conversation matching a query — for @mention autocomplete. */
export async function searchMembersForMention(
  conversationId: string,
  userId: string,
  q: string
) {
  // Guard: only members can list members.
  const self = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { id: true },
  });
  if (!self) return [];

  const members = await prisma.conversationMember.findMany({
    where: {
      conversationId,
      user: q
        ? { name: { contains: q, mode: "insensitive" }, isActive: true }
        : { isActive: true },
    },
    take: 8,
    select: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return members.map((m) => m.user);
}

/** Orders matching a query by order number — for #order-tag autocomplete. */
export async function searchOrdersForTag(q: string) {
  if (!q) return [];
  const orders = await prisma.order.findMany({
    where: { deletedAt: null, orderNumber: { contains: q, mode: "insensitive" } },
    take: 8,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      customer: { select: { name: true } },
    },
  });
  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    customerName: o.customer.name,
  }));
}

export type OrderTagSummary = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  state: string;
  salesRep: string;
  agent: string | null;
  netAmount: string;
  date: Date;
  itemCount: number;
};

/**
 * Compact, role-agnostic order details for the click-through modal. Authorized
 * by tag visibility: the order must have been tagged in a conversation the
 * requesting user belongs to.
 */
export async function getOrderTagSummary(
  orderId: string,
  userId: string
): Promise<OrderTagSummary | null> {
  const visible = await prisma.messageOrderRef.findFirst({
    where: {
      orderId,
      message: { conversation: { members: { some: { userId } } } },
    },
    select: { id: true },
  });
  if (!visible) return null;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      netAmount: true,
      date: true,
      customer: { select: { name: true, phone: true, deliveryAddress: true, state: true } },
      salesRep: { select: { name: true } },
      agent: { select: { companyName: true } },
      _count: { select: { items: true } },
    },
  });
  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    deliveryAddress: order.customer.deliveryAddress,
    state: order.customer.state,
    salesRep: order.salesRep.name,
    agent: order.agent?.companyName ?? null,
    netAmount: order.netAmount.toString(),
    date: order.date,
    itemCount: order._count.items,
  };
}
