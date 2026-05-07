"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const dispatchSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  driverAgentId: z.string().optional(),
});

export async function dispatchOrderAction(
  orderId: string,
  driverAgentId?: string
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const parsed = dispatchSchema.safeParse({ orderId, driverAgentId: driverAgentId || undefined });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });

  if (!order) return { success: false, error: "Order not found" };
  if (order.status !== "CONFIRMED") return { success: false, error: "Only CONFIRMED orders can be dispatched" };

  const existing = await prisma.delivery.findFirst({
    where: { orderId, status: "PENDING_DISPATCH" },
    select: { id: true },
  });

  if (existing) {
    await prisma.delivery.update({
      where: { id: existing.id },
      data: {
        status: "IN_TRANSIT",
        agentId: driverAgentId || null,
        scheduledTime: new Date(),
      },
    });
  } else {
    await prisma.delivery.create({
      data: {
        orderId,
        agentId: driverAgentId || null,
        status: "IN_TRANSIT",
        scheduledTime: new Date(),
      },
    });
  }

  revalidatePath("/logistics/deliveries");
  revalidatePath("/logistics/orders");
  revalidatePath(`/logistics/orders/${orderId}`);

  return { success: true };
}
