import { prisma } from "@/lib/db/prisma";
import type { OrderStatus } from "@prisma/client";

/**
 * Orders service — business logic for order lifecycle management.
 *
 * Order lifecycle:
 * CREATED → CONFIRMED → ASSIGNED → DELIVERED → COMPLETED
 */

export async function getAllOrders() {
  return prisma.order.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({ where: { id } });
}

export async function createOrder(data: {
  customerName: string;
  totalAmount: number;
}) {
  return prisma.order.create({
    data: {
      customerName: data.customerName,
      totalAmount: data.totalAmount,
      status: "CREATED",
    },
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return prisma.order.update({ where: { id }, data: { status } });
}
