import { prisma } from "@/lib/db/prisma";
import { OrderStatus } from "@prisma/client";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, OrderDisplayStatus> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

type OrderDisplayStatus = "Pending" | "Confirmed" | "Delivered" | "Cancelled" | "Failed";

const PRODUCT_COLORS = [
  "#532194",
  "#1D9BF0",
  "#27AE60",
  "#EB5757",
  "#F2994A",
  "#9B59B6",
  "#2C3E50",
];

function productColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return PRODUCT_COLORS[hash % PRODUCT_COLORS.length];
}

function fmtDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

function fmtDateTime(date: Date): string {
  return date.toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function avatarUrl(name: string, url: string | null): string {
  return url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f3f4f6&color=6b7280`;
}

// ─── Compute lightweight performance from order status counts ─────────────────

function computePerformance(orders: { status: OrderStatus; createdAt: Date }[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthOrders = orders.filter((o) => o.createdAt >= monthStart);
  const total = monthOrders.length;
  if (total === 0) return 0;
  const confirmed = monthOrders.filter((o) => o.status === "CONFIRMED").length;
  const delivered = monthOrders.filter((o) => o.status === "DELIVERED").length;
  const failed = monthOrders.filter((o) => o.status === "FAILED").length;
  const cancelled = monthOrders.filter((o) => o.status === "CANCELLED").length;
  const attempted = confirmed + delivered + failed;
  const confirmationRate = (attempted / total) * 100;
  const cancellationRate = (cancelled / total) * 100;
  return Math.round(confirmationRate * 0.7 + (100 - cancellationRate) * 0.3);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SalesRepItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  avatarUrl: string;
  teamName: string;
  pendingOrderCount: number;
  generalPerformance: number;
};

export type OrderRow = {
  id: string;         // orderNumber – used as URL param for detail page
  gmail: string;
  name: string;
  agent: { id: string; name: string; state: string } | null;
  state: string;
  salesRep: string;
  salesRepId: string;
  teamId: string | null;
  teamName: string | null;
  product: string;
  quantity: number;
  date: string;
  status: OrderDisplayStatus;
  statusDate: string | null;  // Date when status changed (null for PENDING)
};

export type OrderDetailFull = {
  id: string;
  orderId: string;
  status: OrderDisplayStatus;
  repName: string;
  repAvatarUrl: string;
  customer: {
    fullName: string;
    phoneNumber: string;
    whatsappNumber: string;
    email: string;
    deliveryAddress: string;
    state: string;
    lga: string;
    landmark: string;
  };
  product: {
    name: string;
    quantity: number;
    imageColor: string;
    imageUrl?: string | null;
    totalPrice: string;
  };
  upsoldProduct?: { name: string; quantity: number };
  deliveryFee?: string;
  estimatedDeliveryDate?: string;
  agent?: {
    name: string;
    location: string;
    phone: string;
    totalDeliveries: number;
    activeOrders: number;
  };
  contactMethod: "Phone Call" | "WhatsApp" | "Both" | "None";
  cancellationReason?: string;
  failureReason?: string;
  prescription?: string;
  source: string;
  orderDate: string;
  history: Array<{
    event: string;
    date: string;
    repName?: string;
    agentName?: string;
  }>;
};

export type SalesRepProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  avatarUrl: string;
  teamName: string;
  orderCounts: {
    All: number;
    Pending: number;
    Confirmed: number;
    Delivered: number;
    Cancelled: number;
    Failed: number;
  };
  generalPerformance: number;
  kpiAchievement: number;
};

export type MetricCard = {
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  subText?: string;
};

export type RepAnalyticsData = {
  metrics: MetricCard[];
  kpi: {
    value: number;           // KPI percentage (delivered / total * 100)
    target: number;          // Target percentage (65%)
    change: string;          // Delta vs last period
    ordersDelivered: number; // Count of delivered orders
    totalOrders: number;     // Total orders handled
  };
  salesRepCount: number;     // Number of sales reps (for scaling bonus requirements)
  bestSellingProducts: { product: string; amount: number }[];
  upsellingRate: { product: string; upsell: number }[];
};

export type TeamAnalyticsEntry = {
  teamId: string;
  teamName: string;
  currentMetrics: RepAnalyticsData;
};

export type DeletedOrderRow = {
  id: string;            // audit log id
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  state: string;
  salesRep: string;
  product: string;
  quantity: number;
  status: string;
  total: string;
  orderDate: string;     // date the order was originally created
  deletedAt: string;     // date/time the order was deleted
};

export type DeletedOrderGroup = {
  label: string;
  date: string;
  entries: DeletedOrderRow[];
};

export type ActivityGroup = {
  label: string;
  date: string;
  entries: {
    id: string;
    dateTime: string;
    activityType: string;
    description: string;
  }[];
};

// ─── Helpers for metrics transformation ──────────────────────────────────────

type OrderForMetrics = {
  status: OrderStatus;
  customerId: string;
  isReorder: boolean;
  items: { productId: string; quantity: number; product: { name: string } }[];
};

function computeMetrics(orders: OrderForMetrics[]) {
  const total = orders.length;
  const confirmed = orders.filter((o) => o.status === "CONFIRMED").length;
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
  const failed = orders.filter((o) => o.status === "FAILED").length;
  const attempted = confirmed + delivered + failed;

  const confirmationRate = total > 0 ? Math.round((attempted / total) * 100) : 0;
  const deliveryRate = attempted > 0 ? Math.round((delivered / attempted) * 100) : 0;
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
  const recoveryRate =
    delivered + failed > 0 ? Math.round((delivered / (delivered + failed)) * 100) : 0;
  const generalPerformance = Math.round(confirmationRate * 0.7 + (100 - cancellationRate) * 0.3);

  const nonCancelled = orders.filter((o) => o.status !== "CANCELLED");
  const totalProductsSold = nonCancelled.flatMap((o) => o.items).reduce((s, i) => s + i.quantity, 0);
  const uniqueCustomers = new Set(orders.map((o) => o.customerId)).size;

  const deliveredQty = new Map<string, number>();
  for (const o of orders.filter((o) => o.status === "DELIVERED")) {
    for (const item of o.items) {
      deliveredQty.set(item.product.name, (deliveredQty.get(item.product.name) ?? 0) + item.quantity);
    }
  }
  const topProducts = [...deliveredQty.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, qty]) => ({ name, qty }));

  const multiItemOrders = orders.filter(
    (o) => new Set(o.items.map((i) => i.productId)).size > 1
  );
  const upsellRate = total > 0 ? Math.round((multiItemOrders.length / total) * 100) : 0;

  // Reorder rate = orders flagged as reorder / total orders
  const reorders = orders.filter((o) => o.isReorder).length;
  const reorderRate = total > 0 ? Math.round((reorders / total) * 100) : 0;

  const upsoldQty = new Map<string, number>();
  for (const o of multiItemOrders) {
    for (const item of o.items) {
      upsoldQty.set(item.product.name, (upsoldQty.get(item.product.name) ?? 0) + 1);
    }
  }
  const upsoldProducts = [...upsoldQty.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, qty]) => ({ name, qty }));

  // KPI = delivered / total * 100 (same formula as sales-rep)
  const kpi = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return {
    totalProductsSold,
    totalOrders: total,
    ordersDelivered: delivered,
    uniqueCustomers,
    bestSellingProduct: topProducts[0]?.name ?? "N/A",
    generalPerformance,
    upsellRate,
    reorderRate,
    confirmationRate,
    deliveryRate,
    cancellationRate,
    recoveryRate,
    kpi,
    topProducts,
    upsoldProducts,
  };
}

function toRepAnalyticsData(
  current: ReturnType<typeof computeMetrics>,
  last: ReturnType<typeof computeMetrics> | null,
  salesRepCount: number = 1
): RepAnalyticsData {
  function delta(cur: number, prev: number | null | undefined, isPercent = false): string {
    if (prev == null) return "—";
    const diff = cur - prev;
    return `${diff >= 0 ? "+" : ""}${diff}${isPercent ? "%" : ""}`;
  }

  const metrics: MetricCard[] = [
    {
      label: "Total Products Sold",
      value: current.totalProductsSold,
      change: delta(current.totalProductsSold, last?.totalProductsSold),
      isPositive: current.totalProductsSold >= (last?.totalProductsSold ?? 0),
    },
    {
      label: "Total Order/Customer",
      value: current.uniqueCustomers,
      change: delta(current.uniqueCustomers, last?.uniqueCustomers),
      isPositive: current.uniqueCustomers >= (last?.uniqueCustomers ?? 0),
    },
    {
      label: "Best Selling Product",
      value: current.bestSellingProduct,
      change: last?.bestSellingProduct ?? "—",
      isPositive: true,
    },
    {
      label: "General Performance",
      value: `${current.generalPerformance}%`,
      change: delta(current.generalPerformance, last?.generalPerformance, true),
      isPositive: current.generalPerformance >= (last?.generalPerformance ?? 0),
    },
    {
      label: "Upselling Rate",
      value: `${current.upsellRate}%`,
      change: delta(current.upsellRate, last?.upsellRate, true),
      isPositive: current.upsellRate >= (last?.upsellRate ?? 0),
    },
    {
      label: "Reorder Rate",
      value: `${current.reorderRate}%`,
      change: delta(current.reorderRate, last?.reorderRate, true),
      isPositive: current.reorderRate >= (last?.reorderRate ?? 0),
    },
    {
      label: "Delivery Rate",
      value: `${current.deliveryRate}%`,
      change: delta(current.deliveryRate, last?.deliveryRate, true),
      isPositive: current.deliveryRate >= (last?.deliveryRate ?? 0),
    },
    {
      label: "Cancellation Rate",
      value: `${current.cancellationRate}%`,
      change: delta(current.cancellationRate, last?.cancellationRate, true),
      isPositive: current.cancellationRate <= (last?.cancellationRate ?? current.cancellationRate),
    },
    {
      label: "Recovery Rate",
      value: `${current.recoveryRate}%`,
      change: delta(current.recoveryRate, last?.recoveryRate, true),
      isPositive: current.recoveryRate >= (last?.recoveryRate ?? 0),
    },
  ];

  return {
    metrics,
    kpi: {
      value: current.kpi,
      target: 65, // 65% KPI target (same as sales-rep)
      change: delta(current.kpi, last?.kpi, true),
      ordersDelivered: current.ordersDelivered,
      totalOrders: current.totalOrders,
    },
    salesRepCount,
    bestSellingProducts: current.topProducts.slice(0, 7).map((p) => ({
      product: p.name,
      amount: p.qty,
    })),
    upsellingRate: current.upsoldProducts.slice(0, 7).map((p) => ({
      product: p.name,
      upsell: p.qty,
    })),
  };
}

async function fetchOrdersForMetrics(where: object): Promise<OrderForMetrics[]> {
  return prisma.order.findMany({
    where: { deletedAt: null, ...where },
    select: {
      status: true,
      customerId: true,
      isReorder: true,
      items: {
        select: {
          productId: true,
          quantity: true,
          product: { select: { name: true } },
        },
      },
    },
  });
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Permanently delete an order and all related records.
 * This is a HARD DELETE - data cannot be recovered.
 */
export async function hardDeleteOrder(
  orderNumber: string,
  deletedByUserId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the order by orderNumber, capturing a snapshot for the deletion record
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        netAmount: true,
        createdAt: true,
        customer: { select: { name: true, email: true, state: true } },
        salesRep: { select: { name: true } },
        items: {
          select: { quantity: true, product: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Delete in order to respect foreign key constraints
    // 1. Delete order items first
    await prisma.orderItem.deleteMany({
      where: { orderId: order.id },
    });

    // 2. Delete any deliveries associated with the order
    await prisma.delivery.deleteMany({
      where: { orderId: order.id },
    });

    // 3. Delete the order itself
    await prisma.order.delete({
      where: { id: order.id },
    });

    // 4. Record a deletion snapshot so the data analyst can review deleted orders.
    if (deletedByUserId) {
      await prisma.auditLog.create({
        data: {
          userId: deletedByUserId,
          action: "ORDER_DELETED",
          entityType: "Order",
          entityId: order.orderNumber,
          details: {
            orderNumber: order.orderNumber,
            customerName: order.customer.name,
            customerEmail: order.customer.email ?? "",
            state: order.customer.state,
            salesRep: order.salesRep.name,
            product: order.items[0]?.product.name ?? "—",
            quantity: order.items[0]?.quantity ?? 0,
            status: STATUS_MAP[order.status] ?? "Pending",
            total: Number(order.netAmount),
            orderDate: fmtDate(order.createdAt),
          },
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error hard deleting order:", error);
    return { success: false, error: "Failed to delete order" };
  }
}

export async function getSalesTeams(): Promise<{ id: string; name: string }[]> {
  const teams = await prisma.team.findMany({
    where: { department: "SALES" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return teams;
}

/** All active product names — used to populate the product filter with the full catalog. */
export async function getProductsForFilter(): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return products.map((p) => p.name);
}

export async function getDeliveryAgents(): Promise<{ id: string; name: string; ordersToday: number }[]> {
  const agents = await prisma.agent.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      companyName: true,
      orders: {
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        select: { id: true },
      },
    },
    orderBy: { companyName: "asc" },
  });

  return agents.map((a) => ({
    id: a.id,
    name: a.companyName,
    ordersToday: a.orders.length,
  }));
}

export async function getSalesRepsForFilter(): Promise<{ id: string; name: string; ordersToday: number }[]> {
  const salesReps = await prisma.user.findMany({
    where: { role: "SALES_REP", isActive: true },
    select: {
      id: true,
      name: true,
      orders: {
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return salesReps.map((rep) => ({
    id: rep.id,
    name: rep.name,
    ordersToday: rep.orders.length,
  }));
}

export async function getSalesRepsList(): Promise<SalesRepItem[]> {
  const users = await prisma.user.findMany({
    where: { role: "SALES_REP", isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      whatsappNumber: true,
      avatarUrl: true,
      team: { select: { name: true } },
      orders: {
        where: { deletedAt: null },
        select: { status: true, createdAt: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? "",
    whatsapp: u.whatsappNumber ?? "",
    avatarUrl: avatarUrl(u.name, u.avatarUrl),
    teamName: u.team?.name ?? "No Team",
    pendingOrderCount: u.orders.filter((o) => o.status === "PENDING").length,
    generalPerformance: computePerformance(u.orders as any),
  }));
}

export async function getAllOrders(): Promise<OrderRow[]> {
  const orders = await prisma.order.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      customer: { select: { name: true, email: true, state: true } },
      agent: { select: { id: true, companyName: true, state: true } },
      salesRep: { select: { id: true, name: true, team: { select: { id: true, name: true } } } },
      items: {
        select: {
          quantity: true,
          product: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 2,
      },
    },
  });

  return orders.map((o) => ({
    id: o.orderNumber,
    gmail: o.customer.email ?? "",
    name: o.customer.name,
    agent: o.agent ? { id: o.agent.id, name: o.agent.companyName, state: o.agent.state ?? "" } : null,
    state: o.customer.state,
    salesRep: o.salesRep.name,
    salesRepId: o.salesRep.id,
    teamId: o.salesRep.team?.id ?? null,
    teamName: o.salesRep.team?.name ?? null,
    product: o.items[0]?.product.name ?? "—",
    quantity: o.items[0]?.quantity ?? 0,
    date: fmtDate(o.createdAt),
    status: STATUS_MAP[o.status] ?? "Pending",
    statusDate: o.status === "PENDING" ? null : fmtDate(o.updatedAt),
  }));
}

export async function getOrderByOrderNumber(orderNumber: string): Promise<OrderDetailFull | null> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      customer: true,
      salesRep: { select: { name: true, avatarUrl: true } },
      agent: {
        select: {
          companyName: true,
          state: true,
          address: true,
          phone1: true,
          _count: {
            select: {
              deliveries: { where: { status: "DELIVERED" } },
              orders: { where: { status: "CONFIRMED", deletedAt: null } },
            },
          },
        },
      },
      items: {
        include: { product: { select: { name: true, sellingPrice: true, imageUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
      deliveries: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) return null;

  const firstItem = order.items[0];
  const upsoldItem = order.items[1];

  const firstDelivery = order.deliveries[0];
  const history: OrderDetailFull["history"] = [
    { event: "Order Created", date: fmtDateTime(order.createdAt), repName: order.salesRep.name },
    { event: "Sales Rep Assigned", date: fmtDateTime(order.createdAt), repName: order.salesRep.name },
  ];
  // A delivery is created at confirmation time, so its existence marks the order
  // as having been confirmed — show the confirmation-related events for
  // confirmed/delivered/failed orders.
  if (firstDelivery) {
    history.push({
      event: "Order Confirmed",
      date: fmtDateTime(firstDelivery.createdAt),
      repName: order.salesRep.name,
    });
    history.push({
      event: "Prescription Sent",
      date: fmtDateTime(firstDelivery.createdAt),
      repName: order.salesRep.name,
    });
    if (order.agent) {
      history.push({
        event: "Delivery Agent Assigned",
        date: fmtDateTime(firstDelivery.createdAt),
        agentName: order.agent.companyName,
      });
    }
  }
  for (const d of order.deliveries) {
    if (d.status === "IN_TRANSIT") {
      history.push({
        event: "Order Dispatched",
        date: fmtDateTime(d.createdAt),
        agentName: order.agent?.companyName,
      });
    }
    if (d.status === "DELIVERED") {
      history.push({
        event: "Order Delivered",
        date: fmtDateTime(d.updatedAt),
        agentName: order.agent?.companyName,
      });
    }
    if (d.status === "FAILED") {
      history.push({
        event: "Delivery Failed",
        date: fmtDateTime(d.updatedAt),
        agentName: order.agent?.companyName,
      });
    }
  }
  if (order.status === "CANCELLED") {
    history.push({ event: "Order Cancelled", date: fmtDateTime(order.updatedAt), repName: order.salesRep.name });
  }

  return {
    id: order.id,
    orderId: order.orderNumber,
    status: STATUS_MAP[order.status] ?? "Pending",
    repName: order.salesRep.name,
    repAvatarUrl: avatarUrl(order.salesRep.name, order.salesRep.avatarUrl),
    customer: {
      fullName: order.customer.name,
      phoneNumber: order.customer.phone,
      whatsappNumber: order.customer.whatsappNumber ?? order.customer.phone,
      email: order.customer.email ?? "",
      deliveryAddress: order.customer.deliveryAddress,
      state: order.customer.state,
      lga: order.customer.lga,
      landmark: order.customer.landmark ?? "",
    },
    product: {
      name: firstItem?.product.name ?? "—",
      quantity: firstItem?.quantity ?? 0,
      imageColor: productColor(firstItem?.product.name ?? ""),
      imageUrl: firstItem?.product.imageUrl ?? null,
      totalPrice: `₦${Number(order.netAmount).toLocaleString("en-NG")}`,
    },
    upsoldProduct: upsoldItem
      ? { name: upsoldItem.product.name, quantity: upsoldItem.quantity }
      : undefined,
    deliveryFee: Number(order.deliveryFee) > 0
      ? `₦${Number(order.deliveryFee).toLocaleString("en-NG")}`
      : undefined,
    estimatedDeliveryDate: firstDelivery?.scheduledTime
      ? fmtDate(firstDelivery.scheduledTime)
      : undefined,
    agent: order.agent
      ? {
        name: order.agent.companyName,
        location: order.agent.state ?? order.agent.address ?? "",
        phone: order.agent.phone1,
        totalDeliveries: order.agent._count.deliveries,
        activeOrders: order.agent._count.orders,
      }
      : undefined,
    contactMethod:
      order.contactMethod === "PHONE"
        ? "Phone Call"
        : order.contactMethod === "WHATSAPP"
          ? "WhatsApp"
          : "None",
    cancellationReason:
      order.status === "CANCELLED" ? (order.cancellationReason ?? undefined) : undefined,
    failureReason:
      order.status === "FAILED"
        ? (order.deliveries.find((d) => d.failureReason)?.failureReason ?? undefined)
        : undefined,
    prescription: order.notes ?? undefined,
    source: order.customer.source ?? "Direct",
    orderDate: fmtDate(order.createdAt),
    history,
  };
}

export async function getSalesRepProfile(userId: string): Promise<SalesRepProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId, role: "SALES_REP" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      whatsappNumber: true,
      avatarUrl: true,
      team: { select: { name: true } },
      orders: {
        where: { deletedAt: null },
        select: { status: true, createdAt: true },
      },
    },
  });

  if (!user) return null;

  const orders = user.orders;
  const orderCounts = {
    All: orders.length,
    Pending: orders.filter((o) => o.status === "PENDING").length,
    Confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
    Delivered: orders.filter((o) => o.status === "DELIVERED").length,
    Cancelled: orders.filter((o) => o.status === "CANCELLED").length,
    Failed: orders.filter((o) => o.status === "FAILED").length,
  };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthOrders = orders.filter((o) => o.createdAt >= monthStart);
  const total = monthOrders.length;
  const delivered = monthOrders.filter((o) => o.status === "DELIVERED").length;
  const kpiAchievement = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    whatsapp: user.whatsappNumber ?? "",
    avatarUrl: avatarUrl(user.name, user.avatarUrl),
    teamName: user.team?.name ?? "No Team",
    orderCounts,
    generalPerformance: computePerformance(orders as any),
    kpiAchievement,
  };
}

export async function getSalesRepOrders(salesRepId: string): Promise<OrderRow[]> {
  const orders = await prisma.order.findMany({
    where: { salesRepId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      customer: { select: { name: true, email: true, state: true } },
      agent: { select: { id: true, companyName: true, state: true } },
      salesRep: { select: { id: true, name: true, team: { select: { id: true, name: true } } } },
      items: {
        select: {
          quantity: true,
          product: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  return orders.map((o) => ({
    id: o.orderNumber,
    gmail: o.customer.email ?? "",
    name: o.customer.name,
    agent: o.agent ? { id: o.agent.id, name: o.agent.companyName, state: o.agent.state ?? "" } : null,
    state: o.customer.state,
    salesRep: o.salesRep.name,
    salesRepId: o.salesRep.id,
    teamId: o.salesRep.team?.id ?? null,
    teamName: o.salesRep.team?.name ?? null,
    product: o.items[0]?.product.name ?? "—",
    quantity: o.items[0]?.quantity ?? 0,
    date: fmtDate(o.createdAt),
    status: STATUS_MAP[o.status] ?? "Pending",
    statusDate: o.status === "PENDING" ? null : fmtDate(o.updatedAt),
  }));
}

export async function getSalesRepAnalyticsForUI(
  salesRepId: string,
  options?: { month: number; year: number }
): Promise<RepAnalyticsData> {
  const now = new Date();
  const month = options?.month ?? now.getMonth();
  const year = options?.year ?? now.getFullYear();

  const currentStart = new Date(year, month, 1);
  const nextStart = new Date(year, month + 1, 1);
  const lastStart = new Date(year, month - 1, 1);

  const [currentOrders, lastOrders] = await Promise.all([
    fetchOrdersForMetrics({ salesRepId, createdAt: { gte: currentStart, lt: nextStart } }),
    fetchOrdersForMetrics({ salesRepId, createdAt: { gte: lastStart, lt: currentStart } }),
  ]);

  const current = computeMetrics(currentOrders);
  const last = lastOrders.length > 0 ? computeMetrics(lastOrders) : null;
  return toRepAnalyticsData(current, last);
}

export type Period = "week" | "month";

export async function getTeamsAnalytics(options?: {
  month?: number;
  year?: number;
  period?: Period;
}): Promise<TeamAnalyticsEntry[]> {
  const teams = await prisma.team.findMany({
    where: { department: "SALES" },
    select: {
      id: true,
      name: true,
      members: { where: { role: "SALES_REP" }, select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const period = options?.period ?? "month";

  let currentStart: Date;
  let currentEnd: Date;
  let lastStart: Date;

  if (period === "week") {
    // Current week: last 7 days
    currentStart = new Date(now);
    currentStart.setDate(now.getDate() - 6);
    currentStart.setHours(0, 0, 0, 0);
    currentEnd = new Date(now);
    currentEnd.setDate(now.getDate() + 1);
    currentEnd.setHours(0, 0, 0, 0);
    // Last week: 7 days before current week
    lastStart = new Date(now);
    lastStart.setDate(now.getDate() - 13);
    lastStart.setHours(0, 0, 0, 0);
  } else {
    // Month mode
    const month = options?.month ?? now.getMonth();
    const year = options?.year ?? now.getFullYear();
    currentStart = new Date(year, month, 1);
    currentEnd = new Date(year, month + 1, 1);
    lastStart = new Date(year, month - 1, 1);
  }

  const results: TeamAnalyticsEntry[] = [];

  for (const team of teams) {
    const repIds = team.members.map((m) => m.id);
    const salesRepCount = repIds.length;
    if (repIds.length === 0) {
      results.push({
        teamId: team.id,
        teamName: team.name,
        currentMetrics: toRepAnalyticsData(computeMetrics([]), null, 0),
      });
      continue;
    }

    const [currentOrders, lastOrders] = await Promise.all([
      fetchOrdersForMetrics({ salesRepId: { in: repIds }, createdAt: { gte: currentStart, lt: currentEnd } }),
      fetchOrdersForMetrics({ salesRepId: { in: repIds }, createdAt: { gte: lastStart, lt: currentStart } }),
    ]);

    const current = computeMetrics(currentOrders);
    const last = lastOrders.length > 0 ? computeMetrics(lastOrders) : null;
    results.push({
      teamId: team.id,
      teamName: team.name,
      currentMetrics: toRepAnalyticsData(current, last, salesRepCount),
    });
  }

  return results;
}

export async function getCompanyAnalytics(options?: {
  month?: number;
  year?: number;
  period?: Period;
}): Promise<RepAnalyticsData> {
  const now = new Date();
  const period = options?.period ?? "month";

  let currentStart: Date;
  let currentEnd: Date;
  let lastStart: Date;

  if (period === "week") {
    // Current week: last 7 days
    currentStart = new Date(now);
    currentStart.setDate(now.getDate() - 6);
    currentStart.setHours(0, 0, 0, 0);
    currentEnd = new Date(now);
    currentEnd.setDate(now.getDate() + 1);
    currentEnd.setHours(0, 0, 0, 0);
    // Last week: 7 days before current week
    lastStart = new Date(now);
    lastStart.setDate(now.getDate() - 13);
    lastStart.setHours(0, 0, 0, 0);
  } else {
    // Month mode
    const month = options?.month ?? now.getMonth();
    const year = options?.year ?? now.getFullYear();
    currentStart = new Date(year, month, 1);
    currentEnd = new Date(year, month + 1, 1);
    lastStart = new Date(year, month - 1, 1);
  }

  // Count all sales reps in the company
  const salesRepCount = await prisma.user.count({
    where: { role: "SALES_REP", isActive: true },
  });

  const [currentOrders, lastOrders] = await Promise.all([
    fetchOrdersForMetrics({ createdAt: { gte: currentStart, lt: currentEnd } }),
    fetchOrdersForMetrics({ createdAt: { gte: lastStart, lt: currentStart } }),
  ]);

  const current = computeMetrics(currentOrders);
  const last = lastOrders.length > 0 ? computeMetrics(lastOrders) : null;
  return toRepAnalyticsData(current, last, salesRepCount);
}

export async function getUserActivityHistory(userId: string): Promise<ActivityGroup[]> {
  const logs = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      entityType: true,
      details: true,
      createdAt: true,
    },
  });

  if (logs.length === 0) return [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const groups: Map<string, ActivityGroup> = new Map();

  for (const log of logs) {
    const d = log.createdAt;
    let label: string;
    let dateStr: string;

    if (d >= todayStart) {
      label = "Today";
      dateStr = todayStart.toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" });
    } else if (d >= yesterdayStart) {
      label = "A Day Ago";
      dateStr = yesterdayStart.toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" });
    } else {
      label = d.toLocaleDateString("en-NG", { month: "long", day: "numeric" });
      dateStr = d.toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" });
    }

    if (!groups.has(label)) {
      groups.set(label, { label, date: dateStr, entries: [] });
    }

    const details = log.details as Record<string, unknown>;
    const description =
      typeof details?.description === "string"
        ? details.description
        : `${log.action} on ${log.entityType}`;

    groups.get(label)!.entries.push({
      id: log.id,
      dateTime: fmtDateTime(d),
      activityType: log.action,
      description,
    });
  }

  return [...groups.values()];
}

/**
 * Returns the orders a user has permanently deleted, grouped by deletion date.
 * Backed by ORDER_DELETED audit-log snapshots written at delete time.
 */
export async function getDeletedOrders(userId: string): Promise<DeletedOrderGroup[]> {
  const logs = await prisma.auditLog.findMany({
    where: { userId, action: "ORDER_DELETED", entityType: "Order" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, details: true, createdAt: true },
  });

  if (logs.length === 0) return [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const groups: Map<string, DeletedOrderGroup> = new Map();

  for (const log of logs) {
    const d = log.createdAt;
    let label: string;
    let dateStr: string;

    if (d >= todayStart) {
      label = "Today";
      dateStr = todayStart.toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" });
    } else if (d >= yesterdayStart) {
      label = "A Day Ago";
      dateStr = yesterdayStart.toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" });
    } else {
      label = d.toLocaleDateString("en-NG", { month: "long", day: "numeric" });
      dateStr = d.toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" });
    }

    if (!groups.has(label)) {
      groups.set(label, { label, date: dateStr, entries: [] });
    }

    const det = (log.details ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    const num = (v: unknown) => (typeof v === "number" ? v : 0);

    groups.get(label)!.entries.push({
      id: log.id,
      orderNumber: str(det.orderNumber),
      customerName: str(det.customerName),
      customerEmail: str(det.customerEmail),
      state: str(det.state),
      salesRep: str(det.salesRep),
      product: str(det.product) || "—",
      quantity: num(det.quantity),
      status: str(det.status) || "Pending",
      total: `₦${num(det.total).toLocaleString("en-NG")}`,
      orderDate: str(det.orderDate),
      deletedAt: fmtDateTime(d),
    });
  }

  return [...groups.values()];
}
