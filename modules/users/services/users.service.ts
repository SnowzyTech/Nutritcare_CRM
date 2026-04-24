import { prisma } from "@/lib/db/prisma";
import type { UserRole } from "@prisma/client";

// ── Analytics helpers ─────────────────────────────────────────────────────────

function computeRepMetrics(orders: Array<{
  status: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; product: { name: string } }>;
}>) {
  const total = orders.length;
  const delivered = orders.filter(o => o.status === "DELIVERED").length;
  const failed = orders.filter(o => o.status === "FAILED").length;
  const cancelled = orders.filter(o => o.status === "CANCELLED").length;
  const confirmed = orders.filter(o => o.status === "CONFIRMED").length;
  const pending = orders.filter(o => o.status === "PENDING").length;

  const dispatched = delivered + failed;
  const deliveryRate = dispatched > 0 ? Math.round((delivered / dispatched) * 100) : 0;
  const confirmationRate = total > 0 ? Math.round(((confirmed + delivered) / total) * 100) : 0;
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  const multiItemOrders = orders.filter(o => {
    const uniqueProducts = new Set(o.items.map(i => i.productId));
    return uniqueProducts.size > 1;
  }).length;
  const upsellRate = total > 0 ? Math.round((multiItemOrders / total) * 100) : 0;

  const generalPerformance = Math.round((deliveryRate * 0.6 + confirmationRate * 0.4));

  const deliveredOrders = orders.filter(o => o.status === "DELIVERED");
  const totalProductsSold = deliveredOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0
  );

  const productMap: Record<string, { name: string; qty: number }> = {};
  deliveredOrders.forEach(o => {
    o.items.forEach(item => {
      if (!productMap[item.productId]) productMap[item.productId] = { name: item.product.name, qty: 0 };
      productMap[item.productId].qty += item.quantity;
    });
  });
  const bestProduct = Object.values(productMap).sort((a, b) => b.qty - a.qty)[0] ?? null;

  const distinctCustomers = new Set(orders.map(o => o.customerId)).size;

  return { total, delivered, failed, cancelled, confirmed, pending, deliveryRate, confirmationRate, cancellationRate, upsellRate, generalPerformance, totalProductsSold, bestProduct, distinctCustomers };
}

function trendLabel(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "—";
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

/**
 * Users service — user management business logic.
 * Admin-only operations for managing system users.
 */

export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUsersByRole(role: UserRole) {
  return prisma.user.findMany({
    where: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

// Active sales reps with their count of PENDING+CONFIRMED orders (workload indicator).
export async function getActiveSalesRepsWithOrderCounts() {
  return prisma.user.findMany({
    where: { role: "SALES_REP", isActive: true },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      _count: {
        select: {
          orders: {
            where: { deletedAt: null, status: { in: ["PENDING", "CONFIRMED"] } },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

// ── Sales Rep service functions ───────────────────────────────────────────────

export async function getSalesRepsList() {
  const reps = await prisma.user.findMany({
    where: { role: "SALES_REP", isActive: true },
    select: { id: true, name: true, phone: true, avatarUrl: true },
    orderBy: { name: "asc" },
  });

  const repIds = reps.map(r => r.id);
  const stats = await prisma.order.groupBy({
    by: ["salesRepId", "status"],
    where: { salesRepId: { in: repIds }, deletedAt: null },
    _count: { id: true },
  });

  const statsMap: Record<string, Record<string, number>> = {};
  for (const s of stats) {
    if (!s.salesRepId) continue;
    statsMap[s.salesRepId] ??= {};
    statsMap[s.salesRepId][s.status] = s._count.id;
  }

  return reps.map(rep => {
    const s = statsMap[rep.id] ?? {};
    const delivered = s.DELIVERED ?? 0;
    const failed = s.FAILED ?? 0;
    const confirmed = s.CONFIRMED ?? 0;
    const pending = s.PENDING ?? 0;
    const cancelled = s.CANCELLED ?? 0;
    const pendingOrders = pending + confirmed;
    const total = delivered + failed + confirmed + pending + cancelled;
    const dispatched = delivered + failed;
    const deliveryRate = dispatched > 0 ? delivered / dispatched : 0;
    const confirmationRate = total > 0 ? (confirmed + delivered) / total : 0;
    const performance = Math.min(100, Math.round((deliveryRate * 0.6 + confirmationRate * 0.4) * 100));
    return { ...rep, pendingOrders, performance };
  });
}

export async function getSalesRepById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true, whatsappNumber: true,
      avatarUrl: true, isActive: true, isTeamLead: true, createdAt: true,
      team: { select: { id: true, name: true } },
    },
  });
}

export async function getSalesRepOrderSummary(id: string) {
  const counts = await prisma.order.groupBy({
    by: ["status"],
    where: { salesRepId: id, deletedAt: null },
    _count: { id: true },
  });
  const map = Object.fromEntries(counts.map(c => [c.status, c._count.id]));
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return {
    total,
    pending: map.PENDING ?? 0,
    confirmed: map.CONFIRMED ?? 0,
    delivered: map.DELIVERED ?? 0,
    cancelled: map.CANCELLED ?? 0,
    failed: map.FAILED ?? 0,
  };
}

export async function getSalesRepAnalytics(salesRepId: string) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const allOrders = await prisma.order.findMany({
    where: { salesRepId, deletedAt: null },
    select: {
      status: true, customerId: true, createdAt: true,
      items: { select: { productId: true, quantity: true, product: { select: { name: true } } } },
    },
  });

  const thisMonthOrders = allOrders.filter(o => o.createdAt >= thisMonthStart);
  const lastMonthOrders = allOrders.filter(o => o.createdAt >= lastMonthStart && o.createdAt <= lastMonthEnd);

  const current = computeRepMetrics(thisMonthOrders);
  const previous = computeRepMetrics(lastMonthOrders);

  return {
    current,
    trends: {
      totalProductsSold: trendLabel(current.totalProductsSold, previous.totalProductsSold),
      distinctCustomers: trendLabel(current.distinctCustomers, previous.distinctCustomers),
      generalPerformance: trendLabel(current.generalPerformance, previous.generalPerformance),
      upsellRate: trendLabel(current.upsellRate, previous.upsellRate),
      confirmationRate: trendLabel(current.confirmationRate, previous.confirmationRate),
      deliveryRate: trendLabel(current.deliveryRate, previous.deliveryRate),
      cancellationRate: trendLabel(current.cancellationRate, previous.cancellationRate),
    },
  };
}

export async function deleteUser(id: string) {
  const orderCount = await prisma.order.count({ where: { salesRepId: id, deletedAt: null } });
  if (orderCount > 0) {
    throw new Error(`Cannot delete: this user has ${orderCount} order(s). Suspend the account instead.`);
  }
  return prisma.user.delete({ where: { id } });
}

export async function updateUserRole(id: string, role: UserRole) {
  return prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function suspendUser(id: string) {
  return prisma.user.update({ where: { id }, data: { isActive: false } });
}

export async function activateUser(id: string) {
  return prisma.user.update({ where: { id }, data: { isActive: true } });
}

export async function updateUserPassword(id: string, hashedPassword: string) {
  return prisma.user.update({ where: { id }, data: { password: hashedPassword } });
}

export async function toggleTeamLead(id: string, isTeamLead: boolean) {
  return prisma.user.update({ where: { id }, data: { isTeamLead } });
}

export async function changeUserTeam(id: string, teamId: string | null) {
  return prisma.user.update({ where: { id }, data: { teamId } });
}

export async function getAllTeams() {
  return prisma.team.findMany({
    select: { id: true, name: true, department: true },
    orderBy: { name: "asc" },
  });
}

export async function getPendingActivationRequests() {
  return prisma.user.findMany({
    where: { accountActivationStatus: "PENDING" },
    select: { id: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTeamLeads() {
  return prisma.user.findMany({
    where: { isTeamLead: true, accountActivationStatus: "APPROVED", isActive: true },
    select: {
      id: true,
      name: true,
      role: true,
      team: { select: { id: true, name: true, department: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function approveAccount(id: string) {
  return prisma.user.update({
    where: { id },
    data: { accountActivationStatus: "APPROVED", isActive: true },
  });
}

export async function rejectAccount(id: string) {
  return prisma.user.update({
    where: { id },
    data: { accountActivationStatus: "REJECTED", isActive: false },
  });
}
