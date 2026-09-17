import { prisma } from "@/lib/db/prisma";
import { Prisma, type OrderStatus } from "@prisma/client";

export async function getAllOrders() {
  return prisma.order.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({ where: { id } });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return prisma.order.update({ where: { id }, data: { status } });
}

// Fetch all orders for a sales rep with related data needed for the list view.
// Called once on the orders page; tab filtering happens client-side from this result.
export async function getSalesRepOrders(salesRepId: string) {
  return prisma.order.findMany({
    where: { salesRepId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { name: true, email: true },
      },
      agent: {
        select: { companyName: true, state: true },
      },
      items: {
        include: { product: { select: { name: true } } },
      },
    },
  });
}

// Fetch orders eligible for reassignment (PENDING or CONFIRMED only).
export async function getAssignableOrders() {
  return prisma.order.findMany({
    where: {
      deletedAt: null,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, email: true, state: true } },
      agent: { select: { companyName: true, state: true } },
      items: { include: { product: { select: { name: true } } } },
      salesRep: { select: { id: true, name: true } },
    },
  });
}

// Fetch all orders for admin (no salesRepId filter).
export async function getAdminOrders() {
  return prisma.order.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { name: true, email: true, state: true },
      },
      agent: {
        select: { companyName: true, state: true },
      },
      items: {
        include: { product: { select: { name: true } } },
      },
      salesRep: {
        select: { name: true, team: { select: { id: true, name: true } } },
      },
    },
  });
}

// Fetch all orders handled by a single sales rep (same shape as getAdminOrders).
export async function getOrdersBySalesRep(salesRepId: string) {
  return prisma.order.findMany({
    where: { salesRepId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, email: true, state: true } },
      agent: { select: { companyName: true, state: true } },
      items: { include: { product: { select: { name: true } } } },
      salesRep: { select: { name: true } },
    },
  });
}

// Fetch all orders handled by a single delivery agent (same shape as getAdminOrders).
export async function getOrdersByAgent(agentId: string) {
  return prisma.order.findMany({
    where: { agentId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, email: true, state: true } },
      agent: { select: { companyName: true, state: true } },
      items: { include: { product: { select: { name: true } } } },
      salesRep: { select: { name: true } },
    },
  });
}

// Fetch all orders belonging to a set of sales reps (a team).
export async function getTeamOrders(memberIds: string[]) {
  if (memberIds.length === 0) return [];
  return prisma.order.findMany({
    where: { salesRepId: { in: memberIds }, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, email: true } },
      agent: { select: { companyName: true, state: true } },
      items: { include: { product: { select: { name: true } } } },
      salesRep: { select: { name: true, team: { select: { id: true, name: true } } } },
    },
  });
}

// Full order details for the detail page.
export async function getOrderWithDetails(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      agent: {
        select: {
          id: true,
          companyName: true,
          state: true,
          address: true,
          phone1: true,
          _count: { select: { deliveries: true, orders: true } },
        },
      },
      items: {
        include: { product: { select: { id: true, name: true, imageUrl: true } } },
      },
      salesRep: {
        select: { id: true, name: true },
      },
      discountedBy: {
        select: { id: true, name: true },
      },
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

// ── Server-side paged + filtered admin orders (docs/orders-pagination-plan.md) ──
// Powers the admin "All Orders" screen AND the scoped per-rep / per-agent staff
// order views (via `base`). One page (default 10 rows) with filters applied in the
// DB, instead of loading every order and filtering in the browser.

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customer: { name: string; email: string | null; state: string };
  agent: { companyName: string; state: string | null } | null;
  items: Array<{ quantity: number; upsellQuantity: number; isUpsell: boolean; product: { name: string } }>;
  salesRep: { name: string };
  team?: { id: string; name: string } | null;
};

const ADMIN_ORDER_SELECT = {
  id: true,
  orderNumber: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { name: true, email: true, state: true } },
  agent: { select: { companyName: true, state: true } },
  items: { select: { quantity: true, upsellQuantity: true, isUpsell: true, product: { select: { name: true } } } },
  salesRep: { select: { name: true, team: { select: { id: true, name: true } } } },
} satisfies Prisma.OrderSelect;

type AdminOrderRaw = Prisma.OrderGetPayload<{ select: typeof ADMIN_ORDER_SELECT }>;

function toAdminOrderRow(o: AdminOrderRaw): AdminOrderRow {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    customer: { name: o.customer.name, email: o.customer.email ?? null, state: o.customer.state },
    agent: o.agent ? { companyName: o.agent.companyName, state: o.agent.state ?? null } : null,
    items: o.items.map((i) => ({ quantity: i.quantity, upsellQuantity: i.upsellQuantity, isUpsell: i.isUpsell, product: { name: i.product.name } })),
    salesRep: { name: o.salesRep.name },
    team: o.salesRep.team ? { id: o.salesRep.team.id, name: o.salesRep.team.name } : null,
  };
}

export type AdminOrderFilters = {
  status?: OrderStatus;
  /** Free text across order number, customer name/email, sales-rep name. */
  search?: string;
  productName?: string;
  state?: string;
  teamId?: string;
  /** "YYYY-MM-DD" — placed date (Order.createdAt), single day (admin behavior). */
  date?: string;
};

function buildAdminOrderWhere(
  f: AdminOrderFilters,
  base: Prisma.OrderWhereInput = {},
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = { deletedAt: null, ...base };
  if (f.status) where.status = f.status;
  const q = f.search?.trim();
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customer: { is: { name: { contains: q, mode: "insensitive" } } } },
      { customer: { is: { email: { contains: q, mode: "insensitive" } } } },
      { salesRep: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (f.productName) where.items = { some: { product: { name: f.productName } } };
  if (f.state) where.customer = { is: { state: { equals: f.state, mode: "insensitive" } } };
  if (f.teamId) where.salesRep = { is: { teamId: f.teamId } };
  if (f.date) {
    const [y, m, d] = f.date.split("-").map(Number);
    if (y && m && d) {
      where.createdAt = { gte: new Date(y, m - 1, d, 0, 0, 0, 0), lt: new Date(y, m - 1, d + 1, 0, 0, 0, 0) };
    }
  }
  return where;
}

/**
 * One page of admin orders + total + per-status tab counts. Tab counts use every
 * filter EXCEPT status (so switching tabs makes sense). `base` scopes the query for
 * the per-rep (`{ salesRepId }`) / per-agent (`{ agentId }`) staff views.
 */
export async function getAdminOrdersPage(
  filters: AdminOrderFilters,
  page: number,
  pageSize = 10,
  base: Prisma.OrderWhereInput = {},
): Promise<{ rows: AdminOrderRow[]; total: number; statusCounts: Record<string, number> }> {
  const where = buildAdminOrderWhere(filters, base);
  const whereNoStatus = buildAdminOrderWhere({ ...filters, status: undefined }, base);
  const safePage = Math.max(1, Math.floor(page) || 1);

  const [orders, total, grouped] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      select: ADMIN_ORDER_SELECT,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], where: whereNoStatus, _count: { _all: true } }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const g of grouped) statusCounts[g.status] = g._count._all;

  return { rows: orders.map(toAdminOrderRow), total, statusCounts };
}
