import { prisma } from "@/lib/db/prisma";
import type { OrderStatus } from "@prisma/client";

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
        select: { name: true },
      },
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
        select: { id: true, companyName: true, state: true },
      },
      items: {
        include: { product: { select: { id: true, name: true } } },
      },
      salesRep: {
        select: { id: true, name: true },
      },
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}
